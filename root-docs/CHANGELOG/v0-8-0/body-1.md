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

- Grammar openers recognize all 23 inline whitespace code points
  (§ 3.3), not only ASCII whitespace.
- Highlight queries capture raw top-level and inline scalar values;
  locals queries define scopes and keys for inline objects.
- Inline object and array highlights capture only the anonymous brace
  and bracket delimiter tokens, leaving their contents to their own captures.

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

- Открывающие конструкции грамматики распознают все 23 пробельные
  кодовые точки внутри строки (§ 3.3), а не только ASCII-пробелы.
- Запросы подсветки захватывают raw-скаляры верхнего уровня и inline-
  скаляры; запросы locals задают области видимости и ключи inline-объектов.
- Подсветка inline-объектов и массивов захватывает только анонимные
  токены фигурных и квадратных скобок; содержимое получает собственные захваты.

>>>>> lang=zh
## 0.8.0 —— 2026-09-28

语法跟随 Ktav 规范 **0.8.0**（spec 子模块固定在 `v0.8.0`）。相较 0.7.0，0.8.0 未新增任何语法；其 § 5.2 前导零类型推断规则也反映在编辑器语法树中，此类形式归为标量。crate/包版本随之升至 **0.8.0**，与核心库及规范保持一致（本包从未发布过 0.7.x 标签）。

### 新增

- 带引号的键段（§ 5.3.3）：键可以以反引号包裹的段开头，
  而非裸段；此类键可在 `queries/highlights.scm` 中与裸键区分。
- 转义表已完整，共 14 种形式（§ 3.7）。
- 跳过恰好一个前导的字节顺序标记（BOM）（§ 3.1）。

### 修复

- 语法开符现在识别全部 23 个行内空白码位（§ 3.3），而不只是
  ASCII 空白。
- 高亮查询现可捕获顶层及内联 raw 标量；locals 查询为内联对象
  定义作用域和键。
- 内联对象和数组的高亮现在仅捕获匿名的花括号与方括号 token，
  其内容仍由各自的捕获规则着色。
- 带空格键的位置规则按段应用，而非按词
  （§ 5.3.3）。
- 完整的 25 个码位空白字符集（§ 3.3）会被识别，
  并在词元边缘裁去，而非此前较窄的纯 ASCII 集。
- 单独的 CR 现在被接受为合法的行终止符（§ 3.2）。
- 原始 `#` 现在允许作为普通键字符（§ 3.4、§ 4）。
- 首个内容行决定根类型（§ 5.0.1）：Array 中形似键值对的行仍是
  字符串，已闭合的内联根之后不能再有内容。紧贴的 `:` 或未闭合的
  起始引号可使根类型成为 Array。
- `::` 之后的内联 raw 标量现在有专用的语法规则
  （§ 4、§ 5.8.5），而不再落入通用标量路径。
- 多行字符串内容中的嵌入 NUL 字节现在视为内容而非 EOF；外部扫描器
  会继续读取完整内容行。
- 文件末尾的值不再要求末尾换行，也不会产生缺失换行节点；
  整数和浮点数在 EOF 处仍保留各自的数值节点类型。
- EOF 数值词元必须覆盖整个值，因此 `1.2.3` 仍是字符串，
  不会在 `1.2` 前缀后被拆开。
- `01234`、`01.5` 等带冗余前导零的十进制形式归为标量节点，
  不再归为 integer/float；`0`、`0.5` 和带进制前缀的整数仍保留
  数值节点（§ 5.2）。
### 变更

