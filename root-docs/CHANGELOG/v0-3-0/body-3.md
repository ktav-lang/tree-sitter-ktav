>>>>> lang=en
- **`grammar.js`**:
  - `_line` (the top-level repetition unit) now branches on
    `top_array_item` in addition to `object_pair`.
  - `comment` is now captured as a single whole-line token
    (`#[^\r\n]*\r?\n`), with `prec(1)`. Previously it was a
    three-piece `seq('#', optional(/[^\r\n]*/), $._newline)`.
    The single-token form is required so that comments out-rank
    the new whole-line `_top_scalar_text` token at the lexer's
    longest-match step. The AST shape of `(comment)` is
    unchanged.
  - The new `_top_scalar_text` token deliberately spans the
    whole line **including the trailing newline**. This makes it
    strictly longer than `_key_segment` (which stops at any
    structural byte) on a colon-free line, so the lexer commits
    to the top-level Array-item path on `foo\n` rather than to
    the always-failing pair-without-separator path. On a
    colon-bearing line the regex cannot match at all (`:` is
    excluded), so `_key_segment` is the only viable token and
    the parser correctly enters `object_pair`.
- Spec submodule advanced to `7256816` (`spec 0.1.1: top-level
  Array support`).

### Compatibility

- Existing top-level Object documents parse with **identical AST
  shape** as in 0.2.x. There are no removed node kinds, no
  renamed fields, and no parser errors introduced for any
  previously-valid input.
- Consumers that walk `source_file` children must now also
  handle `top_array_item` (in addition to `comment`,
  `blank_line`, `object_pair`). Highlights, locals, and
  injections queries in `queries/*.scm` were not affected.

>>>>> lang=ru
- **`grammar.js`**:
  - `_line` (повторяющаяся единица верхнего уровня) теперь
    помимо `object_pair` ветвится в `top_array_item`.
  - `comment` теперь захватывается одним токеном на всю
    строку (`#[^\r\n]*\r?\n`) с `prec(1)`. Раньше это была
    трёхэлементная `seq('#', optional(/[^\r\n]*/), $._newline)`.
    Однотокенная форма необходима, чтобы комментарии побеждали
    новый `_top_scalar_text` на шаге longest-match лексера.
    Форма AST `(comment)` не изменилась.
  - Новый токен `_top_scalar_text` сознательно охватывает
    **всю строку вместе с завершающим переводом строки**. Это
    делает его строго длиннее `_key_segment` (который
    останавливается на любом структурном байте) на строке без
    двоеточия, так что лексер фиксируется на ветке
    верхнеуровневого Array-элемента на `foo\n`, а не на
    всегда-падающей ветке пары без разделителя. На строке с
    двоеточием регекс не может сопоставиться вообще (`:`
    исключено), поэтому жизнеспособен только `_key_segment`,
    и парсер корректно входит в `object_pair`.
- Submodule `spec` продвинут до `7256816` (`spec 0.1.1:
  top-level Array support`).

### Совместимость

- Существующие документы-объекты верхнего уровня парсятся с
  **идентичной формой AST** к 0.2.x. Удалённых узлов,
  переименованных полей или новых ошибок парсера на ранее
  валидных входах нет.
- Потребители, обходящие потомков `source_file`, должны теперь
  также обрабатывать `top_array_item` (помимо `comment`,
  `blank_line`, `object_pair`). Запросы highlights, locals и
  injections в `queries/*.scm` не затронуты.

>>>>> lang=zh
- **`grammar.js`**：
  - 顶层重复单元 `_line` 现在除了 `object_pair` 还会分支到
    `top_array_item`。
  - `comment` 现以单 token 整行捕获（`#[^\r\n]*\r?\n`），
    带 `prec(1)`。此前为
    `seq('#', optional(/[^\r\n]*/), $._newline)` 的三段拼接。
    单 token 形式是为了在词法器最长匹配阶段令注释胜过新
    引入的整行 `_top_scalar_text` token。`(comment)` 的 AST
    形态不变。
  - 新 token `_top_scalar_text` 故意覆盖**整行包括末尾换
    行**。这令其在不含冒号的行上严格长于 `_key_segment`
    （后者在任意结构字节处停止），从而词法器在 `foo\n` 上
    选择顶层 Array 项分支，而非永远失败的「无分隔符的键-值对」
    分支。在含冒号的行上，正则完全无法匹配（排除 `:`），故
    `_key_segment` 是唯一可行 token，解析器正确进入
    `object_pair`。
- spec 子模块前进到 `7256816`（`spec 0.1.1: top-level Array
  support`）。

### 兼容性

- 现存的顶层 Object 文档与 0.2.x 在 AST 形态上**完全一致**。
  没有删除节点、没有重命名字段、也不会对此前合法的输入引入
  解析错误。
- 遍历 `source_file` 子节点的使用方现在还需要处理
  `top_array_item`（除 `comment`、`blank_line`、
  `object_pair` 之外）。`queries/*.scm` 中的 highlights、
  locals、injections 查询未受影响。

