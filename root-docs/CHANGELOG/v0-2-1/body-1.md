>>>>> lang=en
## [0.2.1] — 2026-05-01

Bug-fix release. Two valid-fixture gaps from the conformance suite
are now closed, so `KNOWN_VALID_FAILURES` in `tests/conformance.rs`
is empty.

### Fixed

- **§ 5.2 (raw / typed marker bodies are NOT dispatched).** After
  `::`, `:i`, or `:f` the value is now restricted in `grammar.js` to
  `empty_value` or `scalar`. Previously a body that began with `(` —
  e.g. `a:: (` — was mis-dispatched as a multi-line stripped opener;
  now it is captured verbatim as a one-line scalar. This also makes
  `null` / `true` / `false` after `::` parse as a `scalar`, matching
  the spec's "literal string" interpretation of raw-marker bodies.
  (`test/corpus/keywords.txt` updated; the prior shape was incorrect.)
- **`))` inside a stripped `(...)` and `)` inside a verbatim
  `((...))` are now content, not a closer.** The two compound
  closers `)` / `))` became context-sensitive external scanner tokens
  (`_stripped_close`, `_verbatim_close`) so the scanner only emits
  the one valid in the current parse state, and a non-matching
  bracket sequence falls through to `multiline_content_line`.

### Added

- Four corpus tests in `test/corpus/spec-conformance.txt`: raw-marker
  with `(`, `((`, `()`, `(())` bodies; stripped block containing
  `))`; verbatim block containing single `)`; stripped block
  containing `((`.
- Two new external tokens: `_stripped_close`, `_verbatim_close`
  (declared in `grammar.js`, implemented in `src/scanner.c`).

### Changed

- `tests/conformance.rs` — `KNOWN_VALID_FAILURES` is now empty.

>>>>> lang=ru
## [0.2.1] — 2026-05-01

Релиз с исправлением ошибок. Две valid-фикстуры из conformance-набора
теперь проходят, а список `KNOWN_VALID_FAILURES` в
`tests/conformance.rs` стал пустым.

### Исправлено

- **§ 5.2 (тело raw / типизированных маркеров НЕ диспетчеризуется).**
  После `::`, `:i` или `:f` тело в `grammar.js` теперь ограничено
  `empty_value` или `scalar`. Раньше тело, начинающееся с `(` —
  например `a:: (` — ошибочно открывало многострочный stripped-блок;
  теперь оно захватывается дословно как однострочный скаляр. Заодно
  `null` / `true` / `false` после `::` теперь парсятся как `scalar`,
  что совпадает с трактовкой raw-маркера как «литеральной строки».
  (`test/corpus/keywords.txt` обновлён: предыдущая форма была
  некорректной.)
- **`))` внутри stripped `(...)` и одиночная `)` внутри verbatim
  `((...))` теперь являются содержимым, а не закрывателем.** Оба
  закрывателя (`)` / `))`) стали контекстно-зависимыми токенами
  внешнего сканера (`_stripped_close`, `_verbatim_close`); сканер
  выдаёт только тот, что валиден в текущем состоянии парсера, а
  «чужая» скобочная последовательность падает на токен
  `multiline_content_line`.

### Добавлено

- Четыре corpus-теста в `test/corpus/spec-conformance.txt`:
  raw-маркер с телом `(`, `((`, `()`, `(())`; stripped с `))` в
  содержимом; verbatim с одиночной `)` в содержимом; stripped с
  `((` в содержимом.
- Два новых внешних токена: `_stripped_close`, `_verbatim_close`
  (объявлены в `grammar.js`, реализованы в `src/scanner.c`).

### Изменено

- `tests/conformance.rs` — список `KNOWN_VALID_FAILURES` пуст.

>>>>> lang=zh
## [0.2.1] — 2026-05-01

缺陷修复版本。conformance 测试套件中此前两个失败的 valid 用例现已
通过，`tests/conformance.rs` 中的 `KNOWN_VALID_FAILURES` 列表已清空。

### 修复

- **§ 5.2（raw / 类型化标记之后的值体不再走多行派发）。** 在 `::`、
  `:i`、`:f` 之后，`grammar.js` 现在仅允许 `empty_value` 或 `scalar`。
  此前以 `(` 开头的值体（例如 `a:: (`）会被错误地识别为多行 stripped
  开始符；现在会被原样捕获为单行标量。同样，`null` / `true` / `false`
  在 `::` 之后将解析为 `scalar`，与规范对 raw 标记体的「字面字符串」
  解释一致。（`test/corpus/keywords.txt` 已同步更新，先前的形状不正确。）
- **stripped `(...)` 内部的 `))` 与 verbatim `((...))` 内部的单个 `)`
  现在被视为内容而非闭合符。** 两个闭合符（`)` / `))`）已变为上下文
  相关的外部扫描器 token（`_stripped_close`、`_verbatim_close`）；
  扫描器仅在当前解析状态下有效时发出对应 token，不匹配的括号序列
  会回落到 `multiline_content_line`。

### 新增

- `test/corpus/spec-conformance.txt` 中新增四个 corpus 用例：raw
  标记后带 `(`、`((`、`()`、`(())`；stripped 块内含 `))`；verbatim
  块内含单个 `)`；stripped 块内含 `((`。
- 两个新的外部 token：`_stripped_close`、`_verbatim_close`（在
  `grammar.js` 中声明，在 `src/scanner.c` 中实现）。

### 变更

- `tests/conformance.rs` —— `KNOWN_VALID_FAILURES` 现已为空。

