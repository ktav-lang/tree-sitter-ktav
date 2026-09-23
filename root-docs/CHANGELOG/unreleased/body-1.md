>>>>> lang=en
## Unreleased

Grammar tracks Ktav spec **0.8.0** (spec submodule pinned to `v0.8.0`); 0.8.0 adds no
syntax over 0.7.0 — its § 5.2 leading-zero rule is a typing rule, outside a
concrete syntax tree.
The crate/package version moves to **0.8.0**, in step with the core and
the specification (0.7.x was never tagged for this package).

### Added

- Quoted key segments (§ 5.3.3): a key may open with a backtick-quoted
  segment instead of a bare one, distinguished from a bare key in
  `queries/highlights.scm`.
- The escape table is complete, at 14 forms (§ 3.7).
- Exactly one leading byte-order mark is skipped (§ 3.1).

### Fixed

- The spaced-key positional rule applies per segment, not per word
  (§ 5.3.3).
- The full 25-code-point whitespace set (§ 3.3) is recognised and
  trimmed at token edges, not the narrower ASCII-only set used before.
- A lone CR is accepted as a valid line terminator (§ 3.2).
- A raw `#` is admitted as an ordinary key character (§ 3.4, § 4).
- Inline raw scalars after `::` get their own dedicated grammar rule
  (§ 4, § 5.8.5) instead of falling through the generic scalar path.

### Changed

- Conformance suite walks the spec **0.8.0** corpus (was 0.6).
- CI: `cargo publish` and `npm publish` now run through Trusted
  Publishing (OIDC) instead of long-lived registry tokens.

>>>>> lang=ru
## Unreleased

Грамматика следует спецификации Ktav **0.8.0** (submodule спецификации закреплён на `v0.8.0`); 0.8.0 не добавляет синтаксиса поверх 0.7.0 — правило § 5.2 о ведущем нуле типизационное, вне конкретного синтаксического дерева. Версия crate/пакета поднимается до **0.8.0**, в ногу с ядром и спецификацией (0.7.x для этого пакета тегирован не был).

### Добавлено

- Сегменты ключа в кавычках (§ 5.3.3): ключ может начинаться с сегмента
  в обратных кавычках вместо голого; в `queries/highlights.scm` такой
  сегмент отличается от голого ключа.
- Таблица экранирования полна: 14 форм (§ 3.7).
- Ровно один ведущий байтовый маркер порядка байт (BOM) пропускается (§ 3.1).

### Исправлено

- Правило позиционирования ключей с пробелами применяется к каждому
  сегменту, а не к слову (§ 5.3.3).
- Полный набор пробельных символов из 25 кодовых точек (§ 3.3) распознаётся и
  отсекается на границах токенов, а не прежний, более узкий набор только из ASCII.
- Одиночный CR принимается как корректный терминатор строки (§ 3.2).
- Сырой `#` допускается как обычный символ ключа (§ 3.4, § 4).
- Inline-raw-скаляры после `::` получают собственное правило
  грамматики (§ 4, § 5.8.5), вместо провала на общий путь скаляра.

### Изменено

- Conformance-набор обходит корпус спецификации **0.8.0** (ранее 0.6).
- CI: `cargo publish` и `npm publish` теперь идут через Trusted
  Publishing (OIDC) вместо долгоживущих токенов реестров.

>>>>> lang=zh
## Unreleased

语法跟随 Ktav 规范 **0.8.0**（spec 子模块固定在 `v0.8.0`）；相较 0.7.0，0.8.0 未新增任何语法 —— 其 § 5.2 前导零规则是类型推断规则，不涉及具体语法树。crate/包版本随之升至 **0.8.0**，与核心库及规范保持一致（本包从未发布过 0.7.x 标签）。

### 新增

- 带引号的键段（§ 5.3.3）：键可以以反引号包裹的段开头，
  而非裸段；此类键可在 `queries/highlights.scm` 中与裸键区分。
- 转义表已完整，共 14 种形式（§ 3.7）。
- 跳过恰好一个前导的字节顺序标记（BOM）（§ 3.1）。

### 修复

- 带空格键的位置规则按段应用，而非按词
  （§ 5.3.3）。
- 完整的 25 个码位空白字符集（§ 3.3）会被识别，
  并在词元边缘裁去，而非此前较窄的纯 ASCII 集。
- 单独的 CR 现在被接受为合法的行终止符（§ 3.2）。
- 原始 `#` 现在允许作为普通键字符（§ 3.4、§ 4）。
- `::` 之后的内联 raw 标量现在有专用的语法规则
  （§ 4、§ 5.8.5），而不再落入通用标量路径。

### 变更

- 一致性套件现在遍历规范 **0.8.0** 语料（此前为 0.6）。
- CI：`cargo publish` 与 `npm publish` 现在通过 Trusted
  Publishing（OIDC）运行，而非长期有效的 registry 令牌。

