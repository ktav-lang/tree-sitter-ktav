>>>>> lang=en
`k: {"a,b": 1, c: 2}` — the comma inside the quoted key is structural today: the parser recovers into two pairs only by embedding an ERROR at the comma inside the first key node; spec: clean two pairs, comma opaque inside quotes (`spec.md:1337-1351`):
```
(inline_pair [0, 4] - [0, 12]
  key: (key [0, 4] - [0, 9]
    (ERROR [0, 6] - [0, 7]))
  ...)
(inline_pair [0, 14] - [0, 18]
  key: (key [0, 14] - [0, 15])
  ...)
```

`'tis the season: fa` (document's first line) — parses as an `object_pair` with key `'tis the season`; spec 0.7: the leading `'` opens an **unterminated quoted segment**, the separator scan finds no separator, and an undecided root falls to § 5.0.1 rule 7 — a root-**Array** String item (`spec.md:1292-1296`, a breaking change):
```
(object_pair [0, 0] - [1, 0]
  key: (key [0, 0] - [0, 15])
  separator: (sep_string [0, 15] - [0, 16])
  value: (scalar [0, 17] - [1, 0]))
```

Conformant counterpoint (no change needed): `port": 1` parses with key `port"` — a quote **mid-segment** is an ordinary `<key-char>` in 0.7 too (`spec.md:1199-1202`).

**Must produce:** a quoted-segment alternative in the key grammar (three delimiters; closes at the first unescaped same delimiter; self-escape via `\"` / `\'` / `` \` `` — see G2; content untrimmed; opaque to `.` `:` `,` `{` `}` `[` `]`; nothing but whitespace between closer and the next `.`/separator, else the `InvalidKey` case above).

**Owner:** the **quoted keys** task.

**Difficulty / scanner note:** the segment token itself is expressible as a single regex token (three delimiter alternatives, char classes excluding only the own delimiter + control bytes/DEL, plus the 14 escape forms incl. `\uXXXX`). Because the whole quoted segment is ONE token, the `.`/`:`/`,`/bracket opacity inside it falls out of tokenization — no external scanner needed. Required refactors: `word: $ => $._key_segment` (`grammar.js:76`) cannot stay on `_key_segment` once it gains alternatives (tree-sitter's word token must be a single token); root-detection interplay (`'tis the season` case) belongs to the G5 dispatch work; the `UnterminatedQuotedKey` vs `MissingSeparator` **diagnosis** (§ 6.16) is error-taxonomy, not tree shape.

>>>>> lang=ru
`'tis the season: fa` (первая строка документа) разбирается как `object_pair` с ключом `'tis the season`; по 0.7 начальная `'` открывает **незакрытый сегмент в кавычках**, сканирование разделителя не находит разделителя, а неопределённый корень по правилу 7 § 5.0.1 становится строковым элементом корневого **Array** (`spec.md:1292-1296`, несовместимое изменение):
```
(object_pair [0, 0] - [1, 0]
  key: (key [0, 0] - [0, 15])
  separator: (sep_string [0, 15] - [0, 16])
  value: (scalar [0, 17] - [1, 0]))
```

Соответствующий спецификации контрпример (менять не нужно): `port": 1` разбирается с ключом `port"` — кавычка **в середине сегмента** и в 0.7 является обычным `<key-char>` (`spec.md:1199-1202`).

**Требуемое поведение:** вариант сегмента в кавычках в грамматике ключа (три вида разделителя; закрытие первым неэкранированным тем же символом; экранирование собственной кавычки через `\"` / `\'` / `` \` `` — см. G2; содержимое не обрезается; `.`, `:`, `,`, `{`, `}`, `[`, `]` внутри непрозрачны; после закрытия до следующей точки/разделителя допустимы только пробелы, иначе приведённый выше `InvalidKey`).

**Владелец:** задача **ключей в кавычках**.

**Сложность / сканер:** сегмент выражается одним regex-токеном (три варианта разделителя, классы исключают собственный разделитель и управляющие байты/DEL, добавляются 14 escape-форм, в том числе `\uXXXX`). Непрозрачность точек, двоеточий, запятых и скобок возникает из поглощения одним токеном — внешний сканер не нужен. Требуется изменить `word: $ => $._key_segment` (`grammar.js:76`): после добавления вариантов `_key_segment` не может оставаться токеном `word` (в tree-sitter это должен быть один токен). Взаимодействие с корнем (`'tis the season`) относится к диспетчеризации G5; выбор между диагностикой `UnterminatedQuotedKey` и `MissingSeparator` (§ 6.16) — это классификация ошибки, а не форма дерева.

>>>>> lang=zh
`'tis the season: fa`（文档首行）被解析为键为 `'tis the season` 的 `object_pair`；按 0.7，开头的 `'` 开启一个**未闭合的引号段**，分隔符扫描找不到分隔符，尚未确定的根类型依 § 5.0.1 规则 7 归为根 **Array** 中的字符串项（`spec.md:1292-1296`，这是破坏性变更）：
```
(object_pair [0, 0] - [1, 0]
  key: (key [0, 0] - [0, 15])
  separator: (sep_string [0, 15] - [0, 16])
  value: (scalar [0, 17] - [1, 0]))
```

符合规范的反例（无需更改）：`port": 1` 解析出的键为 `port"`；位于**段中间**的引号在 0.7 仍是普通 `<key-char>`（`spec.md:1199-1202`）。

**必须实现：**键语法增加带引号段（三种定界符；由首个未转义的同一字符闭合；自身定界符用 `\"` / `\'` / `` \` `` 转义，见 G2；内容不裁剪；段内 `. : , { } [ ]` 均不作为结构符号；结束引号与后续点号/分隔符之间只能有空白，否则属于上例的 `InvalidKey`）。

**负责人：** **引号键任务**。

**难度 / 扫描器：**键段可由一个正则 token 表达（三种定界符选项；字符类仅排除当前定界符和控制字节/DEL；并纳入 14 种转义，包括 `\uXXXX`）。整段由单一 token 消费，因此点号、冒号、逗号和括号自然保持不透明，无需外部扫描器。必须重构 `word: $ => $._key_segment`（`grammar.js:76`）：`_key_segment` 增加多个备选后不能继续作为 `word`，因为 tree-sitter 的 word 必须是单一 token。与根类型的交互（`'tis the season`）属于 G5；`UnterminatedQuotedKey` 与 `MissingSeparator`（§ 6.16）的选择属于错误分类，而非语法树形状。

