>>>>> lang=en
- The spaced-key positional rule applies per segment, not per word
  (§ 5.3.3).
- The full 25-code-point whitespace set (§ 3.3) is recognised and
  trimmed at token edges, not the narrower ASCII-only set used before.
- A lone CR is accepted as a valid line terminator (§ 3.2).
- A raw `#` is admitted as an ordinary key character (§ 3.4, § 4).
- Inline raw scalars after `::` get their own dedicated grammar rule
  (§ 4, § 5.8.5) instead of falling through the generic scalar path.
- Embedded NUL bytes in multi-line string content are treated as content,
  not EOF; the external scanner now consumes the whole content line.
- Bare scalar values, keywords and inline compounds at true EOF no longer
  need a trailing newline or produce a missing-newline error. Integer/float
  node typing at EOF remains a separate limitation.
- Redundant-leading-zero decimals such as `01234` and `01.5` are scalar
  nodes, not integer/float nodes, while `0`, `0.5`, and base-prefixed
  integers keep their numeric nodes (§ 5.2).

### Changed

- Conformance suite walks the spec **0.8.0** corpus (was 0.6).
- CI: `cargo publish` uses Trusted Publishing (OIDC); `npm publish`
  prefers OIDC and can fall back to a registry token.

>>>>> lang=ru
- Правило позиционирования ключей с пробелами применяется к каждому
  сегменту, а не к слову (§ 5.3.3).
- Полный набор пробельных символов из 25 кодовых точек (§ 3.3) распознаётся и
  отсекается на границах токенов, а не прежний, более узкий набор только из ASCII.
- Одиночный CR принимается как корректный терминатор строки (§ 3.2).
- Сырой `#` допускается как обычный символ ключа (§ 3.4, § 4).
- Inline-raw-скаляры после `::` получают собственное правило
  грамматики (§ 4, § 5.8.5), вместо провала на общий путь скаляра.
- Встроенный NUL-байт в содержимом многострочной строки считается частью
  содержимого, а не EOF; внешний сканер теперь читает всю строку.
- Голые скалярные значения, ключевые слова и встроенные составные значения
  в конце файла больше не требуют завершающего перевода строки и не создают
  отсутствующий узел перевода строки. Типизация узлов integer/float на EOF
  остаётся отдельным ограничением.
- Десятичные формы с избыточным ведущим нулём, например `01234` и `01.5`,
  становятся узлами скаляра, а не integer/float; `0`, `0.5` и числа с
  префиксом основания сохраняют числовые узлы (§ 5.2).

### Изменено

- Conformance-набор обходит корпус спецификации **0.8.0** (ранее 0.6).
- CI: `cargo publish` использует Trusted Publishing (OIDC);
  `npm publish` предпочитает OIDC, но может использовать токен реестра.

>>>>> lang=zh
- 带空格键的位置规则按段应用，而非按词
  （§ 5.3.3）。
- 完整的 25 个码位空白字符集（§ 3.3）会被识别，
  并在词元边缘裁去，而非此前较窄的纯 ASCII 集。
- 单独的 CR 现在被接受为合法的行终止符（§ 3.2）。
- 原始 `#` 现在允许作为普通键字符（§ 3.4、§ 4）。
- `::` 之后的内联 raw 标量现在有专用的语法规则
  （§ 4、§ 5.8.5），而不再落入通用标量路径。
- 多行字符串内容中的嵌入 NUL 字节现在视为内容而非 EOF；外部扫描器
  会继续读取完整内容行。
- 文件末尾的裸标量值、关键字和内联复合值不再要求末尾换行，也不会
  产生缺失换行节点。EOF 处 integer/float 节点类型仍有独立限制。
- `01234`、`01.5` 等带冗余前导零的十进制形式归为标量节点，
  不再归为 integer/float；`0`、`0.5` 和带进制前缀的整数仍保留
  数值节点（§ 5.2）。

### 变更

- 一致性套件现在遍历规范 **0.8.0** 语料（此前为 0.6）。
- CI：`cargo publish` 使用 Trusted Publishing（OIDC）；
  `npm publish` 优先使用 OIDC，也可回退到 registry 令牌。

