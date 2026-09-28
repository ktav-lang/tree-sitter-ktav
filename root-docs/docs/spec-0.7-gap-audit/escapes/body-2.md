>>>>> lang=en
`a\u002Eb: 1` — ERROR; spec: the **flat** key `a.b` — "a key segment spelling the dot as `\u` followed by the four hex digits for `U+002E` decodes identically to `\.` above (flat key, no nesting)" (`spec.md:530-536`); a recognised escape is "never re-examined as a structural delimiter" (`spec.md:237-241`).

`k: {x: A\u0041B}` — ERROR inside the inline value; spec: inline scalar `AAB` (String — a recognised escape forces String, § 5.2 rule 14):
```
(ERROR [0, 0] - [1, 0]
  (key [0, 0] - [0, 1])
  (sep_string [0, 1] - [0, 2])
  (inline_pair [0, 4] - [0, 8] ... )
  (multiline_content_line [0, 8] - [1, 0]))
```

`k: {\uD83D\uDE00}` — ERROR; spec: valid (surrogate pair → one code point above the BMP).

`k: {\uD800}` — ERROR today, and spec **also** rejects it (lone surrogate = `BadEscapeSequence`): conformant outcome, different mechanism (the grammar has no `\u` token at all, so rejection is incidental; recovery shape differs — junk content line, no diagnosable node).

Conformant boundary (observed, and now locked into the corpus — § 10): `a: \u0041` parses as a plain `(scalar)` — whole-line values do NOT process escapes; the six bytes are literal content, exactly as 0.7 requires.

**Must produce:** `\"`, `\'`, `` \` ``, `\uXXXX` in BOTH `_key_segment` (keys, bare and quoted) and `escape_sequence` (inline scalars), with exactly-four-hex semantics and no partial consumption; rejection (error) for malformed `\u` forms.

**Owner:** the **\uXXXX + BOM** task.

**Difficulty / scanner note:** the tokens are pure regex — `\\u[0-9a-fA-F]{4}` and the three two-byte quote forms; exactly-four and non-partial are automatic. The one thing a regex lexer **cannot** express is lone-surrogate validation (pairing is cross-token state): either add it to `src/scanner.c` (external scanner in C) or accept surrogate escapes at the syntax level and let the reference parser raise `BadEscapeSequence` — a documented diagnosis trade-off for the task owner to decide (see § 12).

>>>>> lang=ru
`a\u002Eb: 1` — ERROR; по спецификации это **плоский** ключ `a.b`: `\u002E` декодируется так же, как `\.`, и повторно не проверяется как структурный разделитель (`spec.md:530-536`, `237-241`).

`k: {x: A\u0041B}` — ERROR во встроенном значении; спецификация требует скаляр `AAB` (тип String: распознанное экранирование принудительно задаёт String, § 5.2, правило 14):
```
(ERROR [0, 0] - [1, 0]
  (key [0, 0] - [0, 1])
  (sep_string [0, 1] - [0, 2])
  (inline_pair [0, 4] - [0, 8] ... )
  (multiline_content_line [0, 8] - [1, 0]))
```

`k: {\uD83D\uDE00}` даёт ERROR, хотя по спецификации корректен (пара суррогатов → один символ выше BMP). `k: {\uD800}` отклоняется и грамматикой, и спецификацией (одиночный суррогат = `BadEscapeSequence`), но грамматика делает это случайно: токена `\u` нет; восстановление создаёт мусорное содержимое без диагностируемого узла.

Соответствующая граница (наблюдалась и закреплена в corpus, § 10): `a: \u0041` разбирается как обычный `(scalar)` — значения целой строки НЕ обрабатывают escape; шесть байтов являются буквальным содержимым, как требует 0.7.

**Требуемое поведение:** добавить `\"`, `\'`, `` \` `` и `\uXXXX` в `_key_segment` (голые ключи и ключи в кавычках) и `escape_sequence` (inline-скаляры); ровно четыре hex-цифры, без частичного поглощения; ошибочные формы должны выдавать ошибку.

**Владелец:** задача **\uXXXX + BOM**.

**Сложность / сканер:** токены выражаются regex (`\\u[0-9a-fA-F]{4}` и три двухбайтовые формы кавычек). Regex-лексер не может проверить одиночный суррогат с учётом соседних токенов: нужно либо добавить состояние в `src/scanner.c`, либо принимать такую форму синтаксически и поручить эталонному парсеру ошибку `BadEscapeSequence` (компромисс диагностики; см. § 12).

>>>>> lang=zh
`a\u002Eb: 1` 报 ERROR；规范要求得到**平面键** `a.b`。`\u002E` 与 `\.` 一样解码，解码结果不会再次被识别为结构分隔符（`spec.md:530-536`、`237-241`）。

`k: {x: A\u0041B}` 在内联值中报 ERROR；规范要求内联标量 `AAB`（类型为 String：识别到转义会强制归类，§ 5.2 规则 14）：
```
(ERROR [0, 0] - [1, 0]
  (key [0, 0] - [0, 1])
  (sep_string [0, 1] - [0, 2])
  (inline_pair [0, 4] - [0, 8] ... )
  (multiline_content_line [0, 8] - [1, 0]))
```

`k: {\uD83D\uDE00}` 报 ERROR，但规范认为有效（代理项对合并为一个 BMP 之外的码点）。`k: {\uD800}` 被语法和规范都拒绝（孤立代理项 = `BadEscapeSequence`），但语法只是碰巧拒绝，因为没有 `\u` token；恢复结果是无关内容，且没有可诊断节点。

符合规范的边界案例（已实测并在 § 10 的 corpus 中固定）：`a: \u0041` 解析为普通 `(scalar)`。整行值不处理转义；六个字节是字面内容，符合 0.7。

**必须实现：**在 `_key_segment`（裸键和带引号键）及 `escape_sequence`（内联标量）中支持 `\"`、`\'`、`` \` ``、`\uXXXX`，必须恰好四位十六进制且不得部分消费；格式错误时应报错。

**负责人：** **\uXXXX + BOM 任务**。

**难度 / 扫描器：**这些 token 可由正则表达式表示（`\\u[0-9a-fA-F]{4}` 及三种双字节引号转义）。正则词法器无法跨 token 验证孤立代理项：可在 `src/scanner.c` 中增加状态，或在语法层接受、再由参考解析器报告 `BadEscapeSequence`（诊断方式的取舍；见 § 12）。

