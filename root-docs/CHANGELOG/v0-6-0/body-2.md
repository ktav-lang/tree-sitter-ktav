>>>>> lang=en
### Changed

- `_key_segment` regex updated to
  `([^\s\[\]\{\}\(\):#,.\r\n\\]|\\[\\,\}\]\{\[nr.:])+` — the plain
  key-byte class now excludes raw `\` (it becomes the escape lead)
  and any of the 10 escape forms is accepted as a single segment
  unit. The dotted-key rule still splits on an unescaped `.`.
- `escape_sequence` (inline scalars) extended with `\\.` and `\\:`.

### Tests

- Conformance harness re-pointed from `spec/versions/0.5/tests` to
  `spec/versions/0.6/tests`. Six new `valid/key_escaping/*.ktav`
  fixtures and the new `invalid/key_escaping/` + `invalid/bad_escape/`
  categories all parse as expected.

### Unchanged

- Comment marker stays `##` (single `#` remains a content byte).
- Value-side escape semantics for the eight original forms are
  unchanged; `\.` and `\:` in values now produce a literal `.` / `:`
  rather than a `BadEscapeSequence` (matches the spec).

>>>>> lang=ru
### Изменено

- Регэксп `_key_segment` обновлён до
  `([^\s\[\]\{\}\(\):#,.\r\n\\]|\\[\\,\}\]\{\[nr.:])+` — класс
  «обычный байт ключа» теперь исключает сырой `\` (он стал
  лидером экранирования), а любая из 10 форм escape принимается
  как одна единица сегмента. Правило составного ключа всё так же
  разбивает по неэкранированной `.`.
- `escape_sequence` (inline-скаляры) расширен формами `\\.` и
  `\\:`.

### Тесты

- Harness соответствия переориентирован с
  `spec/versions/0.5/tests` на `spec/versions/0.6/tests`. Шесть
  новых фикстур `valid/key_escaping/*.ktav` и новые категории
  `invalid/key_escaping/` + `invalid/bad_escape/` парсятся
  ожидаемо.

### Без изменений

- Маркер комментария остаётся `##` (одиночный `#` — обычный байт).
- Семантика экранирования в значениях для восьми исходных форм
  не изменилась; `\.` и `\:` в значениях теперь дают литеральные
  `.` / `:`, а не `BadEscapeSequence` (по спецификации).

>>>>> lang=zh
### 变更

- `_key_segment` 正则更新为
  `([^\s\[\]\{\}\(\):#,.\r\n\\]|\\[\\,\}\]\{\[nr.:])+` ——
  "普通键字节"字符类现在排除原始的 `\`（它成为转义引导），
  而 10 种转义形式中的任何一种都被接受为段的一个单位。
  点路径规则仍按未转义的 `.` 分割。
- `escape_sequence`（内联标量）扩展了 `\\.` 与 `\\:`。

### 测试

- 一致性测试 harness 从 `spec/versions/0.5/tests` 重新指向
  `spec/versions/0.6/tests`。六个新的
  `valid/key_escaping/*.ktav` 样例以及新的
  `invalid/key_escaping/` 与 `invalid/bad_escape/` 分类
  均按预期解析。

### 未变更

- 注释标记仍为 `##`（单独的 `#` 仍是内容字节）。
- 值侧 8 种原有转义的语义不变；值中的 `\.` 与 `\:` 现在
  产生字面 `.` / `:`，而不是 `BadEscapeSequence`（遵循规范）。

