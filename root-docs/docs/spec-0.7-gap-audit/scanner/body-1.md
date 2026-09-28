>>>>> lang=en
## 12. External-scanner summary

- **No external scanner needed:** G1 (quoted-key token is a plain regex token; opacity falls out of single-token consumption), G3 (hard-coded 25-cp classes; existing scanner.c byte-set edits only), G4 (`optional(/\uFEFF/)`), G6 (regex sweep).
- **External scanner (new logic in C) required if:** G2's lone-surrogate rejection is wanted at parse time (cross-token surrogate-pairing state); G5's root-kind enforcement is ever wanted (document-state tracking). Both alternatives (semantic-layer rejection / continued delegation) avoid new scanner code — that is the decision in § 11.
- The existing external scanner (`_marker_ws`, `_strict_eol`, `_stripped_close`, `_verbatim_close`) stays; G3 widens its accepted byte sets.

>>>>> lang=ru
## 12. Сводка по внешнему сканеру

- **Внешний сканер не нужен:** G1 (regex-токен ключа в кавычках; непрозрачность обеспечивается поглощением одного токена), G3 (жёстко заданные классы из 25 кодовых точек и изменение байтовых наборов существующего `scanner.c`), G4 (`optional(/\uFEFF/)`), G6 (замена regex).
- **Новая логика на C во внешнем сканере нужна только если:** G2 должен отвергать одиночные суррогаты на этапе разбора (состояние между токенами) или G5 должен принудительно проверять вид корня (состояние документа). Семантическая проверка либо сохранение делегирования не требуют новой логики; см. § 11.
- Имеющиеся токены сканера `_marker_ws`, `_strict_eol`, `_stripped_close`, `_verbatim_close` сохраняются. G3 расширяет принимаемые ими байтовые наборы.

>>>>> lang=zh
## 12. 外部扫描器总结

- **无需外部扫描器：**G1（引号键的正则 token，单 token 消费自然保证内容不透明）、G3（硬编码的 25 码点集合及修改现有 `scanner.c` 字节集合）、G4（`optional(/\uFEFF/)`）、G6（替换行结束符正则）。
- **仅在以下选择下才需新增 C 外部扫描逻辑：**G2 若要在解析时拒绝孤立代理项（需跨 token 状态），或 G5 若要强制检查根类型（需跟踪文档状态）。改由语义层拒绝或继续委托参考解析器都不需新扫描器逻辑，见 § 11。
- 现有外部扫描器 token `_marker_ws`、`_strict_eol`、`_stripped_close`、`_verbatim_close` 保留；G3 会扩大其接受的字节集合。

