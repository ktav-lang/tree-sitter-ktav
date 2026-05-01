# 变更日志 — `tree-sitter-ktav`

`tree-sitter-ktav` 语法的所有显著变更均记录于此。格式遵循
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，本
包遵循[语义化版本](https://semver.org/lang/zh-CN/)：在 1.0 之前，次
版本号增加意味着对解析器输出的 AST 的破坏性变更。

格式规范本身的变更历史见
[`ktav-lang/spec`](https://github.com/ktav-lang/spec) 仓库。

**语言：** [English](CHANGELOG.md) · [Русский](CHANGELOG.ru.md) · **简体中文**

## [0.2.0] — 2026-05-01

严格规范一致性升级。语法现在拒绝上一版本因疏漏而接受的两种语法
形式。

### 新增

- **外部扫描器（`src/scanner.c`）**，提供两个自定义 token：
  - `_marker_ws` — 零宽断言；仅当对分隔符（`:`、`::`、`:i`、
    `:f`）之后的下一个字节为空格、制表符、CR、LF 或 EOF 时成功。
    实现 § 6.10（**MissingSeparatorSpace**）。
  - `_strict_eol` — `[ \t]*\r?\n`（或 EOF）；用作复合值与多行
    字符串闭合括号所在行的行终止符，因此
    `} trailing\n`、`] trailing\n`、`) trailing\n`、
    `)) trailing\n` 现在均为语法错误（§ 5.6.1 与闭合行整洁
    规则）。
- **语料库测试**（`test/corpus/spec-conformance.txt`），覆盖
  四种「贴紧」标记形式、四种空主体形式、四种「空白 + 主体」
  形式、闭合括号后跟随尾随内容的两种情况、含注释与空行的
  多层嵌套，以及围绕两种多行字符串形式的点分键。

### 变更

- `grammar.js` 声明两个新的外部 token，并相应重连
  `object_pair`、`array_item` 与四条复合闭合规则。
- `binding.gyp` 与 `bindings/rust/build.rs` 现在与
  `src/parser.c` 一同编译 `src/scanner.c`。

### 删除（局限性）

- 「分隔符后必须有空白」（§ 6.10）——现已强制。
- 「复合闭合括号后存在尾随内容」——现已对 `}`、`]`、`)`、
  `))` 全部拒绝。

## [0.1.0] — 2026-04-26

首次发布。实现 [Ktav 0.1.0 规范](https://github.com/ktav-lang/spec/blob/main/versions/0.1/spec.md)。

### 新增

- **语法（`grammar.js`）** — 行式 LR(1) 语法，无需外部扫描器。识别：
  - 行注释（`# ...`）和空行；
  - 键值对（四种分隔符：`:`、`::`、`:i`、`:f`）；
  - 点式键（`a.b.c: 值`）；
  - 关键字（`null`、`true`、`false`，区分大小写）；
  - 空内联复合值（`{}`、`[]`、`()`、`(())`）；
  - 多行对象（`{` … `}`）和数组（`[` … `]`）；
  - 多行字符串：去缩进式（`(` … `)`）与原文式（`((` … `))`）；
  - 数组元素的标记前缀（`:: x`、`:i 42`、`:f 0.5`）。
- **Node 绑定**（`bindings/node/*`）— 供 Node.js `tree-sitter` 使用
  的 N-API 绑定。
- **Rust 绑定**（`bindings/rust/*`）— 为 `tree-sitter` crate 提供
  `LANGUAGE: LanguageFn`，并暴露 `HIGHLIGHTS_QUERY`、`LOCALS_QUERY`、
  `INJECTIONS_QUERY`、`NODE_TYPES`。
- **高亮查询**（`queries/highlights.scm`）— 键（`@property`）、关键
  字（`@constant.builtin`）、注释（`@comment`）、标记
  （`@punctuation.special`）、字符串、数字、括号的捕获。
- **作用域查询**（`queries/locals.scm`）— 对象作用域与属性定义。
- **注入查询**（`queries/injections.scm`）— 占位（v0.1.0 暂未定义注
  入）。
- **语料库测试**（`test/corpus/*.txt`）— 12 个文件，覆盖标量、点式
  键、类型标记、raw 标记、关键字、注释、多行与内联复合值、多行字符
  串、嵌套及边界键名。
- **CI**（`.github/workflows/ci.yml`）— 在 Ubuntu / macOS / Windows
  上运行 `tree-sitter generate` 和 `tree-sitter test`。
- **Release**（`.github/workflows/release.yml`）— 当推送 `v*` 标签
  时发布到 crates.io 与 npm，并创建 GitHub Release。

### 已知限制

- 语法**不**强制规范中"标记后必须有空格"规则（§ 6.10）：
  `key:value` 会被解析为 `key + sep_string`，`value` 进入 scalar。
  需要严格 v0.1.0 一致性的消费者请使用规范实现与一致性测试套件。
- 多行字符串内容以不透明的 `multiline_content_line` 词元捕获；解析
  器无法识别带尾随空白的封闭符边界条件（§ 5.6.1）。在真实文档中没
  有影响。
- 不强制缩进——这与规范一致（Ktav 并非缩进敏感的格式）。
