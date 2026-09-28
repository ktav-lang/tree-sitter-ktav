//! Embedded NUL and true EOF both report `lookahead == 0`; the scanner
//! must use `lexer->eof()` to distinguish them. Values without a final
//! newline must keep the same node types as newline-terminated values.

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
/// Fixed under #243 for object_pair, keyword and inline compounds with
/// `_eol`; numeric values additionally require complete EOF scanner tokens.
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

#[test]
fn bare_number_without_trailing_newline_keeps_its_specific_type() {
    for (src, expected_type) in [
        (&b"plain: 1"[..], "integer"),
        (&b"hex: 0x1A"[..], "integer"),
        (&b"plus: +7"[..], "integer"),
        (&b"f: 1.5"[..], "float"),
        (&b"exp: 1e03"[..], "float"),
        (&b"zero_exp: 0e3"[..], "float"),
        (&b"leading_zero: 01.5"[..], "scalar"),
        (&b"leading_zero_int: 0_7"[..], "scalar"),
        (&b"not_float: 1.2.3"[..], "scalar"),
    ] {
        let tree = parse(src);
        assert!(
            !tree.root_node().has_error(),
            "{:?}: {}",
            src,
            tree.root_node().to_sexp()
        );
        assert!(
            tree.root_node().to_sexp().contains(expected_type),
            "{:?}: expected a {} node, got {}",
            String::from_utf8_lossy(src),
            expected_type,
            tree.root_node().to_sexp()
        );
    }
}

#[test]
fn eof_and_newline_values_have_the_same_tree() {
    for body in [
        "0", "-0", "+7", "0x1A", "0o755", "0b101", "1_000", "1.5", "0e3", "1e+03", "1e-10",
        "1_000.5", "01234", "0_7", "01.5", "1.2.3", "1e", "1e+", "0x", "0x_1", "1__2", "1_", "_1",
        "1a", "true", "hello",
    ] {
        let terminated = parse(format!("value: {body}\n").as_bytes());
        let eof = parse(format!("value: {body}").as_bytes());
        assert_eq!(
            eof.root_node().to_sexp(),
            terminated.root_node().to_sexp(),
            "different EOF tree for {body}"
        );
    }
}

#[test]
fn numeric_edge_whitespace_matches_the_spec_set() {
    for ws in [
        '\t', '\u{000B}', '\u{000C}', ' ', '\u{0085}', '\u{00A0}', '\u{1680}', '\u{2000}',
        '\u{2001}', '\u{2002}', '\u{2003}', '\u{2004}', '\u{2005}', '\u{2006}', '\u{2007}',
        '\u{2008}', '\u{2009}', '\u{200A}', '\u{2028}', '\u{2029}', '\u{202F}', '\u{205F}',
        '\u{3000}',
    ] {
        for terminator in ["", "\n"] {
            let source = format!("value: 1{ws}{terminator}");
            let tree = parse(source.as_bytes());
            let sexp = tree.root_node().to_sexp();
            assert!(!tree.root_node().has_error(), "U+{:04X}: {sexp}", ws as u32);
            assert!(sexp.contains("(integer"), "U+{:04X}: {sexp}", ws as u32);
        }
    }
}

#[test]
fn root_items_and_comments_keep_their_tree_at_eof() {
    for source in [
        "plain",
        "1",
        "1.5",
        "true",
        ":: raw",
        "[a, b]",
        "{}",
        "[]",
        "()",
        "(())",
        "::",
        "## comment",
        "a: 1\n## comment",
    ] {
        let with_newline = parse(format!("{source}\n").as_bytes());
        assert!(
            !with_newline.root_node().has_error(),
            "newline form of {source:?}: {}",
            with_newline.root_node().to_sexp()
        );
        let at_eof = parse(source.as_bytes());
        assert_eq!(
            at_eof.root_node().to_sexp(),
            with_newline.root_node().to_sexp(),
            "EOF form of {source:?}"
        );
    }
}

#[test]
fn last_array_item_keeps_its_type_at_eof() {
    for item in [
        "host: localhost",
        "a:b",
        "'tis the season: fa",
        "123",
        "1.5",
        "0_7",
        "true",
        "## comment",
        ":: raw",
        "{}",
        "[]",
        "()",
        "(())",
        "::",
    ] {
        let source = format!("plain\n{item}");
        let with_newline = parse(format!("{source}\n").as_bytes());
        let at_eof = parse(source.as_bytes());
        assert!(
            !at_eof.root_node().has_error(),
            "{item:?}: {}",
            at_eof.root_node().to_sexp()
        );
        assert_eq!(
            at_eof.root_node().to_sexp(),
            with_newline.root_node().to_sexp(),
            "different Array item at EOF: {item:?}"
        );
    }
}

#[test]
fn empty_pair_value_parses_at_eof() {
    for source in ["a:", "a::", "a: ", "a:: ", "a:\u{3000}", "a::\u{3000}"] {
        let with_newline = parse(format!("{source}\n").as_bytes());
        let at_eof = parse(source.as_bytes());
        assert!(
            !at_eof.root_node().has_error(),
            "{source:?}: {}",
            at_eof.root_node().to_sexp()
        );
        assert_eq!(
            at_eof.root_node().to_sexp(),
            with_newline.root_node().to_sexp()
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
