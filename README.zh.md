# tree-sitter-ktav

> 面向 [Ktav (כְּתָב)](https://github.com/ktav-lang/spec)（书面配置
> 格式）的 [tree-sitter](https://tree-sitter.github.io/) 语法。

**Languages:** [English](README.md) · [Русский](README.ru.md) · **简体中文**

**演练场：** 在浏览器中互转 JSON / YAML / TOML / INI ⇄ Ktav — **[ktav-lang.github.io](https://ktav-lang.github.io/)**。

[![Crates.io](https://img.shields.io/crates/v/tree-sitter-ktav?style=flat-square&logo=rust&label=crates.io)](https://crates.io/crates/tree-sitter-ktav)
[![CI](https://img.shields.io/github/actions/workflow/status/ktav-lang/tree-sitter-ktav/ci.yml?style=flat-square&logo=github&label=CI)](https://github.com/ktav-lang/tree-sitter-ktav/actions)
![License: MIT OR Apache-2.0](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue?style=flat-square)
[![Playground](https://img.shields.io/badge/playground-try%20online-7c3aed?style=flat-square&logo=rocket&logoColor=white)](https://ktav-lang.github.io/)
[![npm](https://img.shields.io/npm/v/tree-sitter-ktav.svg)](https://www.npmjs.com/package/tree-sitter-ktav)

---

## 什么是 Ktav？

Ktav（希伯来语 **כְּתָב**，"书写"）是一种纯文本配置格式。形态与
JSON 相同（标量、数组、对象、`null`、布尔值），但字符串不加引号；
普通条目之间不使用逗号（内联复合结构中会使用逗号），并使用点式键
（`server.port: 8080`）表示嵌套。完整规范——所有官
方 Ktav 实现共同遵循的——在
[`ktav-lang/spec`](https://github.com/ktav-lang/spec) 仓库中。

## 什么是 tree-sitter？

[Tree-sitter](https://tree-sitter.github.io/tree-sitter/) 是一种增
量解析器生成器。编辑器（Neovim、Helix、Emacs、VS Code、Zed 等）使用
它实现语法高亮、代码折叠、结构化选择以及其他需要真正解析树而非正则
词法器的功能。每种语言都有自己的语法包；本包就是 Ktav 的语法。

## 安装

### Rust（`tree-sitter` crate）

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

### Node.js（`tree-sitter` 包）

npm 包提供原生源码，而不是预编译的 `.node` 二进制文件。
安装需要 C/C++ 编译工具链及供 `node-gyp` 使用的 Python；
包已包含生成的解析器，因此无需 Tree-sitter CLI。

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

## 编辑器集成

### Neovim（搭配 [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter)）

当前 `nvim-treesitter` 主分支已不再使用旧的
`get_parser_configs()` 注册 API。请从语法仓库构建解析器库，再通过
Neovim 的 Tree-sitter API 加载。构建此语法时，CLI 会自动包含
`src/scanner.c`：

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

先创建目标 `parser` 目录。例如，在 Unix 上运行
`mkdir -p ~/.local/share/nvim/site/parser`，然后在语法仓库中执行
`npx tree-sitter build --output
~/.local/share/nvim/site/parser/ktav.so`。此目录和 `.so` 扩展名是 Unix
示例；请按平台使用 `stdpath("data")` 对应的路径及共享库扩展名（例如
Windows 上的 `.dll`），并同时更新构建命令和 Lua 配置。若显式列出源文件，
请同时包含 `src/parser.c` 和 `src/scanner.c`。将 `queries/highlights.scm`、
`queries/locals.scm` 和 `queries/injections.scm` 复制到
`~/.config/nvim/queries/ktav/`。

### Helix

在 `~/.config/helix/languages.toml` 中：

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

随后执行 `hx --grammar fetch && hx --grammar build`。

### 其他编辑器

语法导出标准的 tree-sitter 节点类型元数据
（`src/node-types.json`）和查询文件（`queries/*.scm`），任何支持
tree-sitter 的编辑器都可以在解析器构建后直接使用。

## 节点类型

以下是 CST（参见 `src/node-types.json`）中的代表性命名节点：

| 节点                      | 捕获内容                                      |
|---------------------------|-----------------------------------------------|
| `source_file`             | 整个文档                                      |
| `comment`                 | `##` 行注释                                   |
| `blank_line`              | 空行                                          |
| `object_pair`             | `key SEP value` 行                            |
| `key` / `dotted_key`      | 键及其点分段                                   |
| `sep_string` / `sep_raw`  | 键值对分隔符 `:` 和 `::`                      |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | 关键字（整行值与内联值） |
| `integer` / `float`       | 数值（整行值与内联值，按 § 5.2 推断）          |
| `scalar` / `raw_scalar`   | 普通及 raw 单行值                              |
| `compound_object`         | `{` … `}` 块                                  |
| `compound_array`          | `[` … `]` 块                                  |
| `inline_object` / `inline_array` | 内联结构及其逗号分隔的条目               |
| `inline_pair` / `inline_value` | 内联结构中的键值对和值                   |
| `array_item` / `top_array_item` | 复合数组和顶层数组中的条目               |
| `multiline_stripped`      | `(` … `)` 块                                  |
| `multiline_verbatim`      | `((` … `))` 块                                |
| `multiline_content_line`  | 多行字符串内的单行                            |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | 内联空形式 |
| `empty_value`             | 分隔符后接最长的允许空白序列，直到行尾或真正的文件末尾 |

`object_pair` 和 `inline_pair` 暴露字段 `key`、`separator`、`value`
（`inline_pair.value` 可选）；`array_item` 与 `top_array_item` 暴露必需的
`value` 和可选的 `marker`。

## 从源码构建

```bash
git clone --recurse-submodules https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm ci                       # 安装 lock 文件固定的 tree-sitter-cli 0.26.8
npx tree-sitter generate     # 重新生成 src/parser.c 等文件
npx tree-sitter test         # 运行 tree-sitter 语料库
cargo test                   # 运行 Rust 测试，包括规范一致性测试
```

`src/parser.c`、`src/grammar.json`、`src/node-types.json` 与
`src/tree_sitter/*` 按 tree-sitter 惯例已纳入 git，下游消费者无需
CLI 即可构建。

## 状态

`0.8.0` — 面向 [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md) 语法的 Tree-sitter 语法包。
语法可无错误地解析所有固定的 spec 0.8 有效样例，并将每个根
Object/Array 与 JSON 预期结果核对。除需验证键的错误（`DuplicateKey`、
`KeyPathConflict`）或解析前检查原始 UTF-8 字节的错误（`InvalidUtf8`）外，
每个无效样例都会产生语法错误。
Tree-sitter 为编辑器构建语法树，不代替参考 Rust 解析器的语义校验。

## 许可证

基于 **MIT OR Apache-2.0** 双重许可 —— 详见
[LICENSE-MIT](LICENSE-MIT) 与 [LICENSE-APACHE](LICENSE-APACHE)。

## 其他 Ktav 仓库

- [`spec`](https://github.com/ktav-lang/spec) — 规范与一致性测试套件
- [`rust`](https://github.com/ktav-lang/rust) — Rust（`cargo add ktav`）
- [`csharp`](https://github.com/ktav-lang/csharp) — C# / .NET（`dotnet add package Ktav`）
- [`golang`](https://github.com/ktav-lang/golang) — Go
- [`java`](https://github.com/ktav-lang/java) — Java / JVM（Maven Central）
- [`js`](https://github.com/ktav-lang/js) — JS / TS（`npm install @ktav-lang/ktav`）
- [`php`](https://github.com/ktav-lang/php) — PHP（`composer require ktav-lang/ktav`）
- [`python`](https://github.com/ktav-lang/python) — Python（`pip install ktav`）
