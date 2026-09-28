fn parse(source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser
        .set_language(&tree_sitter_ktav::LANGUAGE.into())
        .expect("loading Ktav grammar");
    parser.parse(source, None).expect("parser returned None")
}

#[test]
fn structural_openers_accept_the_full_spec_whitespace_set() {
    let whitespace = [
        '\t', '\u{000b}', '\u{000c}', ' ', '\u{0085}', '\u{00a0}', '\u{1680}', '\u{2000}',
        '\u{2001}', '\u{2002}', '\u{2003}', '\u{2004}', '\u{2005}', '\u{2006}', '\u{2007}',
        '\u{2008}', '\u{2009}', '\u{200a}', '\u{2028}', '\u{2029}', '\u{202f}', '\u{205f}',
        '\u{3000}',
    ];
    let forms = [("a: {", "}"), ("a: [", "]"), ("a: (", ")"), ("a: ((", "))")];

    for (prefix, closer) in forms {
        for ws in whitespace {
            let source = format!("{prefix}{ws}\n{closer}\n");
            let tree = parse(&source);
            assert!(
                !tree.root_node().has_error(),
                "{source:?} produced {}",
                tree.root_node().to_sexp()
            );
        }
    }
}
