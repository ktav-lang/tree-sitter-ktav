; Tree-sitter highlights for Ktav (כְּתָב).
; Capture names follow the standard set documented at
;   https://docs.helix-editor.com/themes.html#scopes
;   https://github.com/nvim-treesitter/nvim-treesitter (highlights.scm)

; ---- Comments ----
(comment) @comment

; ---- Keys ----
(key) @property
(dotted_key) @property
"." @punctuation.delimiter

; ---- Pair separators ----
(sep_string) @punctuation.delimiter
(sep_raw)    @punctuation.special
(sep_int)    @punctuation.special
(sep_float)  @punctuation.special

; ---- Compound brackets ----
; The structural openers / closers (`{`, `}`, `[`, `]`, `(`, `((`,
; `)`, `))`) are emitted as part of compound nodes rather than as
; standalone anonymous tokens (they include the trailing newline).
; Highlight the entire compound nodes' first/last lines instead.
(compound_object) @punctuation.bracket
(compound_array)  @punctuation.bracket

; ---- Empty inline forms ----
(empty_object)       @punctuation.bracket
(empty_array)        @punctuation.bracket
(empty_paren)        @string
(empty_double_paren) @string

; ---- Keywords (null / true / false) ----
(kw_null)  @constant.builtin
(kw_true)  @constant.builtin.boolean
(kw_false) @constant.builtin.boolean

; ---- String values ----
; Plain scalar after `:` — usually a string. (Numeric coercion happens
; only after `:i`/`:f`; see below.)
(object_pair
  separator: (sep_string)
  value: (scalar) @string)

; Raw string after `::`
(object_pair
  separator: (sep_raw)
  value: (scalar) @string.special)

; Typed integer / float bodies
(object_pair
  separator: (sep_int)
  value: (scalar) @number)

(object_pair
  separator: (sep_float)
  value: (scalar) @number.float)

; ---- Array items ----
(array_item
  marker: (sep_raw)
  value: (scalar) @string.special)

(array_item
  marker: (sep_int)
  value: (scalar) @number)

(array_item
  marker: (sep_float)
  value: (scalar) @number.float)

(array_item
  value: (scalar) @string)

; ---- Multi-line strings ----
(multiline_stripped) @string
(multiline_verbatim) @string
