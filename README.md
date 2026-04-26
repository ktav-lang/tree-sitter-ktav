# tree-sitter-ktav

> A [tree-sitter](https://tree-sitter.github.io/) grammar for
> [Ktav (כְּתָב)](https://github.com/ktav-lang/spec) — the Written
> Configuration Format.

**Languages:** **English** · [Русский](README.ru.md) · [简体中文](README.zh.md)

[![CI](https://github.com/ktav-lang/tree-sitter-ktav/actions/workflows/ci.yml/badge.svg)](https://github.com/ktav-lang/tree-sitter-ktav/actions/workflows/ci.yml)
[![crates.io](https://img.shields.io/crates/v/tree-sitter-ktav.svg)](https://crates.io/crates/tree-sitter-ktav)
[![npm](https://img.shields.io/npm/v/tree-sitter-ktav.svg)](https://www.npmjs.com/package/tree-sitter-ktav)

---

## What is Ktav?

Ktav (Hebrew **כְּתָב**, "writing") is a plain-text configuration
format. JSON-shape (scalars, arrays, objects, `null`, booleans), but
without quotes around strings, without commas, and with dotted keys
(`server.port: 8080`) for nesting. The full specification — the same
one all official Ktav implementations target — lives in the
[`ktav-lang/spec`](https://github.com/ktav-lang/spec) repository.

## What is tree-sitter?

[Tree-sitter](https://tree-sitter.github.io/tree-sitter/) is an
incremental parser generator. Editors (Neovim, Helix, Emacs, VS Code,
Zed, …) use it for syntax highlighting, code folding, structural
selection, and other features that need a real parse tree rather than
a regex-based tokenizer. Each language ships its own grammar package;
this crate / npm package is the one for Ktav.

## Installation

### Rust (`tree-sitter` crate)

```toml
[dependencies]
tree-sitter         = "0.25"
tree-sitter-ktav    = "0.1"
```

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&tree_sitter_ktav::LANGUAGE.into())?;

    let source = "name: Russia\nport:i 8080\n";
    let tree = parser.parse(source, None).unwrap();
    println!("{}", tree.root_node().to_sexp());
    Ok(())
}
```

### Node.js (`tree-sitter` package)

```bash
npm install tree-sitter tree-sitter-ktav
```

```js
const Parser = require("tree-sitter");
const Ktav   = require("tree-sitter-ktav");

const parser = new Parser();
parser.setLanguage(Ktav);

const tree = parser.parse("name: Russia\nport:i 8080\n");
console.log(tree.rootNode.toString());
```

## Editor integration

### Neovim (with [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter))

Until the grammar is upstreamed, register it manually in your config:

```lua
require("nvim-treesitter.parsers").get_parser_configs().ktav = {
  install_info = {
    url = "https://github.com/ktav-lang/tree-sitter-ktav",
    files = { "src/parser.c" },
    branch = "main",
  },
  filetype = "ktav",
}

vim.filetype.add({ extension = { ktav = "ktav" } })
```

Then `:TSInstall ktav`. Drop `queries/highlights.scm`,
`queries/locals.scm`, and `queries/injections.scm` into your
`~/.config/nvim/queries/ktav/` directory (or let nvim-treesitter pick
them up from the parser repo).

### Helix

Add to `~/.config/helix/languages.toml`:

```toml
[[language]]
name      = "ktav"
scope     = "source.ktav"
file-types = ["ktav"]
roots     = []
comment-token = "#"
indent    = { tab-width = 4, unit = "    " }

[[grammar]]
name   = "ktav"
source = { git = "https://github.com/ktav-lang/tree-sitter-ktav", rev = "main" }
```

Then `hx --grammar fetch && hx --grammar build`.

### Other editors

The grammar exports the standard tree-sitter node-type metadata
(`src/node-types.json`) and queries (`queries/*.scm`), so any editor
with tree-sitter support can consume it once the parser is built.

## Node types

The grammar produces the following named nodes:

| Node                       | What it captures                                |
|----------------------------|-------------------------------------------------|
| `source_file`              | the whole document                              |
| `comment`                  | a `#`-line comment                              |
| `blank_line`               | an empty line                                   |
| `object_pair`              | `key SEP value` line                            |
| `key` / `dotted_key`       | the key portion (with optional `.` separators)  |
| `sep_string` / `sep_raw` / `sep_int` / `sep_float` | the four separators       |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | keywords                  |
| `scalar`                   | the catch-all single-line value body            |
| `compound_object`          | `{` … `}` block                                 |
| `compound_array`           | `[` … `]` block                                 |
| `array_item`               | a single item in an array                       |
| `multiline_stripped`       | `(` … `)` block                                 |
| `multiline_verbatim`       | `((` … `))` block                               |
| `multiline_content_line`   | a single line inside a multi-line string        |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | inline empty forms |
| `empty_value`              | separator immediately followed by EOL           |

`object_pair` exposes `key`, `separator`, and `value` as fields;
`array_item` exposes `marker` (optional) and `value`.

## Building from source

```bash
git clone https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm install
npx tree-sitter generate     # writes src/parser.c
npx tree-sitter test         # runs the corpus
```

The generated `src/parser.c`, `src/grammar.json`, `src/node-types.json`,
and `src/tree_sitter/*` are checked into git per tree-sitter convention,
so consumers do not need the CLI to build.

## Status

`0.1.0` — implements [Ktav 0.1.0](https://github.com/ktav-lang/spec/blob/main/versions/0.1/spec.md).
The grammar accepts every valid Ktav 0.1.0 document (verified against
all `tests/valid/*.ktav` fixtures from the spec repo). It is a
syntactic accepter, not a strict spec validator — see
[`CHANGELOG.md`](CHANGELOG.md) "Known limitations" for the small
number of pathological cases the grammar accepts that the spec
rejects (mostly missing-whitespace-after-marker — § 6.10).

## License

MIT — see [LICENSE](LICENSE).

## Other Ktav repositories

- [`spec`](https://github.com/ktav-lang/spec) — specification + conformance suite
- [`rust`](https://github.com/ktav-lang/rust) — Rust (`cargo add ktav`)
- [`csharp`](https://github.com/ktav-lang/csharp) — C# / .NET (`dotnet add package Ktav`)
- [`golang`](https://github.com/ktav-lang/golang) — Go
- [`java`](https://github.com/ktav-lang/java) — Java / JVM (Maven Central)
- [`js`](https://github.com/ktav-lang/js) — JS / TS (`npm install @ktav-lang/ktav`)
- [`php`](https://github.com/ktav-lang/php) — PHP (`composer require ktav-lang/ktav`)
- [`python`](https://github.com/ktav-lang/python) — Python (`pip install ktav`)
