>>>>> lang=en
## 8. 0.7.0 items with no grammar impact (checked, no action)

- **§ 6.15 `InvalidUtf8`** — a byte-level check that must happen "before any line-oriented or grammar-level processing". Tree-sitter receives already-valid UTF-8 by ABI; this is not expressible in `grammar.js` and belongs to the embedding parser. No action.
- **§ 5.2 rule 14** (a recognised escape forces String classification ahead of keyword/number) — semantic, decided on the decoded value; the CST already exposes `escape_sequence` nodes for the reference parser to key off. No action.
- **§ 6.13 `BadEscapeSequence` taxonomy** (malformed `\u`, lone surrogates) — error naming; see G2 for the one structural piece.
- **Writer-side 0.7 items** — § 5.9.0 representable Values, § 5.9.8 float boundaries/zero, § 5.9.10 key re-escaping (quoted-form preference), § 5.9.12 first-output-byte guard, § 8 numeric-domain caveats: all canonical-writer concerns; no parse-side effect.
- **Stale doc comments (cosmetic, for whichever task touches the file next):** `grammar.js:4` still points at the 0.6 spec; `src/scanner.c:8` still lists the removed `:i`/`:f` markers among the separators `_marker_ws` follows. No behaviour impact.

>>>>> lang=ru
## 8. Пункты 0.7.0 без влияния на грамматику (проверено, действий нет)

- **§ 6.15 `InvalidUtf8`** — проверка байтов до обработки строк или грамматики. По ABI tree-sitter уже получает корректный UTF-8; это задача встраивающего парсера, не `grammar.js`.
- **§ 5.2, правило 14:** распознанное экранирование задаёт тип String раньше проверки ключевых слов/чисел. Это семантика декодированного значения; CST предоставляет эталонному парсеру узлы `escape_sequence`.
- **Классификация `BadEscapeSequence` из § 6.13** (ошибочная `\u`, одиночные суррогаты) определяет название ошибки; структурная часть рассмотрена в G2.
- **Правила записи:** § 5.9.0 о представимых Values, § 5.9.8 о границах/нуле float, § 5.9.10 о предпочтительном повторном экранировании ключа, § 5.9.12 о первом выходном байте и числовые оговорки § 8 касаются канонической записи, не разбора.
- **Устаревшие комментарии (косметика):** `grammar.js:4` всё ещё ссылается на spec 0.6; `src/scanner.c:8` содержит удалённые маркеры `:i`/`:f` среди разделителей, после которых идёт `_marker_ws`. Поведение не затронуто.

>>>>> lang=zh
## 8. 不影响语法的 0.7.0 项目（已核查，无需处理）

- **§ 6.15 `InvalidUtf8`** 是按字节检查，必须早于行处理或语法解析。tree-sitter 的 ABI 输入已是有效 UTF-8，因此应由嵌入式解析器负责，而非 `grammar.js`。
- **§ 5.2 规则 14：**已识别的转义会在关键字/数字判定前强制归类为 String。这属于解码后值的语义；CST 提供 `escape_sequence` 节点供参考解析器使用。
- **§ 6.13 的 `BadEscapeSequence` 分类**（格式错误的 `\u`、孤立代理项）涉及错误名称；结构层面的部分见 G2。
- **写入端规则：**§ 5.9.0 可表示 Values、§ 5.9.8 浮点边界/零、§ 5.9.10 键重转义偏好、§ 5.9.12 首个输出字节限制及 § 8 数值范围注意事项都影响规范化写入，不影响解析。
- **过时注释（仅外观问题）：**`grammar.js:4` 仍引用 spec 0.6；`src/scanner.c:8` 仍将已删除的 `:i`/`:f` 标记列在 `_marker_ws` 后跟的分隔符中。不影响行为。

