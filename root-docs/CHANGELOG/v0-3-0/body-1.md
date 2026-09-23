>>>>> lang=en
## [0.3.0] — 2026-05-10

Spec sync: tracks **Ktav 0.1.1** (top-level Array detection,
§ 5.0.1, additive). The grammar now accepts a document whose root
is a sequence of array items — bare scalars, typed-marker items
(`:: …` / `:i …` / `:f …`), lone `{` / `[` openers, multi-line
openers (`(` / `((`), keywords, and inline empty compounds — at
the same level where it previously accepted only key-value pairs.

Pair-shaped lines at the root still parse as `object_pair` (spec
§ 5.0.1 step 2): a colon-bearing line is a pair, not a top-level
Array item. To force a colon-bearing scalar at the root to be
captured as an array item, use the raw marker form
(`:: host: localhost`).

### Added

>>>>> lang=ru
## [0.3.0] — 2026-05-10

Синхронизация со спецификацией: трекинг **Ktav 0.1.1**
(детекция верхнеуровневого Array, § 5.0.1, аддитивно). Грамматика
теперь принимает документ, корнем которого является
последовательность элементов массива — голые скаляры, элементы
с типизированными маркерами (`:: …` / `:i …` / `:f …`),
одиночные `{` / `[` открыватели, многострочные открыватели
(`(` / `((`), ключевые слова и встроенные пустые компаунды — на
том же уровне, где раньше принимались только пары ключ-значение.

Линии, имеющие форму пары, в корне по-прежнему парсятся как
`object_pair` (спец. § 5.0.1 шаг 2): строка с двоеточием — это
пара, а не элемент верхнеуровневого Array. Чтобы заставить
строку с двоеточием в корне быть элементом массива, используйте
raw-маркер (`:: host: localhost`).

### Добавлено

>>>>> lang=zh
## [0.3.0] — 2026-05-10

规范同步：跟进 **Ktav 0.1.1**（顶层 Array 检测，§ 5.0.1，纯增量
变更）。语法现在接受根为数组项序列的文档 —— 裸标量、类型化标记项
（`:: …` / `:i …` / `:f …`）、独立的 `{` / `[` 开启、多行开启
（`(` / `((`）、关键字以及内联空复合体 —— 与之前只接受键-值对的
位置一致。

根处形如「键-值对」的行仍按 `object_pair` 解析（规范 § 5.0.1
第 2 步）：包含冒号的行是键值对，而非顶层 Array 项。如需把根处
含冒号的标量强制识别为数组项，请使用 raw 标记
（`:: host: localhost`）。

### 新增

