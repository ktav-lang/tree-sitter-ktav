# tree-sitter-ktav

> 面向 [Ktav (כְּתָב)](https://github.com/ktav-lang/spec)（书面配置
> 格式）的 [tree-sitter](https://tree-sitter.github.io/) 语法。

**语言：** [English](README.md) · [Русский](README.ru.md) · **简体中文**

[![CI](https://github.com/ktav-lang/tree-sitter-ktav/actions/workflows/ci.yml/badge.svg)](https://github.com/ktav-lang/tree-sitter-ktav/actions/workflows/ci.yml)
[![crates.io](https://img.shields.io/crates/v/tree-sitter-ktav.svg)](https://crates.io/crates/tree-sitter-ktav)
[![npm](https://img.shields.io/npm/v/tree-sitter-ktav.svg)](https://www.npmjs.com/package/tree-sitter-ktav)

---

## 什么是 Ktav？

Ktav（希伯来语 **כְּתָב**，"书写"）是一种纯文本配置格式。形态与
JSON 相同（标量、数组、对象、`null`、布尔值），但字符串无引号、无逗
号，并使用点式键（`server.port: 8080`）表示嵌套。完整规范——所有官
方 Ktav 实现共同遵循的——在
[`ktav-lang/spec`](https://github.com/ktav-lang/spec) 仓库中。

## 什么是 tree-sitter？

[Tree-sitter](https://tree-sitter.github.io/tree-sitter/) 是一种增
量解析器生成器。编辑器（Neovim、Helix、Emacs、VS Code、Zed 等）使用
它实现语法高亮、代码折叠、结构化选择以及其他需要真正解析树而非正则
词法器的功能。每种语言都有自己的语法包；本包就是 Ktav 的语法。

## 安装

### Rust

```toml
[dependencies]
tree-sitter      = "0.25"
tree-sitter-ktav = "0.1"
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

### Node.js

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

## 编辑器集成

### Neovim（搭配 [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter)）

在语法尚未上游之前，请在配置中手动注册：

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

随后执行 `:TSInstall ktav`。把 `queries/highlights.scm`、
`queries/locals.scm` 与 `queries/injections.scm` 放入
`~/.config/nvim/queries/ktav/`（或让 `nvim-treesitter` 自动从仓库
拉取）。

### Helix

在 `~/.config/helix/languages.toml` 中：

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

随后执行 `hx --grammar fetch && hx --grammar build`。

### 其他编辑器

语法导出标准的 tree-sitter 节点类型元数据
（`src/node-types.json`）和查询文件（`queries/*.scm`），任何支持
tree-sitter 的编辑器都可以在解析器构建后直接使用。

## 节点类型

语法生成以下命名节点：

| 节点                      | 捕获内容                                      |
|---------------------------|-----------------------------------------------|
| `source_file`             | 整个文档                                      |
| `comment`                 | `#` 行注释                                    |
| `blank_line`              | 空行                                          |
| `object_pair`             | `key SEP value` 行                            |
| `key` / `dotted_key`      | 键部分（可包含 `.` 分隔符）                   |
| `sep_string` / `sep_raw` / `sep_int` / `sep_float` | 四种分隔符           |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | 关键字               |
| `scalar`                  | 通用单行值正文                                |
| `compound_object`         | `{` … `}` 块                                  |
| `compound_array`          | `[` … `]` 块                                  |
| `array_item`              | 数组中的单个元素                              |
| `multiline_stripped`      | `(` … `)` 块                                  |
| `multiline_verbatim`      | `((` … `))` 块                                |
| `multiline_content_line`  | 多行字符串内的单行                            |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | 内联空形式 |
| `empty_value`             | 分隔符紧跟行尾                                |

`object_pair` 暴露字段 `key`、`separator`、`value`；`array_item`
暴露 `marker`（可选）和 `value`。

## 从源码构建

```bash
git clone https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm install
npx tree-sitter generate     # 生成 src/parser.c
npx tree-sitter test         # 运行语料库
```

`src/parser.c`、`src/grammar.json`、`src/node-types.json` 与
`src/tree_sitter/*` 按 tree-sitter 惯例已纳入 git，下游消费者无需
CLI 即可构建。

## 状态

`0.1.0` — 实现 [Ktav 0.1.0](https://github.com/ktav-lang/spec/blob/main/versions/0.1/spec.md)。
语法接受所有合法的 Ktav 0.1.0 文档（对 spec 仓库下
`tests/valid/*.ktav` 全部用例验证通过）。它是一个语法接受器，而非
严格的规范校验器——少数语法接受但规范拒绝的边界情况（主要是 § 6.10
"标记后必须有空格"）见 [`CHANGELOG.md`](CHANGELOG.md)。

## 许可证

MIT — 见 [LICENSE](LICENSE)。

## 其他 Ktav 仓库

- [`spec`](https://github.com/ktav-lang/spec) — 规范与一致性测试套件
- [`rust`](https://github.com/ktav-lang/rust) — Rust（`cargo add ktav`）
- [`csharp`](https://github.com/ktav-lang/csharp) — C# / .NET（`dotnet add package Ktav`）
- [`golang`](https://github.com/ktav-lang/golang) — Go
- [`java`](https://github.com/ktav-lang/java) — Java / JVM（Maven Central）
- [`js`](https://github.com/ktav-lang/js) — JS / TS（`npm install @ktav-lang/ktav`）
- [`php`](https://github.com/ktav-lang/php) — PHP（`composer require ktav-lang/ktav`）
- [`python`](https://github.com/ktav-lang/python) — Python（`pip install ktav`）
