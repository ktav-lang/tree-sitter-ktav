>>>>> lang=en
## Node types

The grammar produces the following named nodes:

| Node                       | What it captures                                |
|----------------------------|-------------------------------------------------|
| `source_file`              | the whole document                              |
| `comment`                  | a `#`-line comment                              |
| `blank_line`               | an empty line                                   |
| `object_pair`              | `key SEP value` line                            |
| `key` / `dotted_key`       | the key portion (with optional `.` separators)  |
| `sep_string` / `sep_raw` / `sep_int` / `sep_float` | the four separators       |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | keywords                  |
| `scalar`                   | the catch-all single-line value body            |
| `compound_object`          | `{` … `}` block                                 |
| `compound_array`           | `[` … `]` block                                 |
| `array_item`               | a single item in an array                       |
| `multiline_stripped`       | `(` … `)` block                                 |
| `multiline_verbatim`       | `((` … `))` block                               |
| `multiline_content_line`   | a single line inside a multi-line string        |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | inline empty forms |
| `empty_value`              | separator immediately followed by EOL           |

`object_pair` exposes `key`, `separator`, and `value` as fields;
`array_item` exposes `marker` (optional) and `value`.

>>>>> lang=ru
## Узлы AST

Грамматика генерирует следующие именованные узлы:

| Узел                       | Что захватывает                                  |
|----------------------------|--------------------------------------------------|
| `source_file`              | весь документ                                    |
| `comment`                  | строковый комментарий `#`                        |
| `blank_line`               | пустую строку                                    |
| `object_pair`              | строку `ключ SEP значение`                       |
| `key` / `dotted_key`       | ключ (с возможным `.`-разбиением)                |
| `sep_string` / `sep_raw` / `sep_int` / `sep_float` | четыре разделителя           |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | ключевые слова               |
| `scalar`                   | универсальное однострочное значение              |
| `compound_object`          | блок `{` … `}`                                   |
| `compound_array`           | блок `[` … `]`                                   |
| `array_item`               | элемент массива                                  |
| `multiline_stripped`       | блок `(` … `)`                                   |
| `multiline_verbatim`       | блок `((` … `))`                                 |
| `multiline_content_line`   | строка внутри многострочного значения            |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | пустые inline-формы |
| `empty_value`              | разделитель сразу за концом строки               |

`object_pair` экспонирует поля `key`, `separator`, `value`;
`array_item` — `marker` (опционально) и `value`.

>>>>> lang=zh
## 节点类型

语法生成以下命名节点：

| 节点                      | 捕获内容                                      |
|---------------------------|-----------------------------------------------|
| `source_file`             | 整个文档                                      |
| `comment`                 | `#` 行注释                                    |
| `blank_line`              | 空行                                          |
| `object_pair`             | `key SEP value` 行                            |
| `key` / `dotted_key`      | 键部分（可包含 `.` 分隔符）                   |
| `sep_string` / `sep_raw` / `sep_int` / `sep_float` | 四种分隔符           |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | 关键字               |
| `scalar`                  | 通用单行值正文                                |
| `compound_object`         | `{` … `}` 块                                  |
| `compound_array`          | `[` … `]` 块                                  |
| `array_item`              | 数组中的单个元素                              |
| `multiline_stripped`      | `(` … `)` 块                                  |
| `multiline_verbatim`      | `((` … `))` 块                                |
| `multiline_content_line`  | 多行字符串内的单行                            |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | 内联空形式 |
| `empty_value`             | 分隔符紧跟行尾                                |

`object_pair` 暴露字段 `key`、`separator`、`value`；`array_item`
暴露 `marker`（可选）和 `value`。

