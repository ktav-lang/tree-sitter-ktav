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
//!   `is_error()` nodes and no `is_missing()` nodes. The root kind is
//!   checked against the JSON oracle; deeper Values belong to the
//!   reference parser's suite.
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

use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

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
            failures.push(format!(
                "{}: {} ERROR + {} MISSING nodes; sexp:\n{}",
                path.display(),
                errs,
                miss,
                tree.root_node().to_sexp()
            ));
        }
    }

    if !failures.is_empty() {
        panic!(
            "{} of {} valid fixtures failed:\n{}",
            failures.len(),
            total,
            failures.join("\n---\n")
        );
    }
    eprintln!("conformance: {total} valid files parsed cleanly");
}

#[test]
fn valid_fixture_roots_match_json_oracles() {
    let tests_dir = spec_tests_dir();
    let files = collect_ktav_files(&tests_dir.join("valid"));
    let mut parser = make_parser();
    for path in files {
        let name = path.file_name().unwrap().to_str().unwrap();
        let stem = name
            .strip_suffix(".canonical.ktav")
            .or_else(|| name.strip_suffix(".ktav"))
            .unwrap();
        let oracle = path.with_file_name(format!("{stem}.json"));
        let expected: serde_json::Value =
            serde_json::from_slice(&fs::read(&oracle).expect("read JSON oracle"))
                .expect("parse JSON oracle");
        let source = fs::read(&path).expect("read Ktav fixture");
        let tree = parser.parse(&source, None).expect("parser returned None");
        assert!(
            !tree.root_node().has_error(),
            "{}: {}",
            path.display(),
            tree.root_node().to_sexp()
        );
        let mut cursor = tree.root_node().walk();
        let content: Vec<_> = tree
            .root_node()
            .named_children(&mut cursor)
            .filter(|node| node.kind() != "comment" && node.kind() != "blank_line")
            .collect();
        match expected {
            serde_json::Value::Object(_) => {
                if let Some(first) = content.first() {
                    if first.kind() == "object_pair" {
                        assert!(
                            content.iter().all(|node| node.kind() == "object_pair"),
                            "{}: {}",
                            path.display(),
                            tree.root_node().to_sexp()
                        );
                    } else {
                        assert_eq!(first.kind(), "top_array_item", "{}", path.display());
                        assert_eq!(content.len(), 1, "{}", path.display());
                        let value = first.child_by_field_name("value").expect("root value");
                        assert!(
                            ["compound_object", "inline_object", "empty_object"]
                                .contains(&value.kind()),
                            "{}: {}",
                            path.display(),
                            tree.root_node().to_sexp()
                        );
                    }
                }
            }
            serde_json::Value::Array(_) => {
                assert!(!content.is_empty(), "{}: empty Array root", path.display());
                assert!(
                    content.iter().all(|node| node.kind() == "top_array_item"),
                    "{}: {}",
                    path.display(),
                    tree.root_node().to_sexp()
                );
                let value = content[0].child_by_field_name("value").expect("root value");
                if ["compound_array", "inline_array", "empty_array"].contains(&value.kind()) {
                    assert_eq!(content.len(), 1, "{}", path.display());
                }
            }
            _ => panic!("{}: oracle root is not Object or Array", oracle.display()),
        }
    }
}

#[test]
fn spec_08_known_syntactic_invalid_inputs_surface_errors() {
    let mut parser = make_parser();
    let invalid_dir = spec_tests_dir().join("invalid");
    let mut found = [false; 3];
    for path in collect_ktav_files(&invalid_dir) {
        let bytes = fs::read(&path).expect("read invalid fixture");
        let first_line = bytes
            .split(|byte| *byte == b'\r' || *byte == b'\n')
            .next()
            .unwrap_or_default();
        let first_content = first_line
            .iter()
            .find(|&&byte| !matches!(byte, b' ' | b'\t' | 0x0B | 0x0C));
        let bad_control_key = first_line
            .split(|byte| *byte == b':')
            .next()
            .unwrap_or_default()
            .contains(&0x1C);
        let cases = [
            first_content.copied() == Some(b'}'),
            first_content.copied() == Some(b']'),
            bad_control_key,
        ];
        if cases.iter().any(|matched| *matched) {
            let tree = parser.parse(&bytes, None).expect("parser returned None");
            assert!(
                tree.root_node().has_error(),
                "{}: {}",
                path.display(),
                tree.root_node().to_sexp()
            );
            for (index, matched) in cases.iter().enumerate() {
                found[index] |= *matched;
            }
        }
    }
    assert!(
        found[0],
        "missing first-line UnbalancedBracket brace fixture"
    );
    assert!(
        found[1],
        "missing first-line UnbalancedBracket bracket fixture"
    );
    assert!(found[2], "missing InvalidKey U+001C fixture");

    for source in ["}", "]"] {
        let tree = parser.parse(source, None).expect("parser returned None");
        assert!(
            tree.root_node().has_error(),
            "{source:?}: {}",
            tree.root_node().to_sexp()
        );
    }
}

#[test]
fn spec_08_unbalanced_closers_after_array_items_are_errors() {
    let mut parser = make_parser();
    for closer in ['}', ']'] {
        for source in [format!("x\n{closer}\n"), format!("x\n{closer}")] {
            let tree = parser.parse(&source, None).expect("parser returned None");
            assert!(
                tree.root_node().has_error(),
                "{source:?}: {}",
                tree.root_node().to_sexp()
            );
        }
    }

    for source in [
        "x\ntext with [brackets] and } braces\n",
        "x\n\"quoted ] and } content\"\n",
    ] {
        let tree = parser.parse(source, None).expect("parser returned None");
        assert!(
            !tree.root_node().has_error(),
            "{source:?}: {}",
            tree.root_node().to_sexp()
        );
    }
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

#[test]
fn first_content_line_fixes_the_root_kind() {
    let mut parser = make_parser();
    for source in [
        "## header\nplain\nhost: localhost\n",
        "## header\nplain\nhost: localhost",
    ] {
        let array = parser.parse(source, None).expect("parser returned None");
        let array_tree = array.root_node().to_sexp();
        assert!(!array.root_node().has_error(), "{array_tree}");
        assert_eq!(
            array_tree.matches("(top_array_item").count(),
            2,
            "{array_tree}"
        );
        assert!(!array_tree.contains("(object_pair"), "{array_tree}");
    }

    for source in ["a: 1\nplain\n", "{a: 1}\nb: 2\n", "[\n  1\n]\nextra\n"] {
        let tree = parser.parse(source, None).expect("parser returned None");
        assert!(
            tree.root_node().has_error(),
            "{source:?}: {}",
            tree.root_node().to_sexp()
        );
    }
}

#[test]
fn first_line_non_pairs_are_array_items() {
    let mut parser = make_parser();
    for source in [
        "a:b\n",
        "a:b",
        "'tis the season: fa\n",
        "'tis the season: fa",
        "\"tis the season: fa\n",
        "\"tis the season: fa",
    ] {
        let tree = parser.parse(source, None).expect("parser returned None");
        let sexp = tree.root_node().to_sexp();
        assert!(!tree.root_node().has_error(), "{source:?}: {sexp}");
        assert!(sexp.contains("(top_array_item"), "{source:?}: {sexp}");
        assert!(!sexp.contains("(object_pair"), "{source:?}: {sexp}");
    }
}

#[test]
fn first_line_pair_detection_respects_quotes_and_escapes() {
    let mut parser = make_parser();
    for source in [
        "\"a:b\": 1\n",
        "a.\"b:c\": 1\n",
        "foo'bar: 1\n",
        "a\\:b: 1\n",
    ] {
        let tree = parser.parse(source, None).expect("parser returned None");
        let sexp = tree.root_node().to_sexp();
        assert!(!tree.root_node().has_error(), "{source:?}: {sexp}");
        assert!(sexp.contains("(object_pair"), "{source:?}: {sexp}");
    }
    for source in ["a:b: c\n", "a\\:b\n", "\"a:b\"\n"] {
        let tree = parser.parse(source, None).expect("parser returned None");
        let sexp = tree.root_node().to_sexp();
        assert!(!tree.root_node().has_error(), "{source:?}: {sexp}");
        assert!(sexp.contains("(top_array_item"), "{source:?}: {sexp}");
        assert!(!sexp.contains("(object_pair"), "{source:?}: {sexp}");
    }
    for source in ["a,b: 1\n", "[bad]: 1\n"] {
        let tree = parser.parse(source, None).expect("parser returned None");
        assert!(
            tree.root_node().has_error(),
            "{source:?}: {}",
            tree.root_node().to_sexp()
        );
    }
}

#[test]
fn editing_the_first_line_reselects_the_root_kind() {
    for (before, after) in [
        ("a: 1\nb: 2\n", "word\nb: 2\n"),
        ("word\nb: 2\n", "a: 1\nb: 2\n"),
    ] {
        let mut parser = make_parser();
        let mut old = parser.parse(before, None).expect("initial parse");
        old.edit(&tree_sitter::InputEdit {
            start_byte: 0,
            old_end_byte: 4,
            new_end_byte: 4,
            start_position: tree_sitter::Point::new(0, 0),
            old_end_position: tree_sitter::Point::new(0, 4),
            new_end_position: tree_sitter::Point::new(0, 4),
        });
        let incremental = parser.parse(after, Some(&old)).expect("incremental parse");
        let fresh = parser.parse(after, None).expect("fresh parse");
        assert_eq!(
            incremental.root_node().to_sexp(),
            fresh.root_node().to_sexp(),
            "root kind changed after edit from {before:?} to {after:?}"
        );
        assert!(
            !incremental.root_node().has_error(),
            "{}",
            incremental.root_node().to_sexp()
        );
    }
}
