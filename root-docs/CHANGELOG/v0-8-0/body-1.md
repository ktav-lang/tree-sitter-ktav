>>>>> lang=en
## 0.8.0 — 2026-09-28

Grammar tracks Ktav spec **0.8.0** (spec submodule pinned to `v0.8.0`).
Version 0.8.0 adds no syntax over 0.7.0; its § 5.2 leading-zero typing
rule is reflected in the editor tree by classifying those forms as scalars.
The crate/package version moves to **0.8.0**, in step with the core and
the specification (0.7.x was never tagged for this package).

### Added

- Quoted key segments (§ 5.3.3): a key may open with a backtick-quoted
  segment instead of a bare one, distinguished from a bare key in
  `queries/highlights.scm`.
- The escape table is complete, at 14 forms (§ 3.7).
- Exactly one leading byte-order mark is skipped (§ 3.1).

### Fixed

>>>>> lang=ru
## 0.8.0 — 2026-09-28

Грамматика следует спецификации Ktav **0.8.0** (submodule спецификации закреплён на `v0.8.0`). Версия 0.8.0 не добавляет синтаксиса поверх 0.7.0; типизационное правило § 5.2 о ведущем нуле отражено в дереве редактора: такие формы становятся скалярами. Версия crate/пакета поднимается до **0.8.0**, в ногу с ядром и спецификацией (0.7.x для этого пакета тегирован не был).

### Добавлено

- Сегменты ключа в кавычках (§ 5.3.3): ключ может начинаться с сегмента
  в обратных кавычках вместо голого; в `queries/highlights.scm` такой
  сегмент отличается от голого ключа.
- Таблица экранирования полна: 14 форм (§ 3.7).
- Ровно один ведущий байтовый маркер порядка байт (BOM) пропускается (§ 3.1).

### Исправлено

>>>>> lang=zh
## 0.8.0 —— 2026-09-28

语法跟随 Ktav 规范 **0.8.0**（spec 子模块固定在 `v0.8.0`）。相较 0.7.0，0.8.0 未新增任何语法；其 § 5.2 前导零类型推断规则也反映在编辑器语法树中，此类形式归为标量。crate/包版本随之升至 **0.8.0**，与核心库及规范保持一致（本包从未发布过 0.7.x 标签）。

### 新增

- 带引号的键段（§ 5.3.3）：键可以以反引号包裹的段开头，
  而非裸段；此类键可在 `queries/highlights.scm` 中与裸键区分。
- 转义表已完整，共 14 种形式（§ 3.7）。
- 跳过恰好一个前导的字节顺序标记（BOM）（§ 3.1）。

### 修复

