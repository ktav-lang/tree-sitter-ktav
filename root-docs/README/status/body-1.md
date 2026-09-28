>>>>> lang=en
## Status

`0.8.0` — implements [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md).
The grammar is checked against the spec 0.8 valid fixtures, with five
named root-kind cases still producing error nodes. See the allow-list in
`tests/conformance.rs`. Tree-sitter supplies editor syntax trees; it
does not perform the semantic validation of the reference Rust parser.

>>>>> lang=ru
## Статус

`0.8.0` — реализует [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md).
Грамматика проверяется на валидных фикстурах spec 0.8, но пять
перечисленных случаев определения вида корня пока дают узлы ошибок.
Список исключений находится в `tests/conformance.rs`. Tree-sitter
строит синтаксическое дерево для редакторов и не заменяет
семантическую проверку эталонного Rust-парсера.

>>>>> lang=zh
## 状态

`0.8.0` — 实现 [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md)。
语法使用 spec 0.8 的有效样例验证，但五个已列出的根类型判定样例
仍会产生错误节点；例外清单位于 `tests/conformance.rs`。Tree-sitter
为编辑器构建语法树，不代替参考 Rust 解析器的语义校验。

