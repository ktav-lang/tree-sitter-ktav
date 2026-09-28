>>>>> lang=en
**Spec requirement** (`spec.md:808-817`): "The root kind is **fixed** by the first content line." Inside a top-level Array, "a line that looks like a pair (e.g. `host: localhost`) is just a bare scalar String per § 5.4 rule 9; there is no implicit re-classification back to a pair." Inside a top-level Object, "A bare scalar without `:` is a `MissingSeparator` error." Rules 2–5 + § 6.14: after a top-level inline compound or a lone opener, any further content line is `OrphanLineAfterTopLevelInline`.

**Grammar today** (`grammar.js:79-91`) — and the grammar's own header comment admits the delegation:
```js
// The top-level document is a sequence of lines. Per spec § 5.0.1
// the root may be either an Object or an Array. Tree-sitter accepts
// both kinds of line anywhere; semantic dispatch is left to the
// reference parser.
source_file: $ => repeat($._line),
```

**Demonstrated inputs** (observed):
- `a: 1` + `plain` → ACCEPTED as `object_pair` + `top_array_item(top_scalar)`; spec: Object root → `MissingSeparator` error for line 2 (`20`).
- `:: x` + `host: localhost` → `top_array_item` + `object_pair`; spec: Array root, line 2 is a String item `host: localhost` — same tokens, different tree shape (`21`).
- `{a: 1}` + `b: 2` → both lines accepted; spec: `OrphanLineAfterTopLevelInline` error (`22`).
- Quoted-key interplay: `'tis the season: fa` as first line must re-classify from Object pair (today's parse) to root-Array String item (G1, `18`).

**Must produce (if enforced):** document-level dispatch fixed by the first content line, with the three error/shape behaviours above. Note the parser *cannot* distinguish "error" from "unusual but accepted" — for the CST, "must produce" reduces to tree shape (no `top_scalar` node after a pair line; no `object_pair` node after a raw item; no pair line after a top-level inline).

**Owner:** **unassigned** — none of the three queued tasks covers it; see § 11.

**Difficulty / scanner note:** root-kind-dependent dispatch across the whole document is context-sensitive — not expressible with tree-sitter's regex lexer alone; it would need a stateful **external scanner** (tracking "root seen / which kind") or an accepted, documented continued delegation to the reference parser (the current design intent, per the comment quoted above). This audit takes no side; it is a human decision.

>>>>> lang=ru
## 5. G5 — Вид корня не проверяется (§ 5.0.1, § 5.1)

**Требование спецификации** (`spec.md:808-817`): вид корня фиксируется первой содержательной строкой. В корневом Array текст, похожий на пару, например `host: localhost`, остаётся голым скаляром String (§ 5.4, правило 9) и не переклассифицируется в пару. В Object голый скаляр без `:` — ошибка `MissingSeparator`. Правила 2–5 и § 6.14: содержимое после верхнеуровневого inline-составного значения или одинокой открывающей скобки даёт `OrphanLineAfterTopLevelInline`.

Следовательно, требование к CST при включении проверки касается классификации и формы дерева; сам tree-sitter не передаёт типизированную таксономию ошибок эталонного парсера.

**Текущая грамматика** (`grammar.js:79-91`) прямо делегирует это:
```js
// The top-level document is a sequence of lines. Per spec § 5.0.1
// the root may be either an Object or an Array. Tree-sitter accepts
// both kinds of line anywhere; semantic dispatch is left to the
// reference parser.
source_file: $ => repeat($._line),
```

**Наблюдавшиеся входы:**
- `a: 1` + `plain` → принята пара и `top_array_item(top_scalar)`; спецификация требует Object и `MissingSeparator` для строки 2 (`20`).
- `:: x` + `host: localhost` → элемент массива и пара; по спецификации Array, а вторая строка — строковый элемент `host: localhost` (те же токены, другое дерево, `21`).
- `{a: 1}` + `b: 2` → приняты обе строки; спецификация требует `OrphanLineAfterTopLevelInline` (`22`).
- Взаимодействие с G1: первая строка `'tis the season: fa` должна стать строковым элементом корневого Array (`18`).

**Требуемая форма (если проверять):** диспетчеризация по первой содержательной строке: после пары нет `top_scalar`; после сырого элемента нет `object_pair`; после верхнеуровневого inline-значения нет пары. Сам парсер не отличает ошибку от необычного принятия.

**Владелец:** не назначен; см. § 11. Диспетчеризация по состоянию корня контекстно-зависима и требует внешнего сканера с состоянием либо документированного делегирования эталонному парсеру. Аудит не выбирает вариант.

>>>>> lang=zh
## 5. G5 — 未强制检查根类型（§ 5.0.1、§ 5.1）

**规范要求**（`spec.md:808-817`）：首个内容行固定根类型。在顶层 Array 中，看似键值对的文本（如 `host: localhost`）仍是裸字符串标量（§ 5.4 规则 9），不得重新分类为键值对。在顶层 Object 中，没有 `:` 的裸标量属于 `MissingSeparator`。规则 2–5 及 § 6.14 规定：顶层内联复合值或单独开符之后再有内容行，应报 `OrphanLineAfterTopLevelInline`。

因此，若要强制此规则，CST 层的要求是分类和树形；tree-sitter 本身不能表达参考解析器的类型化错误分类。

**当前语法**（`grammar.js:79-91`）明确委托处理：
```js
// The top-level document is a sequence of lines. Per spec § 5.0.1
// the root may be either an Object or an Array. Tree-sitter accepts
// both kinds of line anywhere; semantic dispatch is left to the
// reference parser.
source_file: $ => repeat($._line),
```

**实测输入：**
- `a: 1` + `plain` 被接受为键值对和 `top_array_item(top_scalar)`；规范要求根为 Object，第二行报 `MissingSeparator`（`20`）。
- `:: x` + `host: localhost` 被解析为数组项加键值对；规范要求根为 Array，第二行是字符串项 `host: localhost`（token 相同，树形不同，`21`）。
- `{a: 1}` + `b: 2` 两行均被接受；规范要求 `OrphanLineAfterTopLevelInline`（`22`）。
- G1 的交互：首行 `'tis the season: fa` 必须成为根 Array 字符串项（`18`）。

**若强制执行，必须得到：**由首个内容行决定整份文档的分派，并保持上述树形：键值对后不能有 `top_scalar`；裸数组项后不能有 `object_pair`；顶层内联值后不能再有键值对。解析器本身无法区分错误与异常接受。

**负责人：**未分配，见 § 11。根状态分派是上下文相关的，需要有状态外部扫描器，或继续明确委托参考解析器。审计不预先选择方案。

