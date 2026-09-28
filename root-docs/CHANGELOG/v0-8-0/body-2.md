>>>>> lang=en
- The spaced-key positional rule applies per segment, not per word
  (§ 5.3.3).
- The full 25-code-point whitespace set (§ 3.3) is recognised and
  trimmed at token edges, not the narrower ASCII-only set used before.
- A lone CR is accepted as a valid line terminator (§ 3.2).
- A raw `#` is admitted as an ordinary key character (§ 3.4, § 4).
- The first content line fixes the root kind (§ 5.0.1): pair-shaped Array
  items stay strings, and closed inline roots reject later content.
  A glued colon or unterminated leading quote can select an Array root.
- Inline raw scalars after `::` get their own dedicated grammar rule
  (§ 4, § 5.8.5) instead of falling through the generic scalar path.
- Embedded NUL bytes in multi-line string content are treated as content,
  not EOF; the external scanner now consumes the whole content line.
- Values at true EOF no longer need a trailing newline or produce a
  missing-newline error. Integers and floats keep their numeric node types.
- EOF number tokens must consume the full value, so `1.2.3` remains a
  string instead of being split after the `1.2` prefix.
- Redundant-leading-zero decimals such as `01234` and `01.5` are scalar
  nodes, not integer/float nodes, while `0`, `0.5`, and base-prefixed
  integers keep their numeric nodes (§ 5.2).

### Changed

- Conformance suite walks the spec **0.8.0** corpus (was 0.6) with no
  valid-fixture allow-list and checks root kinds against JSON oracles.
- CI: `cargo publish` uses Trusted Publishing (OIDC); `npm publish`
  prefers OIDC and can fall back to a registry token.

>>>>> lang=ru
- Правило позиционирования ключей с пробелами применяется к каждому
  сегменту, а не к слову (§ 5.3.3).
- Полный набор пробельных символов из 25 кодовых точек (§ 3.3) распознаётся и
  отсекается на границах токенов, а не прежний, более узкий набор только из ASCII.
- Одиночный CR принимается как корректный терминатор строки (§ 3.2).
- Сырой `#` допускается как обычный символ ключа (§ 3.4, § 4).
- Первая содержательная строка фиксирует вид корня (§ 5.0.1): строки
  Array, похожие на пары, остаются строками; после закрытого inline-корня
  новый контент ошибочен. Склеенное `:` или незакрытая начальная кавычка
  могут выбрать корень Array.
- Inline-raw-скаляры после `::` получают собственное правило
  грамматики (§ 4, § 5.8.5), вместо провала на общий путь скаляра.
- Встроенный NUL-байт в содержимом многострочной строки считается частью
  содержимого, а не EOF; внешний сканер теперь читает всю строку.
- Значения в конце файла больше не требуют завершающего перевода строки
  и не создают отсутствующий узел перевода строки. Числа сохраняют
  узлы integer/float даже на EOF.
- Числовой токен на EOF должен охватить всё значение: `1.2.3` остаётся
  строкой, а не разделяется после префикса `1.2`.
- Десятичные формы с избыточным ведущим нулём, например `01234` и `01.5`,
  становятся узлами скаляра, а не integer/float; `0`, `0.5` и числа с
  префиксом основания сохраняют числовые узлы (§ 5.2).

### Изменено

- Conformance-набор обходит корпус спецификации **0.8.0** (ранее 0.6)
  без исключений valid-фикстур и сверяет вид корня с JSON-оракулами.
- CI: `cargo publish` использует Trusted Publishing (OIDC);
  `npm publish` предпочитает OIDC, но может использовать токен реестра.

>>>>> lang=zh
- 带空格键的位置规则按段应用，而非按词
  （§ 5.3.3）。
- 完整的 25 个码位空白字符集（§ 3.3）会被识别，
  并在词元边缘裁去，而非此前较窄的纯 ASCII 集。
- 单独的 CR 现在被接受为合法的行终止符（§ 3.2）。
- 原始 `#` 现在允许作为普通键字符（§ 3.4、§ 4）。
- 首个内容行决定根类型（§ 5.0.1）：Array 中形似键值对的行仍是
  字符串，已闭合的内联根之后不能再有内容。紧贴的 `:` 或未闭合的
  起始引号可使根类型成为 Array。
- `::` 之后的内联 raw 标量现在有专用的语法规则
  （§ 4、§ 5.8.5），而不再落入通用标量路径。
- 多行字符串内容中的嵌入 NUL 字节现在视为内容而非 EOF；外部扫描器
  会继续读取完整内容行。
- 文件末尾的值不再要求末尾换行，也不会产生缺失换行节点；
  整数和浮点数在 EOF 处仍保留各自的数值节点类型。
- EOF 数值词元必须覆盖整个值，因此 `1.2.3` 仍是字符串，
  不会在 `1.2` 前缀后被拆开。
- `01234`、`01.5` 等带冗余前导零的十进制形式归为标量节点，
  不再归为 integer/float；`0`、`0.5` 和带进制前缀的整数仍保留
  数值节点（§ 5.2）。

### 变更

- 一致性套件现在遍历规范 **0.8.0** 语料（此前为 0.6），不再豁免
  有效样例，并根据 JSON 预期结果检查根类型。
- CI：`cargo publish` 使用 Trusted Publishing（OIDC）；
  `npm publish` 优先使用 OIDC，也可回退到 registry 令牌。

