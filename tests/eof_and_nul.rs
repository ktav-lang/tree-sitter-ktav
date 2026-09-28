//! Two things the conformance corpus cannot see, because every fixture in
//! it ends with a newline and none of them embeds a NUL in the middle.
//!
//! On byte 0: tree-sitter reports `lookahead == 0` for BOTH a real
//! end-of-input and an embedded NUL; only `lexer->eof(lexer)` tells them
//! apart, and `src/scanner.c` does not call it — it tests `c == 0`. That
//! conflation is REAL IN THE CODE but, measured, it does not break the
//! compound closers (see the two passing tests below); it breaks the
//! grammar-level `multiline_content_line` regex instead, which is the
//! open question in task #243.
//!
//! On end-of-input: a bare scalar as the final value with NO trailing
//! newline yields a MISSING `_newline` and loses its type. Measured, not
//! inferred — see `bare_scalar_without_trailing_newline` below.

use std::fs;
use std::path::{Path, PathBuf};

fn make_parser() -> tree_sitter::Parser {
    let mut parser = tree_sitter::Parser::new();
    parser
        .set_language(&tree_sitter_ktav::LANGUAGE.into())
        .expect("loading Ktav grammar");
    parser
}

fn parse(src: &[u8]) -> tree_sitter::Tree {
    make_parser()
        .parse(src, None)
        .expect("parser returned None")
}

/// A scanner that mistakes NUL for EOF stops early, so comparing the
/// root's `end_byte` to the input length catches the failure even when no
/// ERROR node is produced.
fn consumed_to_end(src: &[u8], tree: &tree_sitter::Tree) -> bool {
    tree.root_node().end_byte() == src.len()
}

#[test]
fn nul_before_a_compound_closer_does_not_end_the_document() {
    // `}` then NUL then more document. If the closer's external token took
    // the NUL for EOF the parser would stop at byte 15 and never see `b`.
    let src = b"a: {\n    k: 1\n}\0b: 2\n";
    let tree = parse(src);
    assert!(
        consumed_to_end(src, &tree),
        "parser stopped at byte {} of {} — NUL was treated as EOF",
        tree.root_node().end_byte(),
        src.len()
    );
}

#[test]
fn nul_after_a_verbatim_closer_does_not_end_the_document() {
    let src = b"k: ((\nbody\n))\0trailing: 1\n";
    let tree = parse(src);
    assert!(
        consumed_to_end(src, &tree),
        "parser stopped at byte {} of {} — NUL ended the document",
        tree.root_node().end_byte(),
        src.len()
    );
}

#[test]
fn compounds_terminate_correctly_at_a_real_eof() {
    // The external scanner accepts a true end-of-input where a terminator
    // is required. This is what any NUL fix must not regress — and it is
    // also why compounds are unaffected by the gap below.
    for src in [
        &b"a: {\n    k: 1\n}"[..],
        &b"k: ((\nbody\n))"[..],
        &b"arr: [\n    1\n]"[..],
    ] {
        let tree = parse(src);
        assert!(
            !tree.root_node().has_error(),
            "unterminated-but-valid document rejected: {:?}",
            String::from_utf8_lossy(src)
        );
        assert!(
            consumed_to_end(src, &tree),
            "did not consume to EOF: {:?}",
            String::from_utf8_lossy(src)
        );
    }
}

/// A value as the last line with no trailing newline: the core accepts
/// these documents, and before #243 the grammar inserted `MISSING
/// _newline` for every one of them, which editors render as a syntax
/// error. Editors routinely hold buffers with no final newline, so this
/// is the common case, not a corner one.
///
/// Fixed under #243 for object_pair, keyword and the inline compounds by
/// giving those positions the external `_eol` token (a line terminator OR
/// a true EOF, via `lexer->eof()`) instead of the `_newline` regex, which
/// had no EOF alternative. `integer`/`float` are the one kind NOT fixed
/// here — see `bare_number_without_trailing_newline_keeps_its_old_type`
/// below for why.
#[test]
fn no_spurious_error_at_eof_regardless_of_value_kind() {
    for src in [
        &b"plain: 1"[..],
        &b"f: 1.5"[..],
        &b"t: true"[..],
        &b"n: null"[..],
        &b"s: hello"[..],
        &b"raw:: 1"[..],
        &b"o: {a: 1}"[..],
        &b"a: [1, 2]"[..],
        &b"a: 1\nb: 2"[..],
    ] {
        let tree = parse(src);
        assert!(
            !tree.root_node().has_error(),
            "{:?} produced {} — the core accepts this document with no trailing newline",
            String::from_utf8_lossy(src),
            tree.root_node().to_sexp()
        );
    }
}

#[test]
fn keyword_keeps_its_specific_type_at_eof() {
    for (src, expected) in [(&b"t: true"[..], "kw_true"), (&b"n: null"[..], "kw_null")] {
        let tree = parse(src);
        assert!(
            tree.root_node().to_sexp().contains(expected),
            "{:?}: expected {}, got {}",
            String::from_utf8_lossy(src),
            expected,
            tree.root_node().to_sexp()
        );
    }
}

/// The one sub-case #243 leaves open. `integer`/`float` are whole-line
/// regex tokens BY DESIGN (see the comment above their definitions in
/// grammar.js): the mandatory trailing terminator is what stops the float
/// pattern from matching just the "1.2" prefix of "1.2.3" and leaving
/// ".3" as an orphaned token. Making the terminator optional (tried,
/// reverted) fixes EOF but reopens exactly that ambiguity — confirmed by
/// snapshotting all 442 spec fixtures before/after and diffing: several
/// `valid/` fixtures like dotted-key expansions (`a.b: 1` → nested
/// `{a:{b:1}}`, canonical form has adjacent numbers on their own lines
/// with no separator between them) started parsing with ERROR nodes.
/// A real fix needs the number literal itself behind an external token
/// that can call `lexer->eof()`, which is a much larger change than the
/// `_eol` swap above — the same kind of cost the NUL-fixture gap has.
#[test]
#[ignore = "known gap — task #243; integer/float are whole-line tokens \
            whose terminator can't be made EOF-optional without breaking \
            number/non-number disambiguation (verified via full-corpus \
            snapshot diff)"]
fn bare_number_without_trailing_newline_keeps_its_specific_type() {
    for (src, expected_type) in [(&b"plain: 1"[..], "integer"), (&b"f: 1.5"[..], "float")] {
        let tree = parse(src);
        assert!(
            tree.root_node().to_sexp().contains(expected_type),
            "{:?}: expected a {} node, got {}",
            String::from_utf8_lossy(src),
            expected_type,
            tree.root_node().to_sexp()
        );
    }
}

fn spec_nul_fixture() -> Option<PathBuf> {
    let p = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("spec/versions/0.8/tests/valid/key_escaping")
        .join("unicode_escape_nul_inline_value.canonical.ktav");
    p.is_file().then_some(p)
}

/// The fixture task #243 is about: a literal NUL inside a multi-line
/// verbatim body. Fixed by moving `multiline_content_line` off the
/// grammar regex (`[^\r\n]*(\r\n|\r|\n)`, which had no `lexer->eof` to
/// consult) onto an external token that does.
#[test]
fn spec_nul_fixture_parses_cleanly() {
    let path = spec_nul_fixture().expect(
        "spec fixture missing — run `git submodule update --init --recursive`. \
         Refusing to skip: reporting green against zero fixtures is worse \
         than failing.",
    );
    let src = fs::read(&path).expect("reading fixture");
    let tree = parse(&src);
    assert!(
        !tree.root_node().has_error(),
        "{} produced ERROR/MISSING nodes",
        path.display()
    );
}
