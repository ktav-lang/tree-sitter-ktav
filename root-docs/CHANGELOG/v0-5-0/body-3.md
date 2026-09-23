>>>>> lang=en
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

>>>>> lang=ru
- `grammar.js` переписан под синтаксис 0.5.0; `src/parser.c` и
  `src/grammar.json` регенерированы через `npx tree-sitter generate`.
- `queries/highlights.scm`: убраны захваты `sep_int`, `sep_float`;
  добавлены `(integer) @number`, `(float) @number.float`,
  `(escape_sequence) @string.escape` и захваты inline-компаундов.
- `_scalar_text` (регексп, лежащий под `scalar`) теперь исключает `{`, `[`,
  `(` в позиции 0. Строки, начинающиеся с этих байт, всегда обрабатываются
  структурными правилами или правилами inline-компаундов.
- `_key_segment` теперь также исключает `(` и `)` (они структурны в
  контекстах inline-компаундов 0.5.0).
- Submodule `spec` продвинут до тега `v0.5.0`
  (commit `4d0a8aa — Ktav Specification 0.5.0`).
- Лицензия изменена на **MIT OR Apache-2.0** (двойная). `LICENSE-MIT` и
  `LICENSE-APACHE` добавлены; `package.json` и `Cargo.toml` обновлены.

### Совместимость

- **Несовместимые изменения AST** (потребители должны обновиться):
  - Виды узлов `sep_int`, `sep_float` больше не существуют.
  - `scalar` больше не выпускается после `::` (raw-маркер) — вместо
    него выпускается `raw_scalar`.
  - Строки из чистых целых/float теперь дают узлы `integer`/`float`
    вместо `scalar`.
  - Токены `comment` теперь требуют префикс `##`; строки с одиночным
    `#` парсятся как скаляры или значения пар.

>>>>> lang=zh
- `grammar.js` 为 0.5.0 语法重写；`src/parser.c` 与
  `src/grammar.json` 通过 `npx tree-sitter generate` 重新生成。
- `queries/highlights.scm`：移除了 `sep_int`、`sep_float` 的捕获；
  新增 `(integer) @number`、`(float) @number.float`、
  `(escape_sequence) @string.escape` 及内联复合体捕获。
- `_scalar_text`（`scalar` 背后的正则）现在在第 0 位排除 `{`、`[`、
  `(`。以这些字节开头的行一律由结构规则或内联复合体规则处理。
- `_key_segment` 现在同样排除 `(` 与 `)`（它们在 0.5.0 内联复合体
  语境中属于结构字符）。
- spec 子模块前进到标签 `v0.5.0`
  （提交 `4d0a8aa — Ktav Specification 0.5.0`）。
- 许可证更改为 **MIT OR Apache-2.0**（双重）。新增 `LICENSE-MIT`
  与 `LICENSE-APACHE`；`package.json` 与 `Cargo.toml` 已更新。

### 兼容性

- **破坏性 AST 变更**（使用方必须更新）：
  - `sep_int`、`sep_float` 节点类型不再存在。
  - `::`（raw 标记）之后不再发射 `scalar` —— 改为发射 `raw_scalar`。
  - 纯整数/浮点行现在产生 `integer`/`float` 节点，而非 `scalar`。
  - `comment` 词元现在要求 `##` 前缀；单 `#` 行解析为标量或键值
    对的值。

