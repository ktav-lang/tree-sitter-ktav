//! Conformance test: walk the language-agnostic Ktav test suite under
//! `spec/versions/0.8/tests/` (a git submodule of `ktav-lang/spec`) and
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
//! The pinned corpus manifest is checked before any fixture runs.
//! A missing or incomplete submodule fails rather than skipping tests.
//!
//! ## Known grammar divergences (allow-list)
//!
//! Five valid-fixture cases currently produce grammar errors; they
//! are tracked in `KNOWN_VALID_FAILURES` below as NAMED entries in
//! gap G5 (root-kind dispatch, see `docs/spec-0.7-gap-audit.md` § 5),
//! each carrying its own justification comment in the list. A new failing
//! fixture that is NOT in the list is a hard failure by design. Removing
//! an entry when the grammar gains support is a one-line follow-up.

use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

/// Valid fixtures that the tree-sitter grammar does NOT currently parse
/// cleanly, listed by path suffix relative to `spec/versions/0.8/tests/`.
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
];

fn spec_tests_dir() -> PathBuf {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("spec/versions/0.8/tests");
    let manifest =
        fs::read(root.join("manifest.json")).expect("pinned spec corpus manifest missing");
    let manifest: serde_json::Value =
        serde_json::from_slice(&manifest).expect("invalid corpus manifest JSON");
    assert_eq!(
        manifest["schema_version"].as_u64(),
        Some(1),
        "unsupported manifest schema"
    );

    let expected = [
        ("valid", 223_u64),
        ("invalid", 74),
        ("unrepresentable", 5),
        ("parseable-unrepresentable", 4),
        ("strict-lossy", 13),
    ];
    let categories = manifest["categories"]
        .as_object()
        .expect("manifest categories missing");
    assert_eq!(
        categories.len(),
        expected.len(),
        "unknown or missing manifest category"
    );
    let actual_dirs: HashSet<String> = fs::read_dir(&root)
        .expect("corpus directory missing")
        .map(|entry| entry.expect("corpus directory entry").path())
        .filter(|path| path.is_dir())
        .map(|path| path.file_name().unwrap().to_string_lossy().into_owned())
        .collect();
    let expected_dirs: HashSet<String> = expected
        .iter()
        .map(|(name, _)| (*name).to_owned())
        .collect();
    assert_eq!(
        actual_dirs, expected_dirs,
        "corpus category directories changed"
    );
    let actual_root_files: HashSet<String> = fs::read_dir(&root)
        .expect("corpus directory missing")
        .map(|entry| entry.expect("corpus directory entry").path())
        .filter(|path| path.is_file())
        .map(|path| path.file_name().unwrap().to_string_lossy().into_owned())
        .collect();
    assert_eq!(
        actual_root_files,
        ["manifest.json", "boundary-fixtures.json"]
            .into_iter()
            .map(str::to_owned)
            .collect(),
        "unexpected corpus root files"
    );

    let flags = manifest["fixture_flags"]
        .as_array()
        .expect("fixture_flags missing");
    let mut raw_inputs = HashSet::new();
    for entry in flags {
        let category = entry["category"].as_str().expect("flag category missing");
        let fixture = entry["fixture"].as_str().expect("flag fixture missing");
        let names = entry["flags"].as_array().expect("fixture flags missing");
        assert_eq!(
            category, "invalid",
            "raw_bytes flag applies only to invalid inputs"
        );
        assert_eq!(names.len(), 1, "unknown or duplicate fixture flags");
        assert_eq!(names[0].as_str(), Some("raw_bytes"), "unknown fixture flag");
        assert!(fixture
            .split('/')
            .all(|part| !part.is_empty() && part != "." && part != ".."));
        let input = root.join(category).join(fixture).with_extension("ktav");
        assert!(
            raw_inputs.insert(input.clone()),
            "duplicate fixture flag entry"
        );
        assert!(
            input.is_file(),
            "flag refers to missing fixture: {}",
            input.display()
        );
    }

    for (category, count) in expected {
        assert_eq!(
            categories[category]["count"].as_u64(),
            Some(count),
            "manifest fixture count changed: {category}"
        );
        let dir = root.join(category);
        let files = collect_files(&dir);
        let primary: Vec<&PathBuf> = files
            .iter()
            .filter(|path| {
                if category == "unrepresentable" {
                    path.extension().and_then(|s| s.to_str()) == Some("json")
                } else {
                    path.extension().and_then(|s| s.to_str()) == Some("ktav")
                        && !path.to_string_lossy().ends_with(".canonical.ktav")
                }
            })
            .collect();
        assert_eq!(
            primary.len() as u64,
            count,
            "missing or extra {category} fixtures"
        );
        let mut expected_files = HashSet::new();
        for path in primary {
            expected_files.insert(path.clone());
            if category != "unrepresentable" {
                expected_files.insert(path.with_extension("json"));
                if category == "valid" {
                    expected_files.insert(path.with_extension("canonical.ktav"));
                }
            }
        }
        let actual_files: HashSet<PathBuf> = files.into_iter().collect();
        assert_eq!(
            actual_files, expected_files,
            "fixture companions changed: {category}"
        );
        for path in actual_files {
            let bytes = fs::read(&path).expect("read fixture");
            if raw_inputs.contains(&path) {
                assert!(
                    std::str::from_utf8(&bytes).is_err(),
                    "raw_bytes fixture is valid UTF-8"
                );
            } else {
                std::str::from_utf8(&bytes)
                    .unwrap_or_else(|_| panic!("unflagged non-UTF-8 fixture: {}", path.display()));
            }
        }
    }
    root
}

fn collect_files(root: &Path) -> Vec<PathBuf> {
    let mut out = Vec::new();
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        for entry in fs::read_dir(&dir).expect("read fixture directory") {
            let path = entry.expect("read fixture entry").path();
            if path.is_dir() {
                stack.push(path);
            } else {
                out.push(path);
            }
        }
    }
    out
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
    let tests_dir = spec_tests_dir();

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
    assert_eq!(
        allowed_failures.len(),
        KNOWN_VALID_FAILURES.len(),
        "a documented grammar gap no longer fails; update the allow-list"
    );
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
    let tests_dir = spec_tests_dir();

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

#[test]
fn conformance_parseable_noncanonical_fixtures_parse_cleanly() {
    let tests_dir = spec_tests_dir();
    let mut parser = make_parser();
    for (category, expected_count) in [("parseable-unrepresentable", 4), ("strict-lossy", 13)] {
        let files = collect_ktav_files(&tests_dir.join(category));
        assert_eq!(
            files.len(),
            expected_count,
            "wrong {category} fixture count"
        );
        for path in files {
            let bytes = fs::read(&path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
            let tree = parser.parse(&bytes, None).expect("parser returned None");
            assert_eq!(
                count_errors(tree.root_node()),
                (0, 0),
                "syntax error in {category} fixture {}",
                path.display()
            );
        }
    }
}

#[test]
fn spec_08_redundant_leading_zeros_are_scalar_nodes() {
    let mut parser = make_parser();
    for (body, expected) in [
        ("01234", "scalar"),
        ("-045", "scalar"),
        ("00", "scalar"),
        ("0_7", "scalar"),
        ("01.5", "scalar"),
        ("05e3", "scalar"),
        ("0", "integer"),
        ("0.5", "float"),
        ("0x1A", "integer"),
        ("0o755", "integer"),
        ("0b1010", "integer"),
        ("1_000_000", "integer"),
        ("+7", "integer"),
        ("1e03", "float"),
    ] {
        let source = format!("value: {body}\n");
        let tree = parser.parse(&source, None).expect("parser returned None");
        assert!(
            !tree.root_node().has_error(),
            "{body}: {}",
            tree.root_node().to_sexp()
        );
        let sexp = tree.root_node().to_sexp();
        assert!(
            sexp.contains(&format!("({expected}")),
            "{body}: expected {expected}, got {sexp}"
        );
        if expected == "scalar" {
            assert!(
                !sexp.contains("(integer") && !sexp.contains("(float"),
                "{body}: {sexp}"
            );
        }
    }
}

#[test]
fn editor_queries_compile() {
    let language = tree_sitter_ktav::LANGUAGE.into();
    for (name, source) in [
        ("highlights", include_str!("../queries/highlights.scm")),
        ("injections", include_str!("../queries/injections.scm")),
        ("locals", include_str!("../queries/locals.scm")),
    ] {
        tree_sitter::Query::new(&language, source)
            .unwrap_or_else(|error| panic!("{name} query failed: {error}"));
    }
}
