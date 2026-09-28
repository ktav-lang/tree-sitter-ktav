>>>>> lang=en
## 3. G3 — Whitespace set: ASCII-only in the grammar vs 25 code points (§ 3.3, § 4)

**Spec requirement** (`spec.md:127-139`): whitespace is "one of the following twenty-five, enumerated exhaustively — ... Unicode's `White_Space` property as of Unicode 6.3": `U+0009 U+000A U+000B U+000C U+000D U+0020 U+0085 U+00A0 U+1680 U+2000–U+200A U+2028 U+2029 U+202F U+205F U+3000`; "Implementations MUST recognise exactly this set, no more and no fewer ... never delegate to a host language's built-in Unicode-whitespace primitive". § 4 makes `ws` line-bounded (all of the above except LF/CR) and uses it for indentation, blank lines, `<sep-end>` (`spec.md:546`), closer lines, and key-segment trimming; interior whitespace is preserved in keys (`spec.md:443-445`). Appendix A (`spec.md:3333`) additionally **requires** raw VT `0x0B` and FF `0x0C` to be admitted as key *content*.

**Grammar today:**
- `grammar.js:61-65` — `extras: $ => [ /[ \t]+/ ]` — indentation/inter-token skip is space+tab only.
- `\s` appears in every content class: `_key_segment` (163), `_inline_scalar_head` (318), `_inline_scalar_text` (323), `_top_scalar_text` (362), `_raw_scalar_text` (396), `_scalar_text` (406), `integer` (427), `float` (432).
- `src/scanner.c:72-74` — `is_h_ws` = space/tab; `src/scanner.c:118` — `_marker_ws` accepts exactly `' ' '\t' '\n' '\r' 0`.

**Observed calibration (important):** tree-sitter's `\s`, as compiled by this grammar, matches **ASCII whitespace only**. Observed memberships: NEL (U+0085), NBSP (U+00A0), U+FEFF, U+3000 are matched by `[^\s...]` as *content*; VT (U+000B) and FF (U+000C) are excluded by `\s`. INFERRED (same class, not individually probed): U+1680, U+2000–U+200A, U+2028, U+2029, U+202F, U+205F behave like NBSP. Either way the grammar is wrong in both directions against the 25-set.

**Failure mode A — silent key corruption.** `a: 1` + a line indented with NEL (`\u0085b: 2`): the NEL is glued into the key text; spec: NEL is indentation whitespace, key is `b`:
```
(object_pair [1, 0] - [2, 0]
  key: (key [1, 0] - [1, 3])      # 3 bytes = NEL(2) + 'b'
  separator: (sep_string [1, 3] - [1, 4])
  value: (integer [1, 5] - [2, 0]))
```
Same shape observed for NBSP (`04`) and U+3000 (`29`). No error node — the decoded key is silently wrong, which is the worst class of divergence here.

**Failure mode B — silent value/blank-line corruption.** `a: <NBSP>x` → the scalar node includes the NBSP; spec: `<scalar-body>` is trimmed of § 3.3 whitespace → value `x` (observed: `value: (scalar [0, 3] - [1, 0])`). A line containing only NBSP parses as `top_array_item (top_scalar)`; spec § 3.5: a line "consisting only of whitespace code points" is a **blank line** (observed tree in `28`).

**Failure mode C — false rejection of spec-valid documents.**
- `a: 1` + FF-indented `\u000Cb: 2` → `(ERROR [1, 0] - [2, 0] (multiline_content_line ...))`; spec: FF is whitespace → valid pair (observed `06`).
- `a\u000Bb: 1` (VT inside a key) → ERROR; spec 0.7 **requires** raw VT/FF as key content (Appendix A `spec.md:3333-3335`) (observed `05`).
- `a:<NBSP>1` → ERROR (recovered as separate junk + `top_scalar`); spec: `<sep-end>` is `1*ws` and NBSP is `ws` → valid pair with value `1` (observed `25`). Root cause: `_marker_ws` (`scanner.c:118`) checks five ASCII bytes only.
- `}` + NBSP + newline as an object closer → parse failure; spec: closer lines are `(ws) "}" (ws) <line-end>` (observed `30`; root cause `is_h_ws`, `scanner.c:72-74`).

**Must produce:** the exact 25-code-point set for: `extras`, all `\s`-class content exclusions (per-position: VT/FF become key content per Appendix A; non-ASCII ws never appears in decoded key/scalar content), `_marker_ws`, `is_h_ws`/`_strict_eol`, comment/blank-line leading `(ws)`.

**Owner:** **none of the three queued tasks names this** — see § 11 (human decision; suggested: fold into the \uXXXX + BOM task, which is already a lexical-foundation change).

**Difficulty / scanner note:** a 23-character line-bounded class is trivially expressible in tree-sitter regex by hard-coding the code points (`[\t\u000B\u000C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]`) — do NOT use `\s` (observed ASCII-only here) and do NOT use host `is_whitespace`-style primitives (spec § 3.3 forbids delegation). `src/scanner.c` needs matching C edits (in scope for the implementing task, not this audit). No external scanner beyond the existing one.

>>>>> lang=ru
## 3. G3 — Набор пробелов: в грамматике только ASCII, а требуется 25 кодовых точек (§ 3.3, § 4)

**Требование спецификации** (`spec.md:127-139`): ровно 25 кодовых точек — `White_Space` Unicode 6.3: `U+0009 U+000A U+000B U+000C U+000D U+0020 U+0085 U+00A0 U+1680 U+2000–U+200A U+2028 U+2029 U+202F U+205F U+3000`. Ни больше, ни меньше; нельзя делегировать набор языку реализации. В § 4 `ws` ограничен строкой (кроме LF/CR) и применяется к отступам, пустым строкам, `<sep-end>` (`spec.md:546`), закрывающим строкам и обрезке краёв ключа; внутренние пробелы ключа сохраняются (`spec.md:443-445`). Приложение A (`spec.md:3333`) также требует допускать исходные VT `0x0B` и FF `0x0C` как содержимое ключа.

**Текущая грамматика:**
- `grammar.js:61-65`: `extras: $ => [ /[ \t]+/ ]`; пропуск отступов и разделителей ограничен пробелом и табуляцией.
- `\s` используется в `_key_segment` (163), `_inline_scalar_head` (318), `_inline_scalar_text` (323), `_top_scalar_text` (362), `_raw_scalar_text` (396), `_scalar_text` (406), `integer` (427), `float` (432).
- `src/scanner.c:72-74`: `is_h_ws` означает пробел/табуляцию; `src/scanner.c:118`: `_marker_ws` принимает только `' ' '\t' '\n' '\r' 0`.

**Калибровка наблюдений:** `\s` в грамматике tree-sitter совпадает только с ASCII-пробелами. NEL (U+0085), NBSP (U+00A0), U+FEFF и U+3000 наблюдались как содержимое отрицательного класса `[^\s...]`; VT и FF исключаются `\s`. INFERRED (не проверялись по отдельности): U+1680, U+2000–U+200A, U+2028, U+2029, U+202F, U+205F ведут себя как NBSP. В любом случае набор неверен в обе стороны.

**Сбой A — тихое искажение ключа:** если после `a: 1` строка имеет отступ NEL (`\u0085b: 2`), NEL попадает в ключ; спецификация считает его отступом, ключом должно быть `b`:
```
(object_pair [1, 0] - [2, 0]
  key: (key [1, 0] - [1, 3])      # 3 bytes = NEL(2) + 'b'
  separator: (sep_string [1, 3] - [1, 4])
  value: (integer [1, 5] - [2, 0]))
```

Такая же форма ключа наблюдалась для NBSP (`04`) и U+3000 (`29`). Узла ERROR нет: декодированный ключ незаметно искажён.

**Сбой B — тихое искажение значения/пустой строки:** `a: <NBSP>x` включает NBSP в диапазон скаляра; после обрезки пробелов § 3.3 значением должно быть `x` (наблюдался `value: (scalar [0, 3] - [1, 0])`). Строка только из NBSP разбирается как `top_array_item (top_scalar)`, хотя § 3.5 требует пустую строку (наблюдение `28`).

**Сбой C — ложный отказ корректных документов:**
- После `a: 1` пара с отступом FF `\u000Cb: 2` даёт `(ERROR [1, 0] - [2, 0] (multiline_content_line ...))`; FF по спецификации пробел (`06`).
- `a\u000Bb: 1` (VT в ключе) вызывает ошибку, хотя приложение A требует сырые VT/FF как содержимое ключа (`05`).
- `a:<NBSP>1` даёт ошибку и восстановление как мусор плюс `top_scalar`; `<sep-end>` допускает `1*ws`, значит должна получиться пара. `_marker_ws` проверяет только пять ASCII-байтов (`25`).
- `}` + NBSP + перевод строки не разбирается как закрытие объекта; спецификация допускает `(ws) "}" (ws) <line-end>`. Причина — `is_h_ws` (`30`).

Случаи FF, VT/FF в ключе, NBSP после `:` и NBSP в закрывающей строке проверялись раздельными побайтными входами `06`, `05`, `25`, `30`. Первые два — ложный отказ допустимых данных; последние два также показывают, что предикаты сканера проверяют ASCII-байты вместо нормативного набора.

**Требуемое поведение:** точные 25 точек для `extras`, всех исключений пробелов из содержимого (VT/FF по позиции остаются содержимым ключа; не-ASCII пробелы не входят в декодированный ключ/скаляр), `_marker_ws`, `is_h_ws`/`_strict_eol` и начальных пробелов комментариев/пустых строк.

**Владелец:** ни одна из трёх назначенных задач; см. § 11. Предлагалось включить в лексические изменения `\uXXXX` + BOM.

**Сложность / сканер:** явный построчный класс `[\t\u000B\u000C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]` легко выразить. НЕ использовать `\s` или host-предикаты `is_whitespace`. В `src/scanner.c` нужно синхронно поменять байтовые наборы; новый внешний сканер не требуется.

>>>>> lang=zh
## 3. G3 — 空白集合：语法仅支持 ASCII，规范要求 25 个码点（§ 3.3、§ 4）

**规范要求**（`spec.md:127-139`）：恰好 25 个码点，即 Unicode 6.3 的 `White_Space`：`U+0009 U+000A U+000B U+000C U+000D U+0020 U+0085 U+00A0 U+1680 U+2000–U+200A U+2028 U+2029 U+202F U+205F U+3000`。不得增减，也不得交由宿主语言决定。§ 4 将 `ws` 限定在单行内（LF/CR 除外），用于缩进、空行、`<sep-end>`（`spec.md:546`）、闭合行以及键边缘裁剪；键内部的空白保留（`spec.md:443-445`）。附录 A（`spec.md:3333`）还要求 VT `0x0B` 和 FF `0x0C` 的原始字节可作为键内容。

**当前语法：**
- `grammar.js:61-65`：`extras: $ => [ /[ \t]+/ ]`，缩进和 token 间仅跳过空格/制表符。
- `_key_segment`（163）、`_inline_scalar_head`（318）、`_inline_scalar_text`（323）、`_top_scalar_text`（362）、`_raw_scalar_text`（396）、`_scalar_text`（406）、`integer`（427）、`float`（432）均使用 `\s`。
- `src/scanner.c:72-74` 中 `is_h_ws` 仅指空格/制表符；`src/scanner.c:118` 的 `_marker_ws` 只接受 `' ' '\t' '\n' '\r' 0`。

**实测校准：**tree-sitter 编译此语法后的 `\s` 只匹配 ASCII 空白。实测 NEL（U+0085）、NBSP（U+00A0）、U+FEFF、U+3000 会由取反字符类 `[^\s...]` 作为内容匹配；VT、FF 会被 `\s` 排除。INFERRED、未逐个探测：U+1680、U+2000–U+200A、U+2028、U+2029、U+202F、U+205F 与 NBSP 表现相同。不论如何，语法集合两边都不符合规范。

**失败 A — 键被静默破坏：**`a: 1` 后若一行以 NEL 缩进（`\u0085b: 2`），NEL 会粘入键文本；规范将 NEL 视为空白，键应为 `b`：
```
(object_pair [1, 0] - [2, 0]
  key: (key [1, 0] - [1, 3])      # 3 bytes = NEL(2) + 'b'
  separator: (sep_string [1, 3] - [1, 4])
  value: (integer [1, 5] - [2, 0]))
```

NBSP（`04`）和 U+3000（`29`）也观察到相同键形状。没有 ERROR 节点，解码后的键被静默破坏。

**失败 B — 值/空行静默损坏：**`a: <NBSP>x` 中标量范围包含 NBSP；按 § 3.3 裁剪后值应为 `x`（实测 `value: (scalar [0, 3] - [1, 0])`）。只有 NBSP 的行被解析为 `top_array_item (top_scalar)`，但 § 3.5 规定仅含空白的行应为空行（实测编号 `28`）。

**失败 C — 误拒绝规范有效文档：**
- `a: 1` 后的 FF 缩进 `\u000Cb: 2` 产生 `(ERROR [1, 0] - [2, 0] (multiline_content_line ...))`；规范规定 FF 是空白（`06`）。
- `a\u000Bb: 1`（键内 VT）报错，但附录 A 要求 VT/FF 原始字节可作为键内容（`05`）。
- `a:<NBSP>1` 报错并恢复为垃圾内容加 `top_scalar`；`<sep-end>` 允许 `1*ws`，故应解析为键值对。`_marker_ws` 只检查五种 ASCII 字节（`25`）。
- `}` + NBSP + 换行无法作为对象闭合符解析；规范允许 `(ws) "}" (ws) <line-end>`。根因是 `is_h_ws`（`30`）。

FF 缩进、键中的 VT/FF、冒号后的 NBSP、闭合行中的 NBSP 分别由字节精确用例 `06`、`05`、`25`、`30` 探测。前两项会误拒绝有效输入；后两项也表明扫描器按 ASCII 字节列表判断，而非使用规范集合。

**必须实现：**对 `extras`、所有内容空白排除项（按位置将 VT/FF 作为键内容；非 ASCII 空白不得成为解码后的键/标量内容）、`_marker_ws`、`is_h_ws`/`_strict_eol` 以及注释/空行的前导 `ws` 使用精确 25 点集合。

**负责人：**三个已排任务均未涵盖，见 § 11。建议并入 `\uXXXX` + BOM 的词法基础任务。

**难度 / 扫描器：**可直接用显式的单行字符类 `[\t\u000B\u000C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]`。不得使用 `\s` 或宿主语言的 `is_whitespace` 函数。需同步修改 `src/scanner.c` 字节集合；无需增加外部扫描器。

