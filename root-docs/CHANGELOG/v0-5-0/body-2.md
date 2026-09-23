>>>>> lang=en
- **Inline compounds** (`inline_object`, `inline_array`).
  `{key: val, key2: val2}` and `[v1, v2, v3]` are now valid as a
  pair value or as an array item. Trailing commas are allowed.
  Nesting (`{a: {b: c}}`, `[[1, 2], [3]]`) is supported.
  New corpus file **`test/corpus/inline_compounds.txt`** with four
  test cases.

- **Escape sequences** (`escape_sequence`) inside inline scalars.
  The eight sequences defined in spec § 3.7 (`\\`, `\,`, `\}`, `\]`,
  `\{`, `\[`, `\n`, `\r`) are recognised as distinct AST nodes inside
  `inline_scalar` values. New corpus file
  **`test/corpus/escape_sequences.txt`**.

- **Number literals** (`integer`, `float`).  Pure-number lines are
  now captured as distinct node kinds rather than generic `scalar`,
  enabling distinct syntax highlighting without post-processing.
  Integer: decimal, hex (`0x`), octal (`0o`), binary (`0b`), all
  with optional underscore separators. Float: decimal-point form and
  exponent-only form.  New corpus file
  **`test/corpus/number_literals.txt`** with four test cases.

- **`raw_scalar` node kind** for the body of `::` pairs and `::` array
  items. Unlike `scalar`, `raw_scalar` allows any non-whitespace byte
  at the start of the value (including `(`, `{`, `[`), preserving spec
  § 5.2's guarantee that the raw marker body is never dispatched as a
  compound opener.

### Changed

>>>>> lang=ru
- **Inline-компаунды** (`inline_object`, `inline_array`).
  `{key: val, key2: val2}` и `[v1, v2, v3]` теперь допустимы как
  значение пары или как элемент массива. Завершающие запятые
  разрешены. Вложенность (`{a: {b: c}}`, `[[1, 2], [3]]`)
  поддерживается. Новый файл корпуса
  **`test/corpus/inline_compounds.txt`** с четырьмя тестами.

- **Экранирующие последовательности** (`escape_sequence`) внутри
  inline-скаляров. Восемь последовательностей из спецификации § 3.7
  (`\\`, `\,`, `\}`, `\]`, `\{`, `\[`, `\n`, `\r`)
  распознаются как отдельные узлы AST внутри значений
  `inline_scalar`. Новый файл корпуса
  **`test/corpus/escape_sequences.txt`**.

- **Числовые литералы** (`integer`, `float`).  Строки из одних только
  цифр теперь захватываются как отдельные виды узлов, а не как общий
  `scalar`, что даёт различную подсветку без пост-обработки. Целые:
  десятичные, hex (`0x`), octal (`0o`), binary (`0b`), все с
  необязательными разделителями `_`. Float: форма с десятичной точкой
  и форма с экспонентой.  Новый файл корпуса
  **`test/corpus/number_literals.txt`** с четырьмя тестами.

- **Вид узла `raw_scalar`** для тела пар `::` и элементов массива `::`.
  В отличие от `scalar`, `raw_scalar` допускает любой непробельный байт
  в начале значения (включая `(`, `{`, `[`), сохраняя гарантию
  спецификации § 5.2 о том, что тело raw-маркера никогда не
  диспетчеризуется как открыватель компаунда.

### Изменено

>>>>> lang=zh
- **内联复合体**（`inline_object`、`inline_array`）。
  `{key: val, key2: val2}` 与 `[v1, v2, v3]` 现在可作为键值对的值
  或数组项。允许尾随逗号。支持嵌套（`{a: {b: c}}`、
  `[[1, 2], [3]]`）。新增语料文件
  **`test/corpus/inline_compounds.txt`**，含四个用例。

- **内联标量中的转义序列**（`escape_sequence`）。规范 § 3.7 定义
  的八种序列（`\\`、`\,`、`\}`、`\]`、`\{`、`\[`、
  `\n`、`\r`）现在在 `inline_scalar` 值内部被识别为独立的 AST
  节点。新增语料文件 **`test/corpus/escape_sequences.txt`**。

- **数字字面量**（`integer`、`float`）。  纯数字行现在被捕获为
  独立的节点类型，而非通用的 `scalar`，从而无需后处理即可实现
  不同的语法高亮。整数：十进制、十六进制（`0x`）、八进制
  （`0o`）、二进制（`0b`），均可带下划线分隔符。浮点数：小数
  点形式与纯指数形式。  新增语料文件
  **`test/corpus/number_literals.txt`**，含四个用例。

- **`raw_scalar` 节点类型**  用于 `::` 键值对的值体与 `::` 数组
  项。与 `scalar` 不同，`raw_scalar` 允许值以任意非空白字节开头
  （包括 `(`、`{`、`[`），从而保持规范 § 5.2 的保证：raw 标记
  体绝不会被派发为复合体开启符。

### 变更

