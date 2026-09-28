# tree-sitter-ktav

> A [tree-sitter](https://tree-sitter.github.io/) grammar for
> [Ktav (כְּתָב)](https://github.com/ktav-lang/spec) — the Written
> Configuration Format.

**Languages:** **English** · [Русский](README.ru.md) · [简体中文](README.zh.md)

**Playground:** convert JSON / YAML / TOML / INI ⇄ Ktav in your browser at **[ktav-lang.github.io](https://ktav-lang.github.io/)**.

[![Crates.io](https://img.shields.io/crates/v/tree-sitter-ktav?style=flat-square&logo=rust&label=crates.io)](https://crates.io/crates/tree-sitter-ktav)
[![CI](https://img.shields.io/github/actions/workflow/status/ktav-lang/tree-sitter-ktav/ci.yml?style=flat-square&logo=github&label=CI)](https://github.com/ktav-lang/tree-sitter-ktav/actions)
![License: MIT OR Apache-2.0](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue?style=flat-square)
[![Playground](https://img.shields.io/badge/playground-try%20online-7c3aed?style=flat-square&logo=rocket&logoColor=white)](https://ktav-lang.github.io/)
[![npm](https://img.shields.io/npm/v/tree-sitter-ktav.svg)](https://www.npmjs.com/package/tree-sitter-ktav)

---

## What is Ktav?

Ktav (Hebrew **כְּתָב**, "writing") is a plain-text configuration
format with a JSON-shaped data model (scalars, arrays, objects, `null`,
booleans). Strings are unquoted, ordinary entries have no commas (inline
compounds use commas), and dotted keys (`server.port: 8080`) express
nesting. The full specification — the same
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
tree-sitter-ktav    = "0.8.0"
```

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&tree_sitter_ktav::LANGUAGE.into())?;

    let source = "name: Russia\nport: 8080\n";
    let tree = parser.parse(source, None).unwrap();
    println!("{}", tree.root_node().to_sexp());
    Ok(())
}
```

### Node.js (`tree-sitter` package)

The npm package ships native source, not prebuilt `.node` binaries.
Installation needs a C/C++ build toolchain and Python for `node-gyp`;
the generated parser is included, so the Tree-sitter CLI is not needed.

```bash
npm install tree-sitter tree-sitter-ktav
```

```js
const Parser = require("tree-sitter");
const Ktav   = require("tree-sitter-ktav");

const parser = new Parser();
parser.setLanguage(Ktav);

const tree = parser.parse("name: Russia\nport: 8080\n");
console.log(tree.rootNode.toString());
```

## Editor integration

### Neovim (with [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter))

The current `nvim-treesitter` main branch no longer uses the legacy
`get_parser_configs()` registration API. Build the parser library from the
grammar repository, then load it with Neovim's Tree-sitter API. The CLI
includes `src/scanner.c` automatically when building this grammar:

```lua
require("nvim-treesitter").setup({})
vim.filetype.add({ extension = { ktav = "ktav" } })
vim.treesitter.language.add("ktav", {
  path = vim.fn.stdpath("data") .. "/site/parser/ktav.so",
})
vim.api.nvim_create_autocmd("FileType", {
  pattern = "ktav",
  callback = function() vim.treesitter.start() end,
})
```

Create the target `parser` directory first. On Unix, for example, run
`mkdir -p ~/.local/share/nvim/site/parser`, then build from the grammar
repository with `npx tree-sitter build --output
~/.local/share/nvim/site/parser/ktav.so`. The directory and `.so` filename
are Unix examples; use the path from `stdpath("data")` and your platform's
shared-library extension (for example, `.dll` on Windows) in both the build
command and Lua config. If building from an explicit source-file list,
include both `src/parser.c` and `src/scanner.c`. Copy
`queries/highlights.scm`, `queries/locals.scm`, and `queries/injections.scm`
to `~/.config/nvim/queries/ktav/`.

### Helix

Add to `~/.config/helix/languages.toml`:

```toml
[[language]]
name      = "ktav"
scope     = "source.ktav"
file-types = ["ktav"]
roots     = []
comment-token = "##"
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

Representative named nodes from the CST (`src/node-types.json`) include:

| Node                       | What it captures                                |
|----------------------------|-------------------------------------------------|
| `source_file`              | the whole document                              |
| `comment`                  | a `##`-line comment                             |
| `blank_line`               | an empty line                                   |
| `object_pair`              | `key SEP value` line                            |
| `key` / `dotted_key`       | the key portion and dotted segments             |
| `sep_string` / `sep_raw`   | the `:` and `::` pair separators                |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | keywords, whole-line and inline |
| `integer` / `float`        | numbers, whole-line and inline (§ 5.2 typing)  |
| `scalar` / `raw_scalar`    | ordinary and raw single-line values             |
| `compound_object`          | `{` … `}` block                                 |
| `compound_array`           | `[` … `]` block                                 |
| `inline_object` / `inline_array` | inline compounds with comma-separated entries |
| `inline_pair` / `inline_value` | entries and values in inline compounds        |
| `array_item` / `top_array_item` | items in compound and top-level arrays         |
| `multiline_stripped`       | `(` … `)` block                                 |
| `multiline_verbatim`       | `((` … `))` block                               |
| `multiline_content_line`   | a single line inside a multi-line string        |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | inline empty forms |
| `empty_value`              | separator plus the maximal allowed whitespace run through EOL or true EOF |

`object_pair` and `inline_pair` expose `key`, `separator`, and `value` fields
(`inline_pair.value` is optional); `array_item` and `top_array_item` expose a
required `value` and optional `marker`.

## Building from source

```bash
git clone --recurse-submodules https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm ci                       # installs the locked tree-sitter-cli 0.26.8
npx tree-sitter generate     # regenerates src/parser.c and related files
npx tree-sitter test         # runs the tree-sitter corpus
cargo test                   # Rust tests, including spec conformance
```

The generated `src/parser.c`, `src/grammar.json`, `src/node-types.json`,
and `src/tree_sitter/*` are checked into git per tree-sitter convention,
so consumers do not need the CLI to build.

## Status

`0.8.0` — Tree-sitter grammar targeting the syntax in [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md).
The grammar parses every pinned spec 0.8 valid fixture without error and
checks each Object/Array root against its JSON oracle. Every invalid
fixture yields a syntax error except those needing key validation
(`DuplicateKey`, `KeyPathConflict`) or pre-parse UTF-8 byte validation
(`InvalidUtf8`). Tree-sitter supplies
editor syntax trees; it does not perform the semantic validation of the
reference Rust parser.

## License

Dual-licensed under **MIT OR Apache-2.0** — see
[LICENSE-MIT](LICENSE-MIT) and [LICENSE-APACHE](LICENSE-APACHE).

## Other Ktav repositories

- [`spec`](https://github.com/ktav-lang/spec) — specification + conformance suite
- [`rust`](https://github.com/ktav-lang/rust) — Rust (`cargo add ktav`)
- [`csharp`](https://github.com/ktav-lang/csharp) — C# / .NET (`dotnet add package Ktav`)
- [`golang`](https://github.com/ktav-lang/golang) — Go
- [`java`](https://github.com/ktav-lang/java) — Java / JVM (Maven Central)
- [`js`](https://github.com/ktav-lang/js) — JS / TS (`npm install @ktav-lang/ktav`)
- [`php`](https://github.com/ktav-lang/php) — PHP (`composer require ktav-lang/ktav`)
- [`python`](https://github.com/ktav-lang/python) — Python (`pip install ktav`)
