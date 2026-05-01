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
 * Strategy:
 *   - Newlines are explicit (`_newline`) and structural openers/closers
 *     are tokens that include the trailing whitespace + newline so they
 *     can NEVER be confused with a scalar starting with the same byte.
 *   - The four pair separators (`:`, `::`, `:i`, `:f`) are recognized
 *     by the lexer with longest-match precedence (`::` > `:`, `:i`/`:f`
 *     > `:`).
 *   - The mandatory-whitespace-after-marker rule (§ 6.10) is enforced
 *     by an external scanner token `_marker_ws`, which is a zero-width
 *     assertion that only succeeds when the byte right after the
 *     separator is space, tab, CR, LF, or EOF. `key:value` (no space)
 *     therefore fails to parse.
 *   - The closer-on-its-own-line rule for compounds and multi-line
 *     strings is enforced via the external scanner's `_strict_eol`
 *     token, which only matches `[ \t]*\r?\n` (or EOF) — any non-
 *     whitespace text between the closer and the line terminator is
 *     a parse error.
 *   - Multi-line string content is captured as a sequence of opaque
 *     "raw lines" up to the matching terminator.
 *   - Indentation is not significant (matches the spec).
 */

module.exports = grammar({
  name: 'ktav',

  extras: $ => [
    // Inline horizontal whitespace is insignificant between tokens
    // on the same line. Newlines are explicit (`_newline`).
    /[ \t]+/,
  ],

  externals: $ => [
    $._marker_ws,   // zero-width assertion after pair separators
    $._strict_eol,  // [ \t]*\r?\n  (or EOF) — for compound closers
  ],

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
    //
    // After the separator, the external `_marker_ws` token asserts
    // that the next byte is whitespace, CR, LF, or EOF. This enforces
    // § 6.10 (mandatory whitespace after marker): `key:value` fails.
    object_pair: $ => seq(
      field('key', $.key),
      field('separator', choice(
        $.sep_raw,       // "::" — must be tested before ":"
        $.sep_int,       // ":i"
        $.sep_float,     // ":f"
        $.sep_string,    // ":"
      )),
      $._marker_ws,
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
    empty_value: $ => $._newline,

    // ---- Empty inline compounds (one full line) ----
    empty_object:       $ => seq(token(prec(5, '{}')),   $._newline),
    empty_array:        $ => seq(token(prec(5, '[]')),   $._newline),
    empty_paren:        $ => seq(token(prec(5, '()')),   $._newline),
    empty_double_paren: $ => seq(token(prec(5, '(())')), $._newline),

    // ---- Multi-line compounds ----
    //
    // Openers are tokens that include the rest of the line up to and
    // including the newline, so they cannot be confused with a scalar
    // starting with the same byte. Closers, by contrast, are split
    // into the bracket character(s) plus the external `_strict_eol`
    // token; this lets the scanner reject pathological lines like
    // `}   trailing_text\n` (§ 5.6.1 and the cleanliness rule for
    // object/array closers).
    open_brace:    $ => token(prec(4, /\{[ \t]*\r?\n/)),
    close_brace:   $ => seq(token(prec(4, '}')),    $._strict_eol),
    open_bracket:  $ => token(prec(4, /\[[ \t]*\r?\n/)),
    close_bracket: $ => seq(token(prec(4, ']')),    $._strict_eol),
    open_paren:    $ => token(prec(4, /\([ \t]*\r?\n/)),
    close_paren:   $ => seq(token(prec(4, ')')),    $._strict_eol),
    open_dparen:   $ => token(prec(5, /\(\([ \t]*\r?\n/)),
    close_dparen:  $ => seq(token(prec(5, '))')),   $._strict_eol),

    compound_object: $ => seq(
      $.open_brace,
      repeat(choice($.comment, $.blank_line, $.object_pair)),
      $.close_brace,
    ),

    compound_array: $ => seq(
      $.open_bracket,
      repeat(choice($.comment, $.blank_line, $.array_item)),
      $.close_bracket,
    ),

    // ---- Array items ----
    //
    // Marker-prefixed items must, like pair lines, have whitespace or
    // EOL after the marker (§ 6.10).
    array_item: $ => choice(
      seq(
        field('marker', $.sep_raw),
        $._marker_ws,
        field('value', choice($.empty_value, $.scalar)),
      ),
      seq(
        field('marker', $.sep_int),
        $._marker_ws,
        field('value', choice($.empty_value, $.scalar)),
      ),
      seq(
        field('marker', $.sep_float),
        $._marker_ws,
        field('value', choice($.empty_value, $.scalar)),
      ),
      // Plain value item — same set as object pair value.
      field('value', $._value_line),
    ),

    // ---- Multi-line strings ----
    multiline_stripped: $ => seq(
      $.open_paren,
      repeat($.multiline_content_line),
      $.close_paren,
    ),

    multiline_verbatim: $ => seq(
      $.open_dparen,
      repeat($.multiline_content_line),
      $.close_dparen,
    ),

    // A content line inside a multi-line string. Captured as one
    // token. The closer tokens (`)`, `))` plus _strict_eol) win at
    // the LR(1) boundary because they require their own line; any
    // line whose content includes more than just the terminator
    // falls through to this rule.
    multiline_content_line: $ => token(prec(-1, /[^\r\n]*\r?\n/)),

    // ---- Scalar (default value body, until end of line) ----
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
    keyword: $ => seq(
      choice($.kw_null, $.kw_true, $.kw_false),
      $._newline,
    ),
    kw_null:  $ => token(prec(3, 'null')),
    kw_true:  $ => token(prec(3, 'true')),
    kw_false: $ => token(prec(3, 'false')),
  },
});
