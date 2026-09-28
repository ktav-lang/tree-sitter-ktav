>>>>> lang=en
## Status

`0.8.0` — Tree-sitter grammar targeting the syntax in [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md).
The grammar parses every pinned spec 0.8 valid fixture without error and
checks each Object/Array root against its JSON oracle. Every invalid
fixture yields a syntax error, except the semantic-only categories
(`DuplicateKey`, `KeyPathConflict`, `InvalidUtf8`): Tree-sitter supplies
editor syntax trees; it does not perform the semantic validation of the
reference Rust parser.

>>>>> lang=ru
## Статус

`0.8.0` — Tree-sitter-грамматика синтаксиса [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md).
Грамматика разбирает все закреплённые валидные фикстуры spec 0.8 без
ошибок и сверяет корневой Object/Array с JSON-оракулом. Каждая
невалидная фикстура даёт синтаксическую ошибку, кроме семантических
категорий (`DuplicateKey`, `KeyPathConflict`, `InvalidUtf8`): Tree-sitter
строит синтаксическое дерево для редакторов и не заменяет
семантическую проверку эталонного Rust-парсера.

>>>>> lang=zh
## 状态

`0.8.0` — 面向 [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md) 语法的 Tree-sitter 语法包。
语法可无错误地解析所有固定的 spec 0.8 有效样例，并将每个根
Object/Array 与 JSON 预期结果核对。除语义类错误（`DuplicateKey`、
`KeyPathConflict`、`InvalidUtf8`）外，每个无效样例都会产生语法错误：
Tree-sitter 为编辑器构建语法树，不代替参考 Rust 解析器的语义校验。

