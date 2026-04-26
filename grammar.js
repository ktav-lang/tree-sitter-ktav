/**
 * Tree-sitter grammar for Ktav (כְּתָב) — the Written Configuration Format.
 *
 * Spec: https://github.com/ktav-lang/spec/blob/main/versions/0.1/spec.md
 *
 * Ktav is line-oriented. Every line is one of:
 *   - blank
 *   - a comment (`# ...`)
 *   - a key:value pair (with markers `:`, `::`, `:i`, `:f`)
 *   - a structural opener / closer for compounds (`{`, `}`, `[`, `]`,
 *     `(`, `((`, `)`, `))`)
 *   - an array item (inside an open `[` array)
 *   - raw content of a multi-line string
 *
 * Strategy without an external scanner:
 *   - Newlines are explicit (`_newline`) and structural openers/closers
 *     are tokens that include the trailing whitespace + newline so they
 *     can NEVER be confused with a scalar starting with the same byte.
 *   - The four pair separators (`:`, `::`, `:i`, `:f`) are recognized
 *     by the lexer with longest-match precedence (`::` > `:`, `:i`/`:f`
 *     > `:`).
 *   - The value body is captured as a single line-token, with subtypes
 *     preferred via positive precedence: empty-compounds, openers,
 *     keywords, and scalar (catch-all).
 *
 * KNOWN LIMITATIONS without an external scanner:
 *   - The grammar accepts the spec's syntax but does not enforce the
 *     "mandatory whitespace after marker" rule (§ 6.10) — `key:value`
 *     parses without error. Lints / consumers can flag that case.
 *   - Multi-line string content is captured as a sequence of opaque
 *     "raw lines" up to the matching terminator. The closer-on-its-own-
 *     line rule (§ 5.6.1) is implemented at the LR(1) level; pathologic
 *     "trailing-whitespace-after-closer" cases that the spec rejects
 *     are accepted here.
 *   - Indentation is not significant (matches the spec).
 */

module.exports = grammar({
  name: 'ktav',

  extras: $ => [
    // Inline horizontal whitespace is insignificant between tokens
    // on the same line. Newlines are explicit (`_newline`).
    /[ \t]+/,
  ],

  externals: $ => [],

  conflicts: $ => [],

  word: $ => $._key_segment,

  rules: {
    source_file: $ => repeat($._line),

    // ---- Top-level lines ----
    _line: $ => choice(
      $.comment,
      $.blank_line,
      $.object_pair,
    ),

    blank_line: $ => $._newline,

    _newline: $ => /\r?\n/,

    // ---- Comment ----
    comment: $ => seq(
      '#',
      optional(/[^\r\n]*/),
      $._newline,
    ),

    // ---- Object pair ----
    object_pair: $ => seq(
      field('key', $.key),
      field('separator', choice(
        $.sep_raw,       // "::" — must be tested before ":"
        $.sep_int,       // ":i"
        $.sep_float,     // ":f"
        $.sep_string,    // ":"
      )),
      choice(
        // Empty body: separator immediately followed by newline.
        field('value', $.empty_value),
        field('value', $._value_line),
      ),
    ),

    // Tree-sitter prefers longest token match. To make sure `::` wins
    // over `:`, `::` is given higher precedence; same for `:i`/`:f`.
    sep_raw:    $ => token(prec(3, '::')),
    sep_int:    $ => token(prec(2, ':i')),
    sep_float:  $ => token(prec(2, ':f')),
    sep_string: $ => token(prec(1, ':')),

    // ---- Keys ----
    key: $ => choice(
      $._key_segment,
      $.dotted_key,
    ),

    dotted_key: $ => prec.left(seq(
      $._key_segment,
      repeat1(seq('.', $._key_segment)),
    )),

    // Key segment: any chars except whitespace, "[", "]", "{", "}",
    // ":", "#", ".".
    _key_segment: $ => /[^\s\[\]\{\}:#.\r\n]+/,

    // ---- Value line ----
    // A value line is everything from after the separator to the end
    // of the line — followed by a newline. The line may also OPEN a
    // multi-line compound (object / array / multi-line string), in
    // which case the newline is part of the opener token and the
    // compound's body follows.
    _value_line: $ => choice(
      // Compound openers (eat the newline).
      $.compound_object,
      $.compound_array,
      $.multiline_stripped,
      $.multiline_verbatim,
      // Inline empty compound forms (followed by newline).
      $.empty_object,
      $.empty_array,
      $.empty_paren,
      $.empty_double_paren,
      // Keywords (single token followed by newline).
      $.keyword,
      // Scalar — catch-all line content.
      $.scalar,
    ),

    // Empty value = separator immediately followed by newline.
    // Used in object_pair only (a plain blank line in an array is a
    // `blank_line`, not an empty array item — array items must have
    // a marker or non-blank body).
    empty_value: $ => $._newline,

    // ---- Empty inline compounds (one full line) ----
    empty_object:       $ => seq(token(prec(5, '{}')),   $._newline),
    empty_array:        $ => seq(token(prec(5, '[]')),   $._newline),
    empty_paren:        $ => seq(token(prec(5, '()')),   $._newline),
    empty_double_paren: $ => seq(token(prec(5, '(())')), $._newline),

    // ---- Multi-line compounds ----
    // Openers (`{`, `[`, `(`, `((`) are tokens that include the rest
    // of the line up to and including the newline, so they cannot be
    // confused with a scalar starting with `{` / `[` / `(`.
    _open_brace:    $ => token(prec(4, /\{[ \t]*\r?\n/)),
    _close_brace:   $ => token(prec(4, /\}[ \t]*\r?\n/)),
    _open_bracket:  $ => token(prec(4, /\[[ \t]*\r?\n/)),
    _close_bracket: $ => token(prec(4, /\][ \t]*\r?\n/)),
    _open_paren:    $ => token(prec(4, /\([ \t]*\r?\n/)),
    _close_paren:   $ => token(prec(4, /\)[ \t]*\r?\n/)),
    _open_dparen:   $ => token(prec(5, /\(\([ \t]*\r?\n/)),
    _close_dparen:  $ => token(prec(5, /\)\)[ \t]*\r?\n/)),

    compound_object: $ => seq(
      $._open_brace,
      repeat(choice($.comment, $.blank_line, $.object_pair)),
      $._close_brace,
    ),

    compound_array: $ => seq(
      $._open_bracket,
      repeat(choice($.comment, $.blank_line, $.array_item)),
      $._close_bracket,
    ),

    // ---- Array items ----
    array_item: $ => choice(
      // Marker-prefixed items
      seq(
        field('marker', $.sep_raw),
        field('value', choice($.empty_value, $.scalar)),
      ),
      seq(
        field('marker', $.sep_int),
        field('value', choice($.empty_value, $.scalar)),
      ),
      seq(
        field('marker', $.sep_float),
        field('value', choice($.empty_value, $.scalar)),
      ),
      // Plain value item — same set as object pair value.
      field('value', $._value_line),
    ),

    // ---- Multi-line strings ----
    multiline_stripped: $ => seq(
      $._open_paren,
      repeat($.multiline_content_line),
      $._close_paren,
    ),

    multiline_verbatim: $ => seq(
      $._open_dparen,
      repeat($.multiline_content_line),
      $._close_dparen,
    ),

    // A content line inside a multi-line string. Captured as one
    // token. The closer tokens (`)\n`, `))\n`) win at the LR(1)
    // boundary because they require their own line; any line whose
    // content includes more than just the terminator falls through
    // to this rule.
    multiline_content_line: $ => token(prec(-1, /[^\r\n]*\r?\n/)),

    // ---- Scalar (default value body, until end of line) ----
    // A scalar runs from the first non-whitespace, non-`#` char to
    // end of line. The token is marked as low-precedence so a single
    // `:` / `.` in *key* position lexes as the structural token; in
    // value position the parser asks for a scalar, and the lexer
    // emits the longest match starting with a value-friendly char.
    scalar: $ => seq(
      $._scalar_text,
      $._newline,
    ),

    // Scalar text: any non-whitespace, non-newline content up to end
    // of line. `#` is allowed (`color: #ff00ff` is a valid value);
    // the `#` only opens a comment when it is the first non-whitespace
    // char of a line — tree-sitter's context-aware lexer disambiguates
    // because `comment` is only valid at a line-start parse state.
    _scalar_text: $ => /[^\s\r\n][^\r\n]*/,

    // ---- Keywords ----
    // Each keyword is followed by EOL (the value-line terminator).
    keyword: $ => seq(
      choice($.kw_null, $.kw_true, $.kw_false),
      $._newline,
    ),
    kw_null:  $ => token(prec(3, 'null')),
    kw_true:  $ => token(prec(3, 'true')),
    kw_false: $ => token(prec(3, 'false')),
  },
});
