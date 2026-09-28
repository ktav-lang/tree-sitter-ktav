>>>>> lang=en
## 2. G2 — Escape table: grammar has 10 forms, 0.7.0 has 14 (§ 3.7, § 3.7.1)

**Spec requirement** (`spec.md:234`): "The following **fourteen** escape sequences are recognised". The four the grammar lacks (`spec.md:255-258`):

| Sequence | Replacement |
|----------|-------------|
| `\"`     | `"` (literal double quote) |
| `\'`     | `'` (literal single quote) |
| `` \` `` | `` ` `` (literal backtick) |
| `\uXXXX` | the Unicode code point `U+XXXX` — see below |

`\uXXXX` rules (`spec.md:303-332`): "exactly **four** hexadecimal digits (`[0-9a-fA-F]`, case-insensitive)"; "Fewer than four hex digits following `\u` ... is a `BadEscapeSequence` error — the escape is never partially consumed"; surrogate pairs combine above the BMP; "A high surrogate not immediately followed by a valid low-surrogate `\uXXXX` escape, or a low surrogate that does not immediately follow a high surrogate, is a **lone surrogate** and is a `BadEscapeSequence` error"; recognised "only ... inline scalar values and keys. It is **not** processed inside multi-line scalar values, multi-line string content (`(…)` / `((…))`, § 5.6), or comments". § 4 (`spec.md:412-415`) adds the same forms to `<key-escape>`/`<escapable-byte>`.

**Grammar today:** ten two-byte forms in both places —
- `grammar.js:163` — `_key_segment: /([^\s\[\]\{\}\(\):#,.\r\n\\]|\\[\\,\}\]\{\[nr.:])+/` (escape char class lacks `"`, `'`, `` ` ``, and any `\u` form)
- `grammar.js:301-312` — `escape_sequence: token(choice('\\\\','\\,','\\}','\\]','\\{','\\[','\\n','\\r','\\.','\\:'))`

Provenance: the grammar matches spec 0.6 exactly (0.6 § 3.7 says "ten"); 0.6.1–0.6.4 added none (0.6.4 is float-canonicalisation only, `spec/CHANGELOG.md:504-516`). Note: Appendix A's "the escape table grows from eleven entries to fourteen" (`spec.md:3428`) contradicts the 0.6 spec's own "ten" — an editorial slip in the spec's changelog; the normative 0.7 table (fourteen) is what binds.

**Demonstrated inputs** (observed):

`a\u0041b: 1` — ERROR (recovered as a junk `multiline_content_line`); spec: valid key `aAb`:
```
(ERROR [0, 0] - [1, 0]
  (multiline_content_line [0, 1] - [1, 0]))
```

>>>>> lang=ru
## 2. G2 — Таблица экранирования: в грамматике 10 форм, в 0.7.0 — 14 (§ 3.7, § 3.7.1)

**Требование спецификации** (`spec.md:234`): распознаются «четырнадцать» escape-последовательностей. В грамматике отсутствуют четыре формы (`spec.md:255-258`):

| Форма | Замена |
|---|---|
| `\"` | `"` (буквальная двойная кавычка) |
| `\'` | `'` (буквальная одинарная кавычка) |
| `` \` `` | `` ` `` (буквальная обратная кавычка) |
| `\uXXXX` | кодовая точка Unicode `U+XXXX` — см. ниже |

Правила `\uXXXX` (`spec.md:303-332`): ровно **четыре** шестнадцатеричные цифры (`[0-9a-fA-F]`, регистр не важен); менее четырёх цифр — `BadEscapeSequence`, последовательность нельзя поглощать частично. Суррогатная пара объединяется в символ выше BMP. Старший суррогат без следующего корректного младшего `\uXXXX` или младший без непосредственно предшествующего старшего — **одиночный суррогат**, ошибка `BadEscapeSequence`. Unicode-экранирование работает только во встроенных скалярных значениях и ключах, но не в многострочных скалярах, содержимом многострочных строк (`(…)` / `((…))`, § 5.6) и комментариях. § 4 (`spec.md:412-415`) добавляет эти формы в `<key-escape>`/`<escapable-byte>`.

**Текущая грамматика:** в обоих местах десять двухбайтовых форм —
- `grammar.js:163` — `_key_segment: /([^\s\[\]\{\}\(\):#,\.\r\n\\]|\\[\\,\}\]\{\[nr.:])+/` (в классе экранирования нет `"`, `'`, `` ` `` и `\u`)
- `grammar.js:301-312` — `escape_sequence: token(choice('\\\\','\\,','\\}','\\]','\\{','\\[','\\n','\\r','\\.','\\:'))`

Происхождение: грамматика точно соответствует спецификации 0.6 (в § 3.7 версии 0.6 указано «десять»); в 0.6.1–0.6.4 новых форм не добавляли (0.6.4 касалась только канонизации float, `spec/CHANGELOG.md:504-516`). Фраза приложения A о росте таблицы с одиннадцати до четырнадцати (`spec.md:3428`) противоречит «десяти» в 0.6 и является редакционной ошибкой; нормативна таблица 0.7 из четырнадцати форм.

**Наблюдавшиеся входы:**

`a\u0041b: 1` — ERROR (восстановление создаёт мусорный `multiline_content_line`); по спецификации это допустимый ключ `aAb`:
```
(ERROR [0, 0] - [1, 0]
  (multiline_content_line [0, 1] - [1, 0]))
```

>>>>> lang=zh
## 2. G2 — 转义表：语法支持 10 种，0.7.0 定义 14 种（§ 3.7、§ 3.7.1）

**规范要求**（`spec.md:234`）：识别「十四种」转义序列。语法缺少其中四种（`spec.md:255-258`）：

| 序列 | 替换结果 |
|---|---|
| `\"` | `"`（双引号字面字符） |
| `\'` | `'`（单引号字面字符） |
| `` \` `` | `` ` ``（反引号字面字符） |
| `\uXXXX` | Unicode 码点 `U+XXXX`，详见下文 |

`\uXXXX` 规则（`spec.md:303-332`）：必须恰好有**四位**十六进制数字（`[0-9a-fA-F]`，大小写均可）；少于四位属于 `BadEscapeSequence`，且不得部分消费。代理项对合并成 BMP 之外的码点。高代理项后未紧接有效低代理项 `\uXXXX`，或低代理项前没有紧邻的高代理项，都属于**孤立代理项**，应报告 `BadEscapeSequence`。Unicode 转义仅适用于内联标量值和键，不适用于多行标量、多行字符串内容（`(…)` / `((…))`，§ 5.6）或注释。§ 4（`spec.md:412-415`）将相同形式加入 `<key-escape>`/`<escapable-byte>`。

**当前语法：**两处均只有十种双字节形式——
- `grammar.js:163`：`_key_segment: /([^\s\[\]\{\}\(\):#,\.\r\n\\]|\\[\\,\}\]\{\[nr.:])+/`（转义类缺少 `"`、`'`、`` ` `` 和 `\u`）
- `grammar.js:301-312`：`escape_sequence: token(choice('\\\\','\\,','\\}','\\]','\\{','\\[','\\n','\\r','\\.','\\:'))`

来源：语法与 0.6 规范完全一致（0.6 § 3.7 写的是「十种」）；0.6.1–0.6.4 没有增加转义形式（0.6.4 仅改动浮点规范化，见 `spec/CHANGELOG.md:504-516`）。附录 A 称转义表从十一项增至十四项（`spec.md:3428`），与 0.6 的「十项」相矛盾，属于编辑错误；应以 0.7 的规范性十四项表为准。

**实测输入：**

`a\u0041b: 1` 报 ERROR（恢复时生成无关的 `multiline_content_line`）；规范要求它是有效键 `aAb`：
```
(ERROR [0, 0] - [1, 0]
  (multiline_content_line [0, 1] - [1, 0]))
```

