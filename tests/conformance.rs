//! Conformance test: walk the language-agnostic Ktav test suite under
//! `spec/versions/0.7/tests/` (a git submodule of `ktav-lang/spec`) and
//! exercise the tree-sitter grammar against every fixture.
//!
//! For tree-sitter we cannot validate full structural conformance the
//! way the reference Rust parser can — tree-sitter's job is to build a
//! syntax tree, not enforce document-level rules like `DuplicateName`
//! or `PathConflict`. So we apply a coarser conformance contract:
//!
//! * `valid/**.ktav` — the grammar MUST produce a tree with no
//!   `is_error()` nodes and no `is_missing()` nodes. Whether the tree
//!   shape matches the JSON oracle is out of scope here (that lives in
//!   the reference parser's suite).
//!
//! * `invalid/**.ktav` — many grammar-level errors (unbalanced
//!   brackets, empty key, etc.) DO surface as `ERROR` / `MISSING`
//!   nodes, but some semantic-only invalids (e.g. `DuplicateName`,
//!   `PathConflict`) parse cleanly at the syntactic level and only
//!   fail at the validation pass that the reference parser performs.
//!   We therefore do NOT assert that the tree-sitter grammar rejects
//!   every invalid fixture — we only sanity-check that the grammar
//!   doesn't panic and produces *some* tree. A future enhancement is
//!   to maintain a list of categories that ARE syntactically catchable
//!   (e.g. `UnbalancedBracket`, `EmptyKey`, `MismatchedBracket`,
//!   `MissingSeparatorSpace`) and assert error nodes for those.
//!
//! If the spec submodule is not initialised (e.g. fresh clone without
//! `--recurse-submodules`), every test in this file is skipped with a
//! clear message — keeping `cargo test` green for contributors who
//! haven't fetched the submodule yet, while CI (which uses
//! `submodules: recursive`) exercises the full suite.
//!
//! ## Known grammar divergences (allow-list)
//!
//! Six valid-fixture cases currently round-trip with grammar errors; they
//! are tracked in `KNOWN_VALID_FAILURES` below as NAMED entries — five
//! belonging to gap G5 (root-kind dispatch, see
//! `docs/spec-0.7-gap-audit.md` § 5) and one NUL-byte lexer limitation —
//! each carrying its own justification comment in the list. A new failing
//! fixture that is NOT in the list is a hard failure by design. Removing
//! an entry when the grammar gains support is a one-line follow-up.

use std::fs;
use std::path::{Path, PathBuf};

/// Valid fixtures that the tree-sitter grammar does NOT currently parse
/// cleanly, listed by path suffix relative to `spec/versions/0.7/tests/`.
/// Every entry MUST carry a justification comment naming the gap and the
/// spec section; a fixture failing that is NOT listed here is a hard
/// test failure by design (never a tolerated count). Removing an entry
/// when the grammar gains support is a one-line follow-up.
const KNOWN_VALID_FAILURES: &[&str] = &[
    // ---- Gap G5: root-kind detection is not enforced (§ 5.0.1 rule 7). ----
    // Valid only under stateful root-kind dispatch, which tree-sitter's
    // regex lexer cannot express; see docs/spec-0.7-gap-audit.md § 5.
    // An open design decision, deliberately not fixed blindly.
    //
    // Unterminated leading quote: § 5.3.3 / § 5.0.1 rule 7 re-classify
    // the line as a root-Array String item; the grammar lexes a pair
    // and errors. The .canonical twins are byte-identical to their
    // primaries (the decoded value is not representable, so the writer
    // echoes the raw line).
    "valid/quoted_keys/unterminated_double_quote_first_line_falls_back.ktav",
    "valid/quoted_keys/unterminated_double_quote_first_line_falls_back.canonical.ktav",
    "valid/quoted_keys/unterminated_leading_quote_falls_back_to_array_item.ktav",
    "valid/quoted_keys/unterminated_leading_quote_falls_back_to_array_item.canonical.ktav",
    //
    // Canonical form of a root-Array whose sole item is the String
    // "a:b": the bare line must be read as an Array item (§ 5.0.1
    // rule 7 / § 5.4 rule 9), but without root-kind state the grammar
    // commits to object_pair and then — correctly — rejects it for
    // missing whitespace after the separator (§ 6.10). Same G5
    // decision.
    "valid/top_level_array/glued_colon_first_item.canonical.ktav",
    //
    // NOT G5: the value contains a literal NUL byte inside a multiline
    // verbatim body. tree-sitter's lexer cannot lex a token across a
    // NUL byte (byte 0 doubles as the EOF sentinel), so
    // multiline_content_line ([^\r\n]*(\r\n|\r|\n)) fails on the line
    // "x\0y". A real fix needs an external content-line token that
    // disambiguates true EOF via lexer->eof(); documented here rather
    // than half-fixed in the grammar.
    "valid/key_escaping/unicode_escape_nul_inline_value.canonical.ktav",
];

fn spec_tests_dir() -> Option<PathBuf> {
    let manifest = env!("CARGO_MANIFEST_DIR");
    let p = Path::new(manifest).join("spec/versions/0.7/tests");
    if p.join("valid").is_dir() && p.join("invalid").is_dir() {
        Some(p)
    } else {
        None
    }
}

fn collect_ktav_files(root: &Path) -> Vec<PathBuf> {
    let mut out = Vec::new();
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let entries = match fs::read_dir(&dir) {
            Ok(it) => it,
            Err(_) => continue,
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
            } else if path.extension().and_then(|s| s.to_str()) == Some("ktav") {
                out.push(path);
            }
        }
    }
    out.sort();
    out
}

fn make_parser() -> tree_sitter::Parser {
    let mut parser = tree_sitter::Parser::new();
    parser
        .set_language(&tree_sitter_ktav::LANGUAGE.into())
        .expect("loading Ktav grammar");
    parser
}

/// Walk the tree and return `(error_count, missing_count)`.
fn count_errors(node: tree_sitter::Node) -> (usize, usize) {
    let mut errs = 0usize;
    let mut miss = 0usize;
    let mut cursor = node.walk();
    let mut stack = vec![node];
    while let Some(n) = stack.pop() {
        if n.is_error() {
            errs += 1;
        }
        if n.is_missing() {
            miss += 1;
        }
        for child in n.children(&mut cursor) {
            stack.push(child);
        }
    }
    (errs, miss)
}

#[test]
fn conformance_valid_fixtures_parse_cleanly() {
    let Some(tests_dir) = spec_tests_dir() else {
        eprintln!(
            "skipping: spec submodule not initialised (run \
             `git submodule update --init --recursive`)"
        );
        return;
    };

    let valid_dir = tests_dir.join("valid");
    let files = collect_ktav_files(&valid_dir);
    assert!(
        !files.is_empty(),
        "no .ktav fixtures found under {}",
        valid_dir.display()
    );

    let mut parser = make_parser();
    let mut failures: Vec<String> = Vec::new();
    let mut allowed_failures: Vec<String> = Vec::new();
    let total = files.len();
    for path in &files {
        let bytes = fs::read(path).unwrap_or_else(|e| panic!("read {}: {}", path.display(), e));
        let tree = match parser.parse(&bytes, None) {
            Some(t) => t,
            None => {
                failures.push(format!("{}: parser returned None", path.display()));
                continue;
            }
        };
        let (errs, miss) = count_errors(tree.root_node());
        if errs > 0 || miss > 0 {
            // Path-suffix match against the known-failures allow-list,
            // using forward slashes to stay portable across OSes.
            let rel = path
                .strip_prefix(&tests_dir)
                .unwrap_or(path)
                .to_string_lossy()
                .replace('\\', "/");
            if KNOWN_VALID_FAILURES.iter().any(|sfx| rel == *sfx) {
                allowed_failures.push(rel);
            } else {
                failures.push(format!(
                    "{}: {} ERROR + {} MISSING nodes; sexp:\n{}",
                    path.display(),
                    errs,
                    miss,
                    tree.root_node().to_sexp()
                ));
            }
        }
    }

    if !failures.is_empty() {
        panic!(
            "{} of {} valid fixtures failed (outside the known-failures \
             allow-list):\n{}",
            failures.len(),
            total,
            failures.join("\n---\n")
        );
    }
    eprintln!(
        "conformance: {} valid fixtures parsed cleanly ({} known \
         grammar gaps allowed: {:?})",
        total - allowed_failures.len(),
        allowed_failures.len(),
        allowed_failures
    );
}

#[test]
fn conformance_invalid_fixtures_do_not_panic() {
    let Some(tests_dir) = spec_tests_dir() else {
        eprintln!(
            "skipping: spec submodule not initialised (run \
             `git submodule update --init --recursive`)"
        );
        return;
    };

    let invalid_dir = tests_dir.join("invalid");
    let files = collect_ktav_files(&invalid_dir);
    assert!(
        !files.is_empty(),
        "no .ktav fixtures found under {}",
        invalid_dir.display()
    );

    let mut parser = make_parser();
    let total = files.len();
    let mut with_grammar_errors = 0usize;
    for path in &files {
        let bytes = fs::read(path).unwrap_or_else(|e| panic!("read {}: {}", path.display(), e));
        // tree-sitter must always produce *some* tree (it's
        // error-recovering by design); we only assert no panic.
        let tree = parser
            .parse(&bytes, None)
            .unwrap_or_else(|| panic!("{}: parser returned None", path.display()));
        let (errs, miss) = count_errors(tree.root_node());
        if errs + miss > 0 {
            with_grammar_errors += 1;
        }
    }
    eprintln!(
        "conformance: {} invalid fixtures parsed; {} surfaced ERROR/MISSING \
         nodes at the grammar level (the rest are semantic-only invalids)",
        total, with_grammar_errors
    );
}
