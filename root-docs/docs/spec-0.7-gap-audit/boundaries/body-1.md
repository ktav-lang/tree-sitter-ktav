>>>>> lang=en
## 9. Where `\uXXXX` is and is not recognised (boundary summary, per § 3.7.1)

| Context | 0.7.0 | Grammar today |
|---|---|---|
| bare key segment | processed (decoded cp never re-examined structurally) | not recognised — parse ERROR (`a\u0041b: 1`) |
| quoted key segment | processed | no quoted segments exist (G1) + no `\u` token (G2) |
| inline scalar value | processed; forces String | not recognised — parse ERROR (`k: {x: A\u0041B}`) |
| whole-line scalar value | NOT processed — literal | matches (observed `(scalar)`; corpus entry added) |
| multi-line `((…))`/`(…)` content | NOT processed — verbatim | matches structurally (`multiline_content_line` is opaque) |
| comments | NOT processed | matches (`comment` token is opaque) |

>>>>> lang=ru
## 9. Где `\uXXXX` обрабатывается и где нет (§ 3.7.1)

| Контекст | 0.7.0 | Текущая грамматика |
|---|---|---|
| голый сегмент ключа | обработка; декодированный символ повторно не становится структурным | не распознаётся — ERROR (`a\u0041b: 1`) |
| сегмент ключа в кавычках | обработка | формы в кавычках нет (G1), `\u` нет (G2) |
| inline-скаляр | обработка, принудительный тип String | не распознаётся — ERROR (`k: {x: A\u0041B}`) |
| скаляр всей строки | НЕ обрабатывается, это литерал | соответствует; наблюдался `(scalar)`, добавлен тест corpus |
| многострочный текст `((…))` / `(…)` | НЕ обрабатывается, дословный текст | структурно соответствует; `multiline_content_line` непрозрачен |
| комментарии | НЕ обрабатывается | соответствует; `comment` непрозрачен |

>>>>> lang=zh
## 9. `\uXXXX` 的处理与不处理位置（§ 3.7.1）

| 上下文 | 0.7.0 规范 | 当前语法 |
|---|---|---|
| 裸键段 | 解码；解码后的码点不再作为结构符号检查 | 不识别，报 ERROR（`a\u0041b: 1`） |
| 带引号键段 | 解码 | 不支持引号段（G1），也没有 `\u`（G2） |
| 内联标量值 | 解码并强制归类为 String | 不识别，报 ERROR（`k: {x: A\u0041B}`） |
| 整行标量值 | 不处理，作为字面内容 | 一致；实测为 `(scalar)`，且已加 corpus 用例 |
| 多行 `((…))` / `(…)` 内容 | 不处理，逐字保留 | 结构一致；`multiline_content_line` 不透明 |
| 注释 | 不处理 | 一致；`comment` 不透明 |

