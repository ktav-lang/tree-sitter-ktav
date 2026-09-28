>>>>> lang=en
## 6. G6 — Lone `CR` is not a line terminator (§ 3.2)

**Spec requirement** (`spec.md:105-111`): "A line terminator is one of three byte sequences: `LF` (0x0A), `CR` (0x0D), `CR LF` (0x0D 0x0A). Implementations MUST treat all three as equivalent line terminators." Also `spec.md:114`: "A `CR` byte never appears as a content byte at parse time."

**Grammar today:** `grammar.js:95` — `_newline: $ => /\r?\n/` — plus the same `\r?\n` embedded in `comment` (103), `_top_scalar_text` (362), `multiline_content_line` (377), `integer` (427), `float` (432). Inconsistent corner: the external scanner's `consume_line_terminator` (`src/scanner.c:90-97`) DOES accept a lone CR — so closers tolerate CR-only endings while `_newline` does not.

**Demonstrated input** (observed): `a: 1\rb: 2\r` (CR-only endings) —
```
(ERROR [0, 0] - [0, 10]
  (key [0, 0] - [0, 1])
  (sep_string [0, 1] - [0, 2])
  (ERROR [0, 4] - [0, 5])
  (sep_string [0, 6] - [0, 7])
  (ERROR [0, 9] - [0, 10]))
```
Spec: two clean pairs. (Pre-existing gap — § 3.2's CR rule predates 0.7 — but still normative for 0.7.0 conformance.)

**Must produce:** `\r\n | \r | \n` everywhere a line terminator is consumed, grammar and scanner alike.

**Owner:** the **regenerate-and-green pass** (mechanical sweep + regenerate).

**Difficulty / scanner note:** no external scanner; regex sweep across ~7 rules plus the scanner's already-correct terminator logic; corpus coverage belongs in `basic.txt` (invisible-byte caveat, § 10).

## 7. G7 — § 5.6 stripped-form trailing-whitespace stripping: no grammar change needed

**Spec change** (`spec.md:1418-1422`): "Prior to 0.7, trailing whitespace on each line was preserved verbatim ... As of 0.7, the stripped form's name matches its behaviour on both edges of each line." (Stripped form `( … )` now strips trailing § 3.3 whitespace per content line after removing the common leading prefix; `(( … ))` stays fully verbatim.)

**Observed:** `(` + `\n  abc \n` + `)` parses cleanly; the content line is captured verbatim by `multiline_content_line` (`grammar.js:377`):
```
(top_array_item [0, 0] - [3, 0]
  value: (multiline_stripped [0, 0] - [3, 0]
    (open_paren [0, 0] - [1, 0])
    (multiline_content_line [1, 0] - [2, 0])
    (close_paren [2, 0] - [3, 0])))
```
**Verdict:** the stripping is a **Value-level** computation (common prefix + trailing trim + `\n` join) performed on the captured lines; it is invisible in the CST either way. The grammar's verbatim capture is compatible with 0.7 — the reference parser implements stripping downstream. **No grammar.js change required.** A corpus entry locking this in is possible (it parses green today) but was deliberately NOT added: the case's input contains a trailing space, which editor "strip trailing whitespace on save" would silently flip to a red suite — the exact hazard § 5.6 describes. Recorded here instead.

>>>>> lang=ru
## 6. G6 — Одиночный `CR` не является окончанием строки (§ 3.2)

**Требование спецификации** (`spec.md:105-111`): LF (`0x0A`), CR (`0x0D`) и CR LF (`0x0D 0x0A`) — равнозначные окончания строк. По `spec.md:114`, CR не встречается как содержимое при разборе.

**Текущая грамматика:** `grammar.js:95` `_newline: $ => /\r?\n/`; та же форма встроена в `comment` (103), `_top_scalar_text` (362), `multiline_content_line` (377), `integer` (427), `float` (432). Однако `consume_line_terminator` внешнего сканера (`src/scanner.c:90-97`) уже принимает одиночный CR, поэтому закрывающие строки терпят CR, а `_newline` — нет.

**Наблюдавшийся вход:** `a: 1\rb: 2\r`:
```
(ERROR [0, 0] - [0, 10]
  (key [0, 0] - [0, 1])
  (sep_string [0, 1] - [0, 2])
  (ERROR [0, 4] - [0, 5])
  (sep_string [0, 6] - [0, 7])
  (ERROR [0, 9] - [0, 10]))
```

Спецификация ожидает две корректные пары. Проблема предшествует 0.7, но остаётся нормативной. **Требуемое поведение:** везде, где грамматика/сканер потребляют конец строки, принимать `\r\n | \r | \n`. **Владелец:** этап восстановления и зелёных тестов. **Сложность:** новый сканер не нужен; заменить около семи regex-правил, сохранить логику сканера и покрыть `basic.txt` (невидимые байты, см. § 10).

## 7. Удаление хвостовых пробелов в сокращённой форме: грамматика не меняется (§ 5.6)

До 0.7 хвостовые пробелы каждой строки сокращённой формы сохранялись; с 0.7 они удаляются с обоих краёв после общего отступа (`spec.md:1418-1422`). `((…))` остаётся дословной формой. В наблюдавшемся примере `(` + `\n  abc \n` + `)` содержимое захвачено без изменений:
```
(top_array_item [0, 0] - [3, 0]
  value: (multiline_stripped [0, 0] - [3, 0]
    (open_paren [0, 0] - [1, 0])
    (multiline_content_line [1, 0] - [2, 0])
    (close_paren [2, 0] - [3, 0])))
```

Обрезка — вычисление на уровне Value (общий префикс, обрезка справа, соединение через `\n`), невидимое в CST. Дословный захват совместим; эталонный парсер выполняет обрезку позже. `grammar.js` менять не нужно. Тест corpus не добавляли: редакторы удаляют конечные пробелы, делая пример хрупким.

>>>>> lang=zh
## 6. 单独的 `CR` 不是行终止符（§ 3.2）

**规范要求**（`spec.md:105-111`）：LF（`0x0A`）、CR（`0x0D`）和 CR LF（`0x0D 0x0A`）是等价行终止符。`spec.md:114` 规定解析时 CR 不得作为内容。

**当前语法：**`grammar.js:95` 中 `_newline: $ => /\r?\n/`；`comment`（103）、`_top_scalar_text`（362）、`multiline_content_line`（377）、`integer`（427）和 `float`（432）也嵌入同一形式。但外部扫描器的 `consume_line_terminator`（`src/scanner.c:90-97`）已接受单独 CR，因此闭合符可用 CR 结束，而 `_newline` 不行。

**实测输入：**`a: 1\rb: 2\r`：
```
(ERROR [0, 0] - [0, 10]
  (key [0, 0] - [0, 1])
  (sep_string [0, 1] - [0, 2])
  (ERROR [0, 4] - [0, 5])
  (sep_string [0, 6] - [0, 7])
  (ERROR [0, 9] - [0, 10]))
```

规范要求得到两个无错误键值对。此问题早于 0.7，但仍属规范要求。**必须实现：**语法/扫描器消费行结束符的所有位置都接受 `\r\n | \r | \n`。**负责人：**重新生成并保持测试通过的任务。**难度：**无需新扫描器；改约七处 regex，保留现有扫描器逻辑，并在 `basic.txt` 加测试（字节不可见，见 § 10）。

## 7. 简化形式的尾随空白裁剪：语法无需更改（§ 5.6）

0.7 之前，简化多行形式逐行保留尾随空白；0.7 改为去除公共缩进后裁剪两侧（`spec.md:1418-1422`）。`((…))` 仍逐字保留。实测 `(` + `\n  abc \n` + `)` 的内容行原样捕获：
```
(top_array_item [0, 0] - [3, 0]
  value: (multiline_stripped [0, 0] - [3, 0]
    (open_paren [0, 0] - [1, 0])
    (multiline_content_line [1, 0] - [2, 0])
    (close_paren [2, 0] - [3, 0])))
```

裁剪属于 Value 层计算（公共前缀、行尾裁剪、以 `\n` 拼接），CST 看不到。原样捕获与规范兼容；参考解析器随后完成裁剪。无需改 `grammar.js`。未加 corpus 用例，因为编辑器通常会删除行尾空格，使测试不稳定。

