>>>>> lang=en
`"a.b": 1` — parses as a **dotted** key (segments `"a`, `b"`); spec: ONE flat segment `a.b` (the dot inside quotes must not split, `spec.md:537-544`):
```
key: (key [0, 0] - [0, 5]
  (dotted_key [0, 0] - [0, 5]))
```

`"a}b": 1` — ERROR inside the key; spec: valid key `a}b` (`}` is ordinary content inside quotes):
```
key: (key [0, 0] - [0, 5]
  (ERROR [0, 2] - [0, 3]))
```

`` `a:b`: 1 `` — broken recovery: key `` `a ``, ERROR region over `` :b` ``, separator found at the second colon; spec: valid key `a:b`:
```
key: (key [0, 0] - [0, 2])
(ERROR [0, 2] - [0, 5]
  (sep_string [0, 2] - [0, 3]))
separator: (sep_string [0, 5] - [0, 6])
```

`"a" "b": 1` — **accepted** as one 7-byte key; spec: `InvalidKey` error — "no form combining quoted content with further bare or quoted content inside one segment" (`spec.md:1236-1238`):
```
key: (key [0, 0] - [0, 7])
```

>>>>> lang=ru
`"a}b": 1` — ERROR внутри ключа; спецификация допускает ключ `a}b` (`}` внутри кавычек является обычным содержимым):
```
key: (key [0, 0] - [0, 5]
  (ERROR [0, 2] - [0, 3]))
```

`` `a:b`: 1 `` — ошибочное восстановление: ключ `` `a ``, диапазон ERROR покрывает `` :b` ``, разделителем становится второе двоеточие; спецификация допускает `a:b`:
```
key: (key [0, 0] - [0, 2])
(ERROR [0, 2] - [0, 5]
  (sep_string [0, 2] - [0, 3]))
separator: (sep_string [0, 5] - [0, 6])
```

`"a" "b": 1` принимается как один ключ из 7 байтов; спецификация требует `InvalidKey` — «в одном сегменте нельзя объединять текст в кавычках с последующим голым или кавычечным текстом» (`spec.md:1236-1238`):
```
key: (key [0, 0] - [0, 7])
```

`k: {"a,b": 1, c: 2}` — запятая внутри ключа в кавычках сейчас считается структурной: два элемента получаются лишь при восстановлении с ERROR на запятой в первом ключе; спецификация требует две чистые пары, а запятая внутри кавычек непрозрачна (`spec.md:1337-1351`):
```
(inline_pair [0, 4] - [0, 12]
  key: (key [0, 4] - [0, 9]
    (ERROR [0, 6] - [0, 7]))
  ...)
(inline_pair [0, 14] - [0, 18]
  key: (key [0, 14] - [0, 15])
  ...)
```

>>>>> lang=zh
`"a}b": 1` 在键内产生 ERROR；规范允许键 `a}b`（引号内的 `}` 是普通内容）：
```
key: (key [0, 0] - [0, 5]
  (ERROR [0, 2] - [0, 3]))
```

`` `a:b`: 1 `` 恢复错误：键为 `` `a ``，ERROR 区域覆盖 `` :b` ``，直到第二个冒号才找到分隔符；规范允许键 `a:b`：
```
key: (key [0, 0] - [0, 2])
(ERROR [0, 2] - [0, 5]
  (sep_string [0, 2] - [0, 3]))
separator: (sep_string [0, 5] - [0, 6])
```

`"a" "b": 1` 被接受为一个 7 字节键；规范要求 `InvalidKey`，因为「一个键段中不能将带引号的内容与后续裸内容或另一个带引号内容组合」（`spec.md:1236-1238`）：
```
key: (key [0, 0] - [0, 7])
```

`k: {"a,b": 1, c: 2}` 中，引号键里的逗号目前仍被当作结构符号：只有在第一个键的逗号位置嵌入 ERROR 才能恢复出两项；规范要求两项均正常解析，且逗号在引号内不透明（`spec.md:1337-1351`）：
```
(inline_pair [0, 4] - [0, 12]
  key: (key [0, 4] - [0, 9]
    (ERROR [0, 6] - [0, 7]))
  ...)
(inline_pair [0, 14] - [0, 18]
  key: (key [0, 14] - [0, 15])
  ...)
```

