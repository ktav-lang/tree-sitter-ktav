# Contributing to tree-sitter-ktav

**Languages:** **English** · [Русский](CONTRIBUTING.ru.md) · [简体中文](CONTRIBUTING.zh.md)

## Core rules

### 1. Every bug fix ships with a regression test

When you find a bug, **before fixing it**, write a test that reproduces
it — the test **must fail on `main`** and pass after the fix. Include
both in the same PR.

Tests live in `test/corpus/` as tree-sitter test fixtures.

### 2. Keep the grammar in sync with the spec

The grammar targets
[`ktav-lang/spec`](https://github.com/ktav-lang/spec). Format-level
changes belong in the spec first; grammar changes follow.

### 3. One concept per commit

Commits should be atomic: a bug fix and its test together, a feature
and its tests together, a rename on its own, a refactor on its own.
`git log --oneline` should read like a changelog. Don't prefix commit
messages with `feat:` / `fix:` — no conventional commits here.

## Dev setup

You need:

- Node **18+**.
- A Rust toolchain via [`rustup`](https://rustup.rs/) (for the Rust
  bindings).
- `git`.

### Build & test

```bash
npm install
npx tree-sitter generate     # generates src/parser.c
npx tree-sitter test         # runs the corpus
```

## Language policy

This repo participates in the org-wide three-language policy (EN / RU /
ZH). Every prose file lives in three parallel versions — see
[`ktav-lang/.github/AGENTS.md`](https://github.com/ktav-lang/.github/blob/main/AGENTS.md)
for the naming convention and the "update all three in one commit"
rule.

### License of contributions

Unless you explicitly state otherwise, any contribution intentionally
submitted for inclusion in this project by you, as defined in the
Apache-2.0 license, shall be dual-licensed as **MIT OR Apache-2.0**,
without any additional terms or conditions.
