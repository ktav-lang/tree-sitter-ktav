# Changelog — `tree-sitter-ktav`

All notable changes to the `tree-sitter-ktav` grammar are documented
here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this package follows [Semantic Versioning](https://semver.org/) with
the convention that, while pre-1.0, a minor bump signals a breaking
change to the parser's emitted AST.

For the format specification's own history, see the
[`ktav-lang/spec`](https://github.com/ktav-lang/spec) repository.

**Languages:** **English** · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh.md)

## [0.2.1] — 2026-05-01

Bug-fix release. Two valid-fixture gaps from the conformance suite
are now closed, so `KNOWN_VALID_FAILURES` in `tests/conformance.rs`
is empty.

### Fixed

- **§ 5.2 (raw / typed marker bodies are NOT dispatched).** After
  `::`, `:i`, or `:f` the value is now restricted in `grammar.js` to
  `empty_value` or `scalar`. Previously a body that began with `(` —
  e.g. `a:: (` — was mis-dispatched as a multi-line stripped opener;
  now it is captured verbatim as a one-line scalar. This also makes
  `null` / `true` / `false` after `::` parse as a `scalar`, matching
  the spec's "literal string" interpretation of raw-marker bodies.
  (`test/corpus/keywords.txt` updated; the prior shape was incorrect.)
- **`))` inside a stripped `(...)` and `)` inside a verbatim
  `((...))` are now content, not a closer.** The two compound
  closers `)` / `))` became context-sensitive external scanner tokens
  (`_stripped_close`, `_verbatim_close`) so the scanner only emits
  the one valid in the current parse state, and a non-matching
  bracket sequence falls through to `multiline_content_line`.

### Added

- Four corpus tests in `test/corpus/spec-conformance.txt`: raw-marker
  with `(`, `((`, `()`, `(())` bodies; stripped block containing
  `))`; verbatim block containing single `)`; stripped block
  containing `((`.
- Two new external tokens: `_stripped_close`, `_verbatim_close`
  (declared in `grammar.js`, implemented in `src/scanner.c`).

### Changed

- `tests/conformance.rs` — `KNOWN_VALID_FAILURES` is now empty.

## [0.2.0] — 2026-05-01

Strict spec-conformance pass. The grammar now rejects the two
syntactic forms that the previous release accepted by oversight.

### Added

- **External scanner (`src/scanner.c`)** with two custom tokens:
  - `_marker_ws` — zero-width assertion; succeeds only when the
    byte immediately after a pair separator (`:`, `::`, `:i`, `:f`)
    is space, tab, CR, LF, or EOF. Enforces § 6.10
    (**MissingSeparatorSpace**).
  - `_strict_eol` — `[ \t]*\r?\n` (or EOF); used as the line
    terminator for compound and multi-line-string closers, so that
    `} trailing\n`, `] trailing\n`, `) trailing\n`, `)) trailing\n`
    are now syntax errors (§ 5.6.1 and the closer-cleanliness rule).
- **Corpus tests** (`test/corpus/spec-conformance.txt`) covering
  the four glued-marker forms, the four empty-body forms, the four
  whitespace-and-body forms, both trailing-after-closer cases, deep
  nesting with comments and blank lines, and dotted keys around
  both multi-line-string forms.

### Changed

- `grammar.js` declares the two new externals and rewires
  `object_pair`, `array_item`, and the four compound-closer rules
  accordingly.
- `binding.gyp` and `bindings/rust/build.rs` now compile
  `src/scanner.c` alongside `src/parser.c`.

### Removed (limitations)

- The "mandatory whitespace after marker" gap (§ 6.10) — now
  enforced.
- The "trailing content after compound closer" gap — now rejected
  for `}`, `]`, `)`, `))`.

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
