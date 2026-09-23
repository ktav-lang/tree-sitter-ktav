>>>>> lang=en
- New top-level node kind **`top_array_item`**: structurally a
  sibling of `array_item` but emitted only at the document root
  (inside `[…]` the existing `array_item` is still used). Its
  shape is `marker?: <sep_*>`, `value: <…>`. The plain bare-scalar
  branch produces a new **`top_scalar`** node, distinguished from
  the inside-of-pair `scalar` so consumers can tell a top-level
  Array element apart from a pair value at a glance.
- New corpus file **`test/corpus/top_level_array.txt`** with nine
  cases: bare scalars, typed/raw markers, nested objects, nested
  arrays, multi-line items, comments-and-blanks interleaving, the
  pair-wins-at-root rule, top-level keywords, and top-level
  empty inline compounds.
- The conformance suite at `tests/conformance.rs` automatically
  picks up the spec submodule's new
  `valid/top_level_array/**` fixtures (six files); they now pass
  cleanly.

### Changed

>>>>> lang=ru
- Новый узел верхнего уровня **`top_array_item`** —
  структурный аналог `array_item`, но выпускаемый только в корне
  документа (внутри `[…]` по-прежнему используется существующий
  `array_item`). Форма: `marker?: <sep_*>`, `value: <…>`. Ветвь
  голого скаляра выпускает новый узел **`top_scalar`**,
  отличный от внутрипарного `scalar`, чтобы потребители могли
  с первого взгляда отличить элемент верхнего массива от
  значения пары.
- Новый файл корпуса **`test/corpus/top_level_array.txt`** с
  девятью случаями: голые скаляры, типизированные/raw-маркеры,
  вложенные объекты, вложенные массивы, многострочные элементы,
  комментарии и пустые строки между элементами, правило
  «пара побеждает в корне», верхнеуровневые ключевые слова и
  верхнеуровневые пустые встроенные компаунды.
- Conformance-набор `tests/conformance.rs` автоматически
  подхватывает новые фикстуры submodule
  `valid/top_level_array/**` (шесть файлов); все проходят чисто.

### Изменено

>>>>> lang=zh
- 新顶层节点 **`top_array_item`**：结构上是 `array_item` 的
  兄弟，但仅在文档根部发射（`[…]` 内部仍使用既有的
  `array_item`）。形态：`marker?: <sep_*>`、`value: <…>`。
  其裸标量分支产生新节点 **`top_scalar`**，与对内 `scalar`
  区分开，便于使用方一眼识别顶层数组元素与键-值对的值。
- 新增语料文件 **`test/corpus/top_level_array.txt`**，覆盖
  九个用例：裸标量、类型化/raw 标记、嵌套对象、嵌套数组、
  多行项、注释与空行夹杂、根处「键-值对优先」规则、顶层关键字
  与顶层空内联复合体。
- `tests/conformance.rs` 一致性套件自动接入 spec 子模块新增
  的 `valid/top_level_array/**` 样例（六个文件）；全部通过。

### 变更

