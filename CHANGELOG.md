# Changelog — `tree-sitter-ktav`

All notable changes to the `tree-sitter-ktav` grammar are documented
here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this package follows [Semantic Versioning](https://semver.org/) with
the convention that, while pre-1.0, a minor bump signals a breaking
change to the parser's emitted AST.

For the format specification's own history, see the
[`ktav-lang/spec`](https://github.com/ktav-lang/spec) repository.

**Languages:** **English** · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh.md)

## [0.5.0] — 2026-05-27

Spec sync: tracks **Ktav 0.5.0** — a breaking revision of the
format. All changes below correspond to spec delta items listed in
spec 0.5.0 § 1 "Introduction".

### Breaking changes

- **Comment marker: `#` → `##`.**  The `comment` rule now matches
  `/##[^\r\n]*\r?\n/`. A single `#` byte is ordinary content and no
  longer opens a comment; it is valid in keys and scalar values.
  All comment corpus tests updated.

- **Typed markers removed: `:i` and `:f` no longer exist.**  The
  `sep_int` and `sep_float` node kinds are removed from the grammar.
  The only pair separators are now `:` (`sep_string`) and `::` (`sep_raw`).
  `array_item` no longer accepts `:i`/`:f` marker branches.
  Any document that previously used `:i`/`:f` must migrate to a bare
  `:` pair (the spec now infers the type from the scalar's lexical
  form — see number literals below).

### Added

- **Inline compounds** (`inline_object`, `inline_array`).
  `{key: val, key2: val2}` and `[v1, v2, v3]` are now valid as a
  pair value or as an array item. Trailing commas are allowed.
  Nesting (`{a: {b: c}}`, `[[1, 2], [3]]`) is supported.
  New corpus file **`test/corpus/inline_compounds.txt`** with four
  test cases.

- **Escape sequences** (`escape_sequence`) inside inline scalars.
  The eight sequences defined in spec § 3.7 (`\\`, `\,`, `\}`, `\]`,
  `\{`, `\[`, `\n`, `\r`) are recognised as distinct AST nodes inside
  `inline_scalar` values. New corpus file
  **`test/corpus/escape_sequences.txt`**.

- **Number literals** (`integer`, `float`).  Pure-number lines are
  now captured as distinct node kinds rather than generic `scalar`,
  enabling distinct syntax highlighting without post-processing.
  Integer: decimal, hex (`0x`), octal (`0o`), binary (`0b`), all
  with optional underscore separators. Float: decimal-point form and
  exponent-only form.  New corpus file
  **`test/corpus/number_literals.txt`** with four test cases.

- **`raw_scalar` node kind** for the body of `::` pairs and `::` array
  items. Unlike `scalar`, `raw_scalar` allows any non-whitespace byte
  at the start of the value (including `(`, `{`, `[`), preserving spec
  § 5.2's guarantee that the raw marker body is never dispatched as a
  compound opener.

### Changed

- `grammar.js` rewritten for 0.5.0 syntax; `src/parser.c` and
  `src/grammar.json` regenerated with `npx tree-sitter generate`.
- `queries/highlights.scm`: removed captures for `sep_int`, `sep_float`;
  added `(integer) @number`, `(float) @number.float`,
  `(escape_sequence) @string.escape`, and inline-compound captures.
- `_scalar_text` (the backing regex for `scalar`) now excludes `{`, `[`,
  `(` at position 0. Lines that start with those bytes are always handled
  by the structural or inline-compound rules.
- `_key_segment` now also excludes `(` and `)` (they are structural in
  0.5.0 inline compound contexts).
- Spec submodule advanced to tag `v0.5.0`
  (commit `4d0a8aa — Ktav Specification 0.5.0`).
- License changed to **MIT OR Apache-2.0** (dual). `LICENSE-MIT` and
  `LICENSE-APACHE` added; `package.json` and `Cargo.toml` updated.

### Compatibility

- **Breaking AST changes** (consumers must update):
  - `sep_int`, `sep_float` node kinds no longer exist.
  - `scalar` is no longer emitted after `::` (raw marker) — `raw_scalar`
    is emitted instead.
  - Pure integer/float lines now produce `integer`/`float` nodes instead
    of `scalar`.
  - `comment` tokens now require `##` prefix; single-`#` lines parse as
    scalars or pair values.

## [0.3.0] — 2026-05-10

Spec sync: tracks **Ktav 0.1.1** (top-level Array detection,
§ 5.0.1, additive). The grammar now accepts a document whose root
is a sequence of array items — bare scalars, typed-marker items
(`:: …` / `:i …` / `:f …`), lone `{` / `[` openers, multi-line
openers (`(` / `((`), keywords, and inline empty compounds — at
the same level where it previously accepted only key-value pairs.

Pair-shaped lines at the root still parse as `object_pair` (spec
§ 5.0.1 step 2): a colon-bearing line is a pair, not a top-level
Array item. To force a colon-bearing scalar at the root to be
captured as an array item, use the raw marker form
(`:: host: localhost`).

### Added

- New top-level node kind **`top_array_item`**: structurally a
  sibling of `array_item` but emitted only at the document root
  (inside `[…]` the existing `array_item` is still used). Its
  shape is `marker?: <sep_*>`, `value: <…>`. The plain bare-scalar
  branch produces a new **`top_scalar`** node, distinguished from
  the inside-of-pair `scalar` so consumers can tell a top-level
  Array element apart from a pair value at a glance.
- New corpus file **`test/corpus/top_level_array.txt`** with nine
  cases: bare scalars, typed/raw markers, nested objects, nested
  arrays, multi-line items, comments-and-blanks interleaving, the
  pair-wins-at-root rule, top-level keywords, and top-level
  empty inline compounds.
- The conformance suite at `tests/conformance.rs` automatically
  picks up the spec submodule's new
  `valid/top_level_array/**` fixtures (six files); they now pass
  cleanly.

### Changed

- **`grammar.js`**:
  - `_line` (the top-level repetition unit) now branches on
    `top_array_item` in addition to `object_pair`.
  - `comment` is now captured as a single whole-line token
    (`#[^\r\n]*\r?\n`), with `prec(1)`. Previously it was a
    three-piece `seq('#', optional(/[^\r\n]*/), $._newline)`.
    The single-token form is required so that comments out-rank
    the new whole-line `_top_scalar_text` token at the lexer's
    longest-match step. The AST shape of `(comment)` is
    unchanged.
  - The new `_top_scalar_text` token deliberately spans the
    whole line **including the trailing newline**. This makes it
    strictly longer than `_key_segment` (which stops at any
    structural byte) on a colon-free line, so the lexer commits
    to the top-level Array-item path on `foo\n` rather than to
    the always-failing pair-without-separator path. On a
    colon-bearing line the regex cannot match at all (`:` is
    excluded), so `_key_segment` is the only viable token and
    the parser correctly enters `object_pair`.
- Spec submodule advanced to `7256816` (`spec 0.1.1: top-level
  Array support`).

### Compatibility

- Existing top-level Object documents parse with **identical AST
  shape** as in 0.2.x. There are no removed node kinds, no
  renamed fields, and no parser errors introduced for any
  previously-valid input.
- Consumers that walk `source_file` children must now also
  handle `top_array_item` (in addition to `comment`,
  `blank_line`, `object_pair`). Highlights, locals, and
  injections queries in `queries/*.scm` were not affected.

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
