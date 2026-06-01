/**
 * Tree-sitter grammar for Ktav (כְּתָב) — the Written Configuration Format.
 *
 * Spec: https://github.com/ktav-lang/spec/blob/main/versions/0.6/spec.md
 *
 * Ktav is line-oriented. Every line is one of:
 *   - blank
 *   - a comment (`## ...`)  ← NOTE: double-hash in 0.5.0; single `#` is content
 *   - a key:value pair (with markers `:` or `::`)
 *   - a structural opener / closer for compounds (`{`, `}`, `[`, `]`,
 *     `(`, `((`, `)`, `))`)
 *   - an array item (inside an open `[` array, or at the top level)
 *   - raw content of a multi-line string
 *
 * Changes from 0.5.0 to 0.6.0:
 *   - Keys now process escape sequences (§ 3.7). The escape table grows
 *     to 10 entries by adding `\.` (literal dot — does NOT split the
 *     dotted path) and `\:` (literal colon — does NOT act as the
 *     key/value separator). `\` becomes the escape lead in keys.
 *     Breaking: a raw `\` in a key now requires `\\`.
 *
 * Changes from 0.3.0 (spec 0.1.1) to 0.5.0:
 *   - Comment marker changed from `#` to `##`. Single `#` is now a
 *     content byte (allowed in keys and scalar values).
 *   - Typed markers `:i` and `:f` removed. Only `:` and `::` remain.
 *   - Inline compounds: `{key: value, ...}` and `[v1, v2, ...]` are
 *     now valid as pair values or array items (inline_object /
 *     inline_array rules).
 *   - Number literals: hex (`0x`), octal (`0o`), binary (`0b`), decimal
 *     with underscore separators, and floats with `.` or exponent.
 *     These are captured as distinct node kinds for highlighting.
 *   - Escape sequences inside inline scalars: `\\`, `\,`, `\}`, `\]`,
 *     `\{`, `\[`, `\n`, `\r`.
 *
 * Strategy:
 *   - Newlines are explicit (`_newline`) and structural openers/closers
 *     are tokens that include the trailing whitespace + newline so they
 *     can NEVER be confused with a scalar starting with the same byte.
 *   - The two pair separators (`:`, `::`) are recognized by the lexer
 *     with longest-match precedence (`::` > `:`).
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
 *   - Inline compound values are fully parsed; escape sequences inside
 *     inline scalars are captured as `escape_sequence` nodes.
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
    $._marker_ws,        // zero-width assertion after pair separators
    $._strict_eol,       // [ \t]*\r?\n  (or EOF) — for compound closers
    $._stripped_close,   // `)[ \t]*\r?\n` (or EOF) — only valid inside `(...)` body
    $._verbatim_close,   // `))[ \t]*\r?\n` (or EOF) — only valid inside `((...))` body
  ],

  conflicts: $ => [],

  word: $ => $._key_segment,

  rules: {
    // The top-level document is a sequence of lines. Per spec § 5.0.1
    // the root may be either an Object or an Array. Tree-sitter accepts
    // both kinds of line anywhere; semantic dispatch is left to the
    // reference parser.
    source_file: $ => repeat($._line),

    // ---- Top-level lines ----
    _line: $ => choice(
      $.comment,
      $.blank_line,
      $.object_pair,
      $.top_array_item,
    ),

    blank_line: $ => $._newline,

    _newline: $ => /\r?\n/,

    // ---- Comment ----
    //
    // In spec 0.5.0 a comment starts with `##` (two hashes). A single
    // `#` is ordinary content. The token captures the whole line
    // including the trailing newline to beat `_top_scalar_text` at the
    // lexer's longest-match step.
    comment: $ => token(prec(1, /##[^\r\n]*\r?\n/)),

    // ---- Object pair ----
    //
    // After the separator, the external `_marker_ws` token asserts
    // that the next byte is whitespace, CR, LF, or EOF (§ 6.10).
    object_pair: $ => choice(
      // After `::` the body is a literal scalar (NOT dispatched through
      // compound-opener / multi-line dispatch). `raw_scalar` accepts any
      // line content including `(`, `{`, `[`-starting text.
      seq(
        field('key', $.key),
        field('separator', $.sep_raw),
        $._marker_ws,
        field('value', choice($.empty_value, $.raw_scalar)),
      ),
      // After `:` the body goes through the full § 5.2 dispatch.
      seq(
        field('key', $.key),
        field('separator', $.sep_string),
        $._marker_ws,
        choice(
          field('value', $.empty_value),
          field('value', $._value_line),
        ),
      ),
    ),

    // `::` wins over `:` via higher precedence.
    sep_raw:    $ => token(prec(3, '::')),
    sep_string: $ => token(prec(1, ':')),

    // ---- Keys ----
    key: $ => choice(
      $._spaced_key,
      $.dotted_key,
    ),

    // A key may contain internal whitespace (spec 0.5.0 § 4): the run of
    // space-separated segments up to the separator is one key
    // (`multi word key: value`). The inter-segment spaces are `extras`,
    // so the `key` node still spans the whole text with no named children
    // (renders as `(key)`, same as a single-segment key).
    _spaced_key: $ => prec.left(repeat1($._key_segment)),

    dotted_key: $ => prec.left(seq(
      $._key_segment,
      repeat1(seq('.', $._key_segment)),
    )),

    // Key segment (spec 0.6.0 § 4): a non-empty run of plain key bytes
    // and/or escape sequences. Plain key bytes exclude whitespace, the
    // bracket/paren/brace bytes, `:`, `,`, the dotted-path separator `.`,
    // `#` (reserved for comment marker `##`), and the escape lead `\`.
    // Those structural bytes — including `\.` and `\:` — can now appear
    // inside a key when escaped (§ 3.7, expanded in 0.6.0 to include
    // `\.` and `\:`).
    //
    // The dotted-path separator is an UNescaped `.`; an unescaped `\`
    // is always the start of an escape sequence (10 forms in 0.6.0).
    _key_segment: $ => /([^\s\[\]\{\}\(\):#,.\r\n\\]|\\[\\,\}\]\{\[nr.:])+/,

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
      // Inline compounds (new in 0.5.0).
      $.inline_object,
      $.inline_array,
      // Keywords (single token followed by newline).
      $.keyword,
      // Number literals (distinct nodes for highlighting).
      $.integer,
      $.float,
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
    open_brace:    $ => token(prec(4, /\{[ \t]*\r?\n/)),
    close_brace:   $ => seq(token(prec(4, '}')),    $._strict_eol),
    open_bracket:  $ => token(prec(4, /\[[ \t]*\r?\n/)),
    close_bracket: $ => seq(token(prec(4, ']')),    $._strict_eol),
    open_paren:    $ => token(prec(4, /\([ \t]*\r?\n/)),
    open_dparen:   $ => token(prec(5, /\(\([ \t]*\r?\n/)),
    close_paren:   $ => $._stripped_close,
    close_dparen:  $ => $._verbatim_close,

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

    // ---- Inline compounds (new in spec 0.5.0) ----
    //
    // `{key: value, key2: value2}` and `[v1, v2, v3]` are valid as a
    // value on the right-hand side of a pair or as an array item.
    // Trailing comma is allowed. Nesting is supported.
    //
    // These are followed by a newline (they consume the rest of the line).
    inline_object: $ => seq(
      '{',
      optional($._inline_pair_list),
      '}',
      $._newline,
    ),

    inline_array: $ => seq(
      '[',
      optional($._inline_item_list),
      ']',
      $._newline,
    ),

    _inline_pair_list: $ => seq(
      $.inline_pair,
      repeat(seq(',', $.inline_pair)),
      optional(','),
    ),

    // The value is optional: `{x:, y: 1}` and `{empty:}` are valid —
    // a separator immediately followed by `,` or `}` is an empty value
    // (spec 0.5.0 § 5.8).
    inline_pair: $ => seq(
      field('key', $.key),
      field('separator', choice($.sep_raw, $.sep_string)),
      optional(field('value', $.inline_value)),
    ),

    _inline_item_list: $ => seq(
      $.inline_value,
      repeat(seq(',', $.inline_value)),
      optional(','),
    ),

    // An inline value is either a nested inline compound, or an inline
    // scalar (which may contain escape sequences).
    inline_value: $ => choice(
      $.nested_inline_object,
      $.nested_inline_array,
      $.inline_scalar,
    ),

    nested_inline_object: $ => seq(
      '{',
      optional($._inline_pair_list),
      '}',
    ),

    nested_inline_array: $ => seq(
      '[',
      optional($._inline_item_list),
      ']',
    ),

    // An inline scalar is terminated by an unescaped `,`, `}`, or `]`.
    // It may contain escape sequences (§ 3.7).
    //
    // The first chunk must NOT begin with `{` or `[`: a value position
    // that opens with `{`/`[` is a nested compound, not a scalar. After
    // the first character those bytes are ordinary literal content
    // (`hello{world`, `mid[bracket`). This head/rest split keeps
    // `nested_inline_*` vs `inline_scalar` unambiguous without sacrificing
    // mid-value literal braces (§ 5.8).
    inline_scalar: $ => seq(
      choice($.escape_sequence, $._inline_scalar_head),
      repeat(choice($.escape_sequence, $._inline_scalar_text)),
    ),

    // Escape sequences recognised inside inline scalars (§ 3.7).
    // In 0.6.0 the table grows to 10 forms by adding `\.` and `\:` —
    // they yield literal `.` and `:` respectively. Inside a value these
    // are redundant (a value's `.`/`:` is already a literal byte) but
    // remain accepted for symmetry with key parsing.
    escape_sequence: $ => token(choice(
      '\\\\',
      '\\,',
      '\\}',
      '\\]',
      '\\{',
      '\\[',
      '\\n',
      '\\r',
      '\\.',
      '\\:',
    )),

    // Leading chunk of a scalar: first byte excludes whitespace and the
    // openers `{`/`[` (so a value starting with an opener is a nested
    // compound), plus the usual `\` `,` `}` `]` / CR / LF. Subsequent
    // bytes allow `{`/`[` as literal content.
    _inline_scalar_head: $ => token(/[^\s\\,\{\[\}\]\r\n][^\\,\}\]\r\n]*/),

    // Continuation text after the head (or after an escape): any byte
    // except `\`, `,`, the closers `}` `]`, and CR / LF. Open delimiters
    // `{`/`[` are allowed here as literal content.
    _inline_scalar_text: $ => token(/[^\\,\}\]\r\n]+/),

    // ---- Array items ----
    array_item: $ => choice(
      seq(
        field('marker', $.sep_raw),
        $._marker_ws,
        field('value', choice($.empty_value, $.raw_scalar)),
      ),
      // Plain value item — same set as object pair value.
      field('value', $._value_line),
    ),

    // Top-level array item (§ 5.0.1).
    top_array_item: $ => choice(
      seq(
        field('marker', $.sep_raw),
        $._marker_ws,
        field('value', choice($.empty_value, $.raw_scalar)),
      ),
      field('value', $.compound_object),
      field('value', $.compound_array),
      field('value', $.multiline_stripped),
      field('value', $.multiline_verbatim),
      field('value', $.empty_object),
      field('value', $.empty_array),
      field('value', $.empty_paren),
      field('value', $.empty_double_paren),
      field('value', $.inline_object),
      field('value', $.inline_array),
      field('value', $.keyword),
      field('value', $.integer),
      field('value', $.float),
      field('value', $.top_scalar),
    ),

    // `top_scalar` — bare-scalar at the document root. Forbids `:` so
    // that pair-shaped lines always parse as `object_pair`.
    top_scalar: $ => $._top_scalar_text,
    _top_scalar_text: $ => token(/[^\s:\{\[\(\r\n][^:\r\n]*\r?\n/),

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

    multiline_content_line: $ => token(prec(-1, /[^\r\n]*\r?\n/)),

    // ---- Scalar (default value body, until end of line) ----
    scalar: $ => seq(
      $._scalar_text,
      $._newline,
    ),

    // `raw_scalar` is used exclusively after `::` (raw marker). It accepts
    // any non-empty line content, including `(`, `{`, `[`-starting text.
    // Per spec § 5.2: after `::` the body is NEVER dispatched as a
    // compound opener or multi-line string opener — it is always a literal
    // String value. This is a separate rule (not `scalar`) because
    // `scalar`'s underlying `_scalar_text` deliberately excludes those
    // opening bytes to avoid lexer ambiguity in the non-raw value context.
    raw_scalar: $ => seq(
      $._raw_scalar_text,
      $._newline,
    ),
    _raw_scalar_text: $ => /[^\s\r\n][^\r\n]*/,

    // Scalar text: any non-whitespace, non-newline content up to end
    // of line. Both `#` and `##` are allowed as content bytes in 0.5.0.
    // Lines starting with `{` or `[` are always handled by structural
    // rules (compound_object, compound_array, empty_object, empty_array,
    // inline_object, inline_array), so `_scalar_text` explicitly excludes
    // those opening bytes at position 0 to avoid the greedy-token
    // ambiguity. Lines starting with `(` are handled by multiline or
    // empty-paren rules likewise.
    _scalar_text: $ => /[^\s\{\[\(\r\n][^\r\n]*/,

    // ---- Number literals ----
    //
    // Captured as distinct node kinds so syntax highlighters can colour
    // them differently from plain strings.
    //
    // IMPORTANT: These are whole-line tokens (pattern + optional
    // horizontal whitespace + newline). Using a whole-line token (like
    // `comment` and `_top_scalar_text`) avoids the ambiguity where the
    // partial integer token `1` wins over the scalar token `1:2:3` via
    // prec — with a whole-line token the match for `1:2:3\n` is length
    // 5 for scalar and no match for integer (`:` breaks the pattern),
    // so scalar correctly wins on non-numeric lines.
    //
    // Float must be tested before integer because the float pattern
    // (decimal point form) is a strict superset of the integer pattern
    // prefix. Float is given prec(3) so it beats integer on `1.5\n`.
    //
    // Integer forms (§ 3.6): hex, octal, binary, decimal with underscores.
    integer: $ => token(prec(2,
      /[+-]?(0x[0-9a-fA-F]([_]?[0-9a-fA-F])*|0o[0-7]([_]?[0-7])*|0b[01]([_]?[01])*|[0-9]([_]?[0-9])*)[ \t]*\r?\n/
    )),

    // Float forms (§ 3.6): decimal-point form or exponent-only form.
    float: $ => token(prec(3,
      /([+-]?[0-9]([_]?[0-9])*\.[0-9]([_]?[0-9])*([eE][+-]?[0-9]([_]?[0-9])*)?|[+-]?[0-9]([_]?[0-9])*[eE][+-]?[0-9]([_]?[0-9])*)[ \t]*\r?\n/
    )),

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
