>>>>> lang=en
### Fixed

- The full 25-code-point whitespace set (§ 3.3) is recognised
  everywhere: indentation, token-edge trimming, compound openers and
  closers, comments and blank lines — not only ASCII whitespace.
- A lone surrogate in `\uXXXX`, or a high surrogate not followed by a low
  one, is a parse error (`BadEscapeSequence`, § 3.7.1).
- An empty quoted key segment (`""`, `''`, ` `` `) is a parse error
  (`EmptyKey`, § 6.5); `" "` is still a valid one-space key.
- DEL (`0x7F`) is no longer accepted as a bare key character (§ 4).
- The spaced-key positional rule applies per segment, not per word
  (§ 5.3.3).
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
- Highlight queries capture raw top-level and inline scalar values;
  locals queries define scopes and keys for inline objects.
- Inline object and array highlights capture only the anonymous brace
  and bracket delimiter tokens, leaving their contents to their own captures.

>>>>> lang=ru
### Исправлено

- Полный набор пробельных символов из 25 кодовых точек (§ 3.3)
  распознаётся везде: в отступах, при обрезке краёв токенов, в открывающих
  и закрывающих строках составных значений, комментариях и пустых
  строках — а не только ASCII-пробелы.
- Одиночный суррогат в `\uXXXX` или старший суррогат без следующего
  младшего — ошибка разбора (`BadEscapeSequence`, § 3.7.1).
- Пустой сегмент ключа в кавычках (`""`, `''`, ` `` `) — ошибка разбора
  (`EmptyKey`, § 6.5); `" "` по-прежнему корректный ключ из одного пробела.
- DEL (`0x7F`) больше не принимается как символ голого ключа (§ 4).
- Правило позиционирования ключей с пробелами применяется к каждому
  сегменту, а не к слову (§ 5.3.3).
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
- Запросы подсветки захватывают raw-скаляры верхнего уровня и inline-
  скаляры; запросы locals задают области видимости и ключи inline-объектов.
- Подсветка inline-объектов и массивов захватывает только анонимные
  токены фигурных и квадратных скобок; содержимое получает собственные захваты.

>>>>> lang=zh
### 修复

- 完整的 25 个码位空白字符集（§ 3.3）在各处都会被识别：缩进、词元
  边缘裁剪、复合值的开符与闭符、注释和空行——而不只是 ASCII 空白。
- `\uXXXX` 中的单独代理项，或其后未跟低代理项的高代理项，属于解析
  错误（`BadEscapeSequence`，§ 3.7.1）。
- 空的带引号键段（`""`、`''`、` `` `）属于解析错误（`EmptyKey`，
  § 6.5）；`" "` 仍是合法的单空格键。
- DEL（`0x7F`）不再被接受为裸键字符（§ 4）。
- 带空格键的位置规则按段应用，而非按词
  （§ 5.3.3）。
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
- 高亮查询现可捕获顶层及内联 raw 标量；locals 查询为内联对象
  定义作用域和键。
- 内联对象和数组的高亮现在仅捕获匿名的花括号与方括号 token，
  其内容仍由各自的捕获规则着色。

