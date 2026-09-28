>>>>> lang=en
## 4. G4 — Leading byte-order mark (§ 3.1)

**Spec requirement** (`spec.md:97-101`): "A parser-conforming implementation MUST skip exactly one leading byte-order mark (U+FEFF) if it is the very first code point of the document, before any other byte ... A U+FEFF code point anywhere else in the document is ordinary content — § 3.3 does not classify it as whitespace." New in 0.7.0 ("Unspecified in 0.6.4", Appendix A `spec.md:3306-3312`).

**Grammar today:** `grammar.js:83` — `source_file: $ => repeat($._line)` — no BOM term anywhere; U+FEFF bytes at offset 0 match no token.

**Demonstrated inputs** (observed):
- `EF BB BF` + `a: 1\n` → the pair parses, but the source node **starts at [0, 3]** and NO node covers the BOM — it disappears via lexer error recovery, invisibly:
```
(source_file [0, 3] - [1, 0]
  (object_pair [0, 3] - [1, 0]
    key: (key [0, 3] - [0, 4]) ...))
```
- `EF BB BF EF BB BF` + `a: 1\n` (two BOMs) → first BOM swallowed by recovery, second BOM glued into the key text (`key [0, 3] - [0, 7]` = BOM + `a`). Decoded key `\uFEFFa` — which is what § 3.1 *wants* (skip exactly one; the second is content) — but for the wrong reason: nothing in the grammar encodes "exactly one at offset 0"; the outcome is incidental error-recovery behaviour and is not guaranteed for other shapes (e.g. BOM before a comment line was not probed).
- BOM-only document → `(source_file [0, 3] - [0, 3])` (empty tree).
- BOM mid-key (`b\uFEFFc: 2`) → key contains it as content — **conformant** (matches "ordinary content").

**Must produce:** a first-class, guaranteed skip of exactly one leading U+FEFF.

**Owner:** the **\uXXXX + BOM** task.

**Difficulty / scanner note:** trivially regex-expressible — e.g. `source_file: $ => seq(optional(/\uFEFF/), repeat($._line))` — no external scanner. Benefit: the skip becomes a guaranteed grammar property and is visible/testable instead of recovery-dependent.

## 5. G5 — Root-kind detection is not enforced (§ 5.0.1, § 5.1)

>>>>> lang=ru
## 4. G4 — Начальный маркер порядка байтов (BOM, § 3.1)

**Требование спецификации** (`spec.md:97-101`): пропустить ровно один U+FEFF, только если он является первой кодовой точкой/байтом; дальнейший U+FEFF — обычное содержимое, не пробел. Новое правило 0.7.0; в 0.6.4 не задано (приложение A, `spec.md:3306-3312`).

Пропуск происходит до любого другого байта: второй U+FEFF должен остаться во входе. Это правило ровно одного BOM, а не удаление всех BOM.

**Текущая грамматика:** `grammar.js:83` — `source_file: $ => repeat($._line)`; токена BOM нет, начальный U+FEFF не соответствует токену.

**Наблюдавшиеся входы:**
- `EF BB BF` + `a: 1\n`: пара разбирается, но source начинается в `[0, 3]`; BOM не покрыт узлом и исчезает при восстановлении лексера:
```
(source_file [0, 3] - [1, 0]
  (object_pair [0, 3] - [1, 0]
    key: (key [0, 3] - [0, 4]) ...))
```
- Два BOM перед `a: 1\n`: первый поглощается восстановлением; второй попадает в ключ (`key [0, 3] - [0, 7]`) как `\uFEFFa` по неверной причине. Правило одного BOM в нулевой позиции не задано; BOM перед комментарием не проверялся.
- Только BOM: `(source_file [0, 3] - [0, 3])` (пустое дерево). BOM в середине `b\uFEFFc: 2` остаётся содержимым, как требуется.

**Требуемое поведение:** гарантированно пропускать ровно один начальный U+FEFF.

**Владелец:** задача **\uXXXX + BOM**.

**Сложность / сканер:** достаточно необязательного начального токена, например `source_file: $ => seq(optional(/\uFEFF/), repeat($._line))`; внешний сканер не нужен.

>>>>> lang=zh
## 4. G4 — 文档开头的字节顺序标记（BOM，§ 3.1）

**规范要求**（`spec.md:97-101`）：只在 U+FEFF 为首个码点/字节时跳过一个；后续 U+FEFF 是普通内容，不是空白。0.7.0 新增；0.6.4 未规定（附录 A，`spec.md:3306-3312`）。

跳过必须发生在读取任何其他字节之前；第二个 U+FEFF 必须保留在输入中。这是“恰好一个”的规则，不是通用 BOM 清除。

**当前语法：**`grammar.js:83` 为 `source_file: $ => repeat($._line)`；无 BOM token，因此开头 U+FEFF 不匹配任何 token。

**实测输入：**
- `EF BB BF` + `a: 1\n`：键值对可解析，但 source 从 `[0, 3]` 开始；BOM 未被节点覆盖，靠词法错误恢复消失：
```
(source_file [0, 3] - [1, 0]
  (object_pair [0, 3] - [1, 0]
    key: (key [0, 3] - [0, 4]) ...))
```
- 两个 BOM 后接 `a: 1\n`：第一个靠恢复吞掉，第二个进入键成为 `\uFEFFa`（`key [0, 3] - [0, 7]`），结果正确但原因错误。语法未编码偏移零处恰好一个 BOM；BOM 在注释前的情况未探测。
- 仅 BOM 得到 `(source_file [0, 3] - [0, 3])`（空树）。`b\uFEFFc: 2` 中间的 BOM 保留为内容，符合规范。

**必须实现：**明确保证仅跳过开头的一个 U+FEFF。

**负责人：** **\uXXXX + BOM 任务**。

**难度 / 扫描器：**在开头加可选 token 即可，如 `source_file: $ => seq(optional(/\uFEFF/), repeat($._line))`；无需外部扫描器。

