>>>>> lang=en
## Node types

Representative named nodes from the CST (`src/node-types.json`) include:

| Node                       | What it captures                                |
|----------------------------|-------------------------------------------------|
| `source_file`              | the whole document                              |
| `comment`                  | a `##`-line comment                             |
| `blank_line`               | an empty line                                   |
| `object_pair`              | `key SEP value` line                            |
| `key` / `dotted_key`       | the key portion and dotted segments             |
| `sep_string` / `sep_raw`   | the `:` and `::` pair separators                |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | keywords, whole-line and inline |
| `integer` / `float`        | numbers, whole-line and inline (§ 5.2 typing)  |
| `scalar` / `raw_scalar`    | ordinary and raw single-line values             |
| `compound_object`          | `{` … `}` block                                 |
| `compound_array`           | `[` … `]` block                                 |
| `inline_object` / `inline_array` | inline compounds with comma-separated entries |
| `inline_pair` / `inline_value` | entries and values in inline compounds        |
| `array_item` / `top_array_item` | items in compound and top-level arrays         |
| `multiline_stripped`       | `(` … `)` block                                 |
| `multiline_verbatim`       | `((` … `))` block                               |
| `multiline_content_line`   | a single line inside a multi-line string        |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | inline empty forms |
| `empty_value`              | separator plus the maximal allowed whitespace run through EOL or true EOF |

`object_pair` and `inline_pair` expose `key`, `separator`, and `value` fields
(`inline_pair.value` is optional); `array_item` and `top_array_item` expose a
required `value` and optional `marker`.

>>>>> lang=ru
## Узлы AST

Примеры именованных узлов CST (см. `src/node-types.json`):

| Узел                       | Что захватывает                                  |
|----------------------------|--------------------------------------------------|
| `source_file`              | весь документ                                    |
| `comment`                  | строковый комментарий `##`                       |
| `blank_line`               | пустую строку                                    |
| `object_pair`              | строку `ключ SEP значение`                       |
| `key` / `dotted_key`       | ключ и сегменты точечного пути                   |
| `sep_string` / `sep_raw`   | разделители пар `:` и `::`                       |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | ключевые слова, в строке и inline |
| `integer` / `float`        | числа, в строке и inline (типизация § 5.2)       |
| `scalar` / `raw_scalar`    | обычные и raw-значения в одну строку              |
| `compound_object`          | блок `{` … `}`                                   |
| `compound_array`           | блок `[` … `]`                                   |
| `inline_object` / `inline_array` | inline-структуры с элементами через запятую |
| `inline_pair` / `inline_value` | пары и значения inline-структур              |
| `array_item` / `top_array_item` | элементы массива и массива верхнего уровня    |
| `multiline_stripped`       | блок `(` … `)`                                   |
| `multiline_verbatim`       | блок `((` … `))`                                 |
| `multiline_content_line`   | строка внутри многострочного значения            |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | пустые inline-формы |
| `empty_value`              | разделитель и максимальная последовательность допустимых пробелов до конца строки или файла |

`object_pair` и `inline_pair` имеют поля `key`, `separator`, `value`
(`inline_pair.value` необязательно); `array_item` и `top_array_item` имеют
обязательное `value` и необязательное `marker`.

>>>>> lang=zh
## 节点类型

以下是 CST（参见 `src/node-types.json`）中的代表性命名节点：

| 节点                      | 捕获内容                                      |
|---------------------------|-----------------------------------------------|
| `source_file`             | 整个文档                                      |
| `comment`                 | `##` 行注释                                   |
| `blank_line`              | 空行                                          |
| `object_pair`             | `key SEP value` 行                            |
| `key` / `dotted_key`      | 键及其点分段                                   |
| `sep_string` / `sep_raw`  | 键值对分隔符 `:` 和 `::`                      |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | 关键字（整行值与内联值） |
| `integer` / `float`       | 数值（整行值与内联值，按 § 5.2 推断）          |
| `scalar` / `raw_scalar`   | 普通及 raw 单行值                              |
| `compound_object`         | `{` … `}` 块                                  |
| `compound_array`          | `[` … `]` 块                                  |
| `inline_object` / `inline_array` | 内联结构及其逗号分隔的条目               |
| `inline_pair` / `inline_value` | 内联结构中的键值对和值                   |
| `array_item` / `top_array_item` | 复合数组和顶层数组中的条目               |
| `multiline_stripped`      | `(` … `)` 块                                  |
| `multiline_verbatim`      | `((` … `))` 块                                |
| `multiline_content_line`  | 多行字符串内的单行                            |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | 内联空形式 |
| `empty_value`             | 分隔符后接最长的允许空白序列，直到行尾或真正的文件末尾 |

`object_pair` 和 `inline_pair` 暴露字段 `key`、`separator`、`value`
（`inline_pair.value` 可选）；`array_item` 与 `top_array_item` 暴露必需的
`value` 和可选的 `marker`。

