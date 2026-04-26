//! Tree-sitter grammar for Ktav (כְּתָב) — the Written Configuration Format.
//!
//! Spec: <https://github.com/ktav-lang/spec/blob/main/versions/0.1/spec.md>
//!
//! # Example
//!
//! ```no_run
//! let mut parser = tree_sitter::Parser::new();
//! parser
//!     .set_language(&tree_sitter_ktav::LANGUAGE.into())
//!     .expect("loading Ktav grammar");
//! let tree = parser.parse("name: Russia\n", None).unwrap();
//! println!("{}", tree.root_node().to_sexp());
//! ```

use tree_sitter_language::LanguageFn;

extern "C" {
    fn tree_sitter_ktav() -> *const ();
}

/// The tree-sitter [`Language`][tree_sitter::Language] for the Ktav grammar.
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_ktav) };

/// The syntax-highlight query (`queries/highlights.scm`).
pub const HIGHLIGHTS_QUERY: &str = include_str!("../../queries/highlights.scm");

/// The local-variable / scope query (`queries/locals.scm`).
pub const LOCALS_QUERY: &str = include_str!("../../queries/locals.scm");

/// The injection query (`queries/injections.scm`).
pub const INJECTIONS_QUERY: &str = include_str!("../../queries/injections.scm");

/// The `node-types.json` describing every node kind in this grammar.
pub const NODE_TYPES: &str = include_str!("../../src/node-types.json");

#[cfg(test)]
mod tests {
    #[test]
    fn can_load_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE.into())
            .expect("Error loading Ktav language");
    }

    #[test]
    fn parses_basic_document() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE.into())
            .expect("Error loading Ktav language");
        let tree = parser
            .parse("name: Russia\nport:i 8080\n", None)
            .expect("parse failed");
        let sexp = tree.root_node().to_sexp();
        assert!(sexp.contains("object_pair"));
        assert!(sexp.contains("sep_int"));
        assert!(!tree.root_node().has_error());
    }
}
