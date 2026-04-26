# Changelog — `tree-sitter-ktav`

All notable changes to the `tree-sitter-ktav` grammar are documented
here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this package follows [Semantic Versioning](https://semver.org/) with
the convention that, while pre-1.0, a minor bump signals a breaking
change to the parser's emitted AST.

For the format specification's own history, see the
[`ktav-lang/spec`](https://github.com/ktav-lang/spec) repository.

**Languages:** **English** · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh.md)

## [0.1.0] — 2026-04-26

Initial release. Implements [Ktav spec 0.1.0](https://github.com/ktav-lang/spec/blob/main/versions/0.1/spec.md).

### Added

- **Grammar (`grammar.js`)** — line-oriented LR(1) grammar for Ktav
  v0.1.0 with no external scanner. Recognises:
  - line comments (`# ...`)
  - blank lines
  - object pairs with all four separators (`:`, `::`, `:i`, `:f`)
  - dotted keys (`a.b.c: value`)
  - keywords (`null`, `true`, `false`, case-sensitive)
  - empty inline compounds (`{}`, `[]`, `()`, `(())`)
  - multi-line objects (`{` … `}`) and arrays (`[` … `]`)
  - multi-line strings, both stripped (`(` … `)`) and verbatim
    (`((` … `))`)
  - array items with marker prefixes (`:: x`, `:i 42`, `:f 0.5`)
- **Node bindings** (`bindings/node/*`) — N-API binding for use with
  `tree-sitter` from Node.js.
- **Rust bindings** (`bindings/rust/*`) — exposes `LANGUAGE: LanguageFn`
  for the `tree-sitter` crate, plus `HIGHLIGHTS_QUERY`,
  `LOCALS_QUERY`, `INJECTIONS_QUERY`, `NODE_TYPES`.
- **Highlight queries** (`queries/highlights.scm`) — captures for
  keys (`@property`), keywords (`@constant.builtin`), comments
  (`@comment`), markers (`@punctuation.special`), strings, numbers,
  brackets.
- **Locals queries** (`queries/locals.scm`) — object scopes and
  property definitions.
- **Injections queries** (`queries/injections.scm`) — placeholder
  (no injections defined for v0.1.0).
- **Corpus tests** (`test/corpus/*.txt`) — twelve files covering
  scalars, dotted keys, typed markers, raw markers, keywords,
  comments, multi-line and inline compounds, multi-line strings,
  nesting, and edge-case keys.
- **CI** (`.github/workflows/ci.yml`) — runs `tree-sitter generate`
  and `tree-sitter test` on Ubuntu / macOS / Windows.
- **Release** (`.github/workflows/release.yml`) — on tag `v*`,
  publishes to crates.io and npm and creates a GitHub Release.

### Known limitations

- The grammar does **not** enforce the spec's "mandatory whitespace
  after marker" rule (§ 6.10) — `key:value` parses as `key + sep_string`
  with `value` becoming part of the scalar. Lints / consumers that
  need strict v0.1.0 compliance should run the upstream spec
  conformance suite via the canonical implementations.
- Multi-line string content is captured as opaque `multiline_content_line`
  tokens; the parser cannot detect content lines whose trimmed form
  equals the block terminator with trailing whitespace pathologies
  (§ 5.6.1 edge cases). Real-world documents are unaffected.
- Indentation is not enforced — Ktav itself is not
  indentation-significant, so this matches the spec.
