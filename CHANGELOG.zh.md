# 变更日志 — `tree-sitter-ktav`

`tree-sitter-ktav` 语法的所有显著变更均记录于此。格式遵循
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，本
包遵循[语义化版本](https://semver.org/lang/zh-CN/)：在 1.0 之前，次
版本号增加意味着对解析器输出的 AST 的破坏性变更。

格式规范本身的变更历史见
[`ktav-lang/spec`](https://github.com/ktav-lang/spec) 仓库。

**语言：** [English](CHANGELOG.md) · [Русский](CHANGELOG.ru.md) · **简体中文**

## [0.6.0] — 2026-06-01

规范同步：跟进 **Ktav 0.6.0** —— 对键语法的破坏性修订。键现在
处理完整的 `§ 3.7` 转义集，转义表也从 8 项扩展到 10 项。

### 破坏性变更

- **键段现在感知转义。** `key` 段是普通键字节和/或转义序列
  的非空序列。未转义的 `.` 仍然分割点路径；未转义的 `:`
  仍然终止键（它是键值对分隔符）。`\.` 和 `\:` 现在表示
  单个段内的字面点号 / 冒号，因此像 `a.b`、`a:b`、
  `example.com`、`1.0` 这样的键终于可以表达
  （`a\.b`、`a\:b`、`example\.com`、`1\.0`）。
- **`\` 现在是键中的转义引导字符。** 键中的字面反斜杠现在
  必须写作 `\\`。以前 `\` 是普通的键字节。
- **转义表从 8 项扩展到 10 项：** `\\`、`\,`、`\}`、`\]`、
  `\{`、`\[`、`\n`、`\r`、**`\.`**、**`\:`**。这两个新形式
  在键段内和内联标量值内都会被识别（在值中它们是冗余的 ——
  `.` 和 `:` 已经是字面字节 —— 但为对称起见仍接受）。

### 变更

- `_key_segment` 正则更新为
  `([^\s\[\]\{\}\(\):#,.\r\n\\]|\\[\\,\}\]\{\[nr.:])+` ——
  "普通键字节"字符类现在排除原始的 `\`（它成为转义引导），
  而 10 种转义形式中的任何一种都被接受为段的一个单位。
  点路径规则仍按未转义的 `.` 分割。
- `escape_sequence`（内联标量）扩展了 `\\.` 与 `\\:`。

### 测试

- 一致性测试 harness 从 `spec/versions/0.5/tests` 重新指向
  `spec/versions/0.6/tests`。六个新的
  `valid/key_escaping/*.ktav` 样例以及新的
  `invalid/key_escaping/` 与 `invalid/bad_escape/` 分类
  均按预期解析。

### 未变更

- 注释标记仍为 `##`（单独的 `#` 仍是内容字节）。
- 值侧 8 种原有转义的语义不变；值中的 `\.` 与 `\:` 现在
  产生字面 `.` / `:`，而不是 `BadEscapeSequence`（遵循规范）。

## [0.3.0] — 2026-05-10

规范同步：跟进 **Ktav 0.1.1**（顶层 Array 检测，§ 5.0.1，纯增量
变更）。语法现在接受根为数组项序列的文档 —— 裸标量、类型化标记项
（`:: …` / `:i …` / `:f …`）、独立的 `{` / `[` 开启、多行开启
（`(` / `((`）、关键字以及内联空复合体 —— 与之前只接受键-值对的
位置一致。

根处形如「键-值对」的行仍按 `object_pair` 解析（规范 § 5.0.1
第 2 步）：包含冒号的行是键值对，而非顶层 Array 项。如需把根处
含冒号的标量强制识别为数组项，请使用 raw 标记
（`:: host: localhost`）。

### 新增

- 新顶层节点 **`top_array_item`**：结构上是 `array_item` 的
  兄弟，但仅在文档根部发射（`[…]` 内部仍使用既有的
  `array_item`）。形态：`marker?: <sep_*>`、`value: <…>`。
  其裸标量分支产生新节点 **`top_scalar`**，与对内 `scalar`
  区分开，便于使用方一眼识别顶层数组元素与键-值对的值。
- 新增语料文件 **`test/corpus/top_level_array.txt`**，覆盖
  九个用例：裸标量、类型化/raw 标记、嵌套对象、嵌套数组、
  多行项、注释与空行夹杂、根处「键-值对优先」规则、顶层关键字
  与顶层空内联复合体。
- `tests/conformance.rs` 一致性套件自动接入 spec 子模块新增
  的 `valid/top_level_array/**` 样例（六个文件）；全部通过。

### 变更

- **`grammar.js`**：
  - 顶层重复单元 `_line` 现在除了 `object_pair` 还会分支到
    `top_array_item`。
  - `comment` 现以单 token 整行捕获（`#[^\r\n]*\r?\n`），
    带 `prec(1)`。此前为
    `seq('#', optional(/[^\r\n]*/), $._newline)` 的三段拼接。
    单 token 形式是为了在词法器最长匹配阶段令注释胜过新
    引入的整行 `_top_scalar_text` token。`(comment)` 的 AST
    形态不变。
  - 新 token `_top_scalar_text` 故意覆盖**整行包括末尾换
    行**。这令其在不含冒号的行上严格长于 `_key_segment`
    （后者在任意结构字节处停止），从而词法器在 `foo\n` 上
    选择顶层 Array 项分支，而非永远失败的「无分隔符的键-值对」
    分支。在含冒号的行上，正则完全无法匹配（排除 `:`），故
    `_key_segment` 是唯一可行 token，解析器正确进入
    `object_pair`。
- spec 子模块前进到 `7256816`（`spec 0.1.1: top-level Array
  support`）。

### 兼容性

- 现存的顶层 Object 文档与 0.2.x 在 AST 形态上**完全一致**。
  没有删除节点、没有重命名字段、也不会对此前合法的输入引入
  解析错误。
- 遍历 `source_file` 子节点的使用方现在还需要处理
  `top_array_item`（除 `comment`、`blank_line`、
  `object_pair` 之外）。`queries/*.scm` 中的 highlights、
  locals、injections 查询未受影响。

## [0.2.1] — 2026-05-01

缺陷修复版本。conformance 测试套件中此前两个失败的 valid 用例现已
通过，`tests/conformance.rs` 中的 `KNOWN_VALID_FAILURES` 列表已清空。

### 修复

- **§ 5.2（raw / 类型化标记之后的值体不再走多行派发）。** 在 `::`、
  `:i`、`:f` 之后，`grammar.js` 现在仅允许 `empty_value` 或 `scalar`。
  此前以 `(` 开头的值体（例如 `a:: (`）会被错误地识别为多行 stripped
  开始符；现在会被原样捕获为单行标量。同样，`null` / `true` / `false`
  在 `::` 之后将解析为 `scalar`，与规范对 raw 标记体的「字面字符串」
  解释一致。（`test/corpus/keywords.txt` 已同步更新，先前的形状不正确。）
- **stripped `(...)` 内部的 `))` 与 verbatim `((...))` 内部的单个 `)`
  现在被视为内容而非闭合符。** 两个闭合符（`)` / `))`）已变为上下文
  相关的外部扫描器 token（`_stripped_close`、`_verbatim_close`）；
  扫描器仅在当前解析状态下有效时发出对应 token，不匹配的括号序列
  会回落到 `multiline_content_line`。

### 新增

- `test/corpus/spec-conformance.txt` 中新增四个 corpus 用例：raw
  标记后带 `(`、`((`、`()`、`(())`；stripped 块内含 `))`；verbatim
  块内含单个 `)`；stripped 块内含 `((`。
- 两个新的外部 token：`_stripped_close`、`_verbatim_close`（在
  `grammar.js` 中声明，在 `src/scanner.c` 中实现）。

### 变更

- `tests/conformance.rs` —— `KNOWN_VALID_FAILURES` 现已为空。

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
