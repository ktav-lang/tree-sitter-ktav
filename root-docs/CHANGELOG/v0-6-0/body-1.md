>>>>> lang=en
## [0.6.0] — 2026-06-01

Spec sync: tracks **Ktav 0.6.0** — a breaking revision of the key
grammar. Keys now process the full `§ 3.7` escape set, and the escape
table grows from 8 to 10 entries.

### Breaking changes

- **Key segments are now escape-aware.** A `key` segment is a non-empty
  run of plain key bytes and/or escape sequences. An unescaped `.`
  still splits a dotted path; an unescaped `:` still terminates the
  key (it is the pair separator). The bytes `\.` and `\:` now stand
  for a literal dot / literal colon inside a single segment, so keys
  like `a.b`, `a:b`, `example.com` and `1.0` are finally expressible
  (`a\.b`, `a\:b`, `example\.com`, `1\.0`).
- **`\` is now the escape lead in keys.** A literal backslash in a key
  must be written `\\`. Previously `\` was a plain key byte.
- **Escape table expanded from 8 to 10 entries:** `\\`, `\,`, `\}`,
  `\]`, `\{`, `\[`, `\n`, `\r`, **`\.`**, **`\:`**. The two new forms
  are recognised both inside key segments and inside inline-scalar
  values (in values they are redundant — `.` and `:` are already
  literal bytes there — but accepted for symmetry).

>>>>> lang=ru
## [0.6.0] — 2026-06-01

Синхронизация со спецификацией: трекинг **Ktav 0.6.0** —
несовместимая ревизия грамматики ключей. В ключах теперь обрабатывается
весь набор экранирующих последовательностей `§ 3.7`, а сама таблица
растёт с 8 до 10 элементов.

### Несовместимые изменения

- **Сегменты ключа стали escape-aware.** Сегмент `key` — это
  непустая последовательность обычных байт ключа и/или
  экранирующих последовательностей. Неэкранированная `.`
  по-прежнему разделяет путь, а неэкранированное `:` завершает
  ключ (это разделитель пары). Байты `\.` и `\:` теперь
  обозначают литеральные точку / двоеточие внутри одного
  сегмента, поэтому ключи вида `a.b`, `a:b`, `example.com` и
  `1.0` наконец-то выразимы (`a\.b`, `a\:b`, `example\.com`,
  `1\.0`).
- **`\` теперь — лидер экранирования в ключах.** Литеральный
  обратный слэш в ключе теперь записывается `\\`. Раньше `\`
  был обычным байтом ключа.
- **Таблица экранирования расширена с 8 до 10 элементов:**
  `\\`, `\,`, `\}`, `\]`, `\{`, `\[`, `\n`, `\r`, **`\.`**,
  **`\:`**. Две новые формы распознаются и внутри сегментов
  ключа, и внутри inline-скалярных значений (в значениях они
  избыточны — `.` и `:` уже литералы, — но принимаются ради
  симметрии).

>>>>> lang=zh
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

