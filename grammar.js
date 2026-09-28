/**
 * Tree-sitter grammar for Ktav (כְּתָב) — the Written Configuration Format.
 *
 * Spec: https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md
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
    //
    // Spec 0.7.0 § 3.3 freezes whitespace at 25 exact code points; this is
    // the single whitespace definition for the whole grammar — there is no
    // narrower "structural" set (§ 3.3: "There is no separate, narrower
    // 'structural' whitespace concept"). LF/CR are excluded here (they are
    // line terminators, § 3.2, handled by `_newline` and the scanner), so
    // the class below is the other 23. Every token content class in this
    // file excludes the same 23 code points at its first-byte position, so
    // a leading/trailing run is always skipped HERE (indentation, § 3.3;
    // key-segment edge trimming, § 4 `<raw-segment>`; inline-scalar edge
    // trimming, § 5.8.1) instead of being glued into a token. VT (0x0B) and
    // FF (0x0C) stay excluded from tokens even though Appendix A admits
    // them as key content: interior occurrences are preserved verbatim in
    // the key node span via the extras split (the same mechanism interior
    // spaces have always used). Never write `\s`: tree-sitter compiles it
    // to ASCII-only [\t\n\v\f\r ], which silently treats NBSP/NEL/U+3000
    // and friends as content bytes.
    /[ \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/,
  ],

  externals: $ => [
    $._marker_ws,        // zero-width assertion after pair separators
    $._strict_eol,       // [ \t]*\r?\n  (or EOF) — for compound closers
    $._eol,              // \r?\n (or EOF) — line end for scalars/keywords/inlines
    $._stripped_close,   // `)[ \t]*\r?\n` (or EOF) — only valid inside `(...)` body
    $._verbatim_close,   // `))[ \t]*\r?\n` (or EOF) — only valid inside `((...))` body
    $._content_line,     // `[^\r\n]*\r?\n` — a multi-line-string body line (NUL is content)
    $._integer_eof,      // complete integer at true EOF, without a newline
    $._float_eof,        // complete float at true EOF, without a newline
    $._top_scalar_eof,   // complete root scalar at true EOF
    $._comment_eof,      // final comment without a newline
    $._root_fallback_scalar, // first-line scalar that is not a pair candidate
    $._array_follow_eof, // final Array item may contain a colon
  ],

  conflicts: $ => [],

  // `word` must resolve to ONE token shape for tree-sitter's keyword-
  // extraction. `_bare_key_segment` (plain identifier-like key bytes)
  // fits that; `quoted_key_segment` is delimited and can't collide
  // with the bareword keyword literals (`null`/`true`/`false`) this
  // mechanism exists for, so it is deliberately excluded.
  word: $ => $._bare_key_segment,

  rules: {
    // Spec 0.7.0 § 3.1: a conforming parser MUST skip exactly one leading
    // U+FEFF byte-order mark if it is the very first code point of the
    // document. This is a guaranteed grammar property, not error-recovery
    // luck: `optional()` means at most one BOM is ever consumed, and only
    // at offset 0 (the very first token `source_file` attempts). A second
    // BOM, or one anywhere else, is ordinary content (§ 3.1) — already
    // handled correctly since U+FEFF is not excluded from any key/scalar
    // content class.
    // The first content line fixes the root kind; aliases preserve the CST.
    source_file: $ => seq(
      optional(/\uFEFF/),
      repeat($._trivia_line),
      optional(choice(
        seq($.object_pair, repeat(choice($._trivia_line, $.object_pair))),
        seq(alias($._root_array_first_item, $.top_array_item),
            repeat(choice($._trivia_line, $.top_array_item))),
        seq(alias($._root_single_item, $.top_array_item), repeat($._trivia_line)),
      )),
    ),

    // ---- Top-level lines ----
    _trivia_line: $ => choice($.comment, $.blank_line),

    _root_single_item: $ => field('value', choice(
      $.compound_object, $.compound_array, $.empty_object, $.empty_array,
      $.inline_object, $.inline_array,
    )),

    _root_array_first_item: $ => choice(
      seq(field('marker', $.sep_raw), choice(
        field('value', $.empty_value),
        seq($._marker_ws, field('value', $.raw_scalar)),
      )),
      field('value', choice(
        $.multiline_stripped, $.multiline_verbatim,
        $.empty_paren, $.empty_double_paren,
        $.keyword, $.integer, $.float, $.top_scalar,
      )),
      field('value', alias($._root_fallback_scalar, $.top_scalar)),
    ),

    blank_line: $ => $._newline,

    // Spec 0.7.0 § 3.2: a line terminator is LF, CR, or CRLF — all three
    // MUST be treated as equivalent. `\r?\n` (LF or CRLF only) rejected a
    // lone CR; every line-terminator-matching pattern in this grammar
    // uses the same `\r\n|\r|\n` alternation.
    _newline: $ => /\r\n|\r|\n/,

    // ---- Comment ----
    //
    // In spec 0.5.0 a comment starts with `##` (two hashes). A single
    // `#` is ordinary content. The token captures the whole line
    // including the trailing newline to beat `_top_scalar_text` at the
    // lexer's longest-match step.
    comment: $ => choice(
      token(prec(1, /##[^\r\n]*(\r\n|\r|\n)/)),
      $._comment_eof,
    ),

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
        choice(
          field('value', $.empty_value),
          seq($._marker_ws, field('value', $.raw_scalar)),
        ),
      ),
      // After `:` the body goes through the full § 5.2 dispatch.
      seq(
        field('key', $.key),
        field('separator', $.sep_string),
        choice(
          field('value', $.empty_value),
          seq($._marker_ws, field('value', $._value_line)),
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
      // A key that is exactly one quoted segment, undotted (§ 5.3.3):
      // `"port": 1`. Named (not hidden) so highlighting/queries can
      // tell a quoted key apart from a bare one.
      $.quoted_key_segment,
    ),

    // A key may contain internal whitespace (spec 0.5.0 § 4): the run of
    // space-separated words up to the separator is one key
    // (`multi word key: value`). The inter-word spaces are `extras`,
    // so the `key` node still spans the whole text with no named children
    // (renders as `(key)`, same as a single-word key).
    //
    // Per § 5.3.3's positional rule, the whole glued-and-spaced run is
    // ONE segment — the rule looks only at the first code point of the
    // segment's raw text, i.e. the first byte of the FIRST word. So only
    // that first word excludes a leading quote (`_bare_key_segment`);
    // every later word is a continuation of the same bare segment and a
    // leading quote there is ordinary content (`_bare_key_segment_cont`,
    // identical to `_bare_key_segment` but without the first-byte quote
    // exclusion). `foo "bar": 1` is thus the single bare key `foo "bar"`
    // (quote is mid-segment). `"a" "b": 1` is unaffected: its first word
    // starts with a quote, so `_bare_key_segment` cannot lex it at all —
    // the FIRST word alone forces the `quoted_key_segment` alternative
    // of `key`, and a second, space-separated quoted/bare word after a
    // complete quoted key has nothing left to attach to, producing the
    // `InvalidKey` `ERROR` (see `quoted_key_segment` below).
    _spaced_key: $ => prec.left(seq(
      $._bare_key_segment,
      repeat($._bare_key_segment_cont),
    )),

    // Spec 0.7.0 § 5.3.3: each dot-separated piece is independently
    // bare or quoted — the positional rule is "re-applied fresh at the
    // start of EVERY segment", including the one right after a dot
    // (`a."b.c".d: 1`).
    dotted_key: $ => prec.left(seq(
      $._key_segment,
      repeat1(seq('.', $._key_segment)),
    )),

    _key_segment: $ => choice($.quoted_key_segment, $._bare_key_segment),

    // Bare key segment (spec 0.6.0 § 4, positional rule added in
    // 0.7.0 § 5.3.3): a non-empty run of plain key bytes and/or escape
    // sequences. Plain key bytes exclude whitespace, the bracket/
    // paren/brace bytes, `:`, `,`, the dotted-path separator `.`, and
    // the escape lead `\`. Raw `#` is an ordinary key byte (spec
    // 0.7.0 § 3.4/§ 4 `<key-char>`); only a trimmed line whose first
    // non-whitespace code points are `##` is a comment, and the
    // whole-line `comment` token wins that competition by longest match.
    // Those structural bytes — including `\.` and `\:` — can appear
    // inside a key when escaped. Spec 0.7.0 § 3.7 has fourteen escape
    // forms: the ten from 0.6.0 plus `\"`, `\'`, `` \` ``, and `\uXXXX`
    // (exactly four case-insensitive hex digits, never partially
    // consumed — a malformed `\u` form simply fails every alternative
    // below, which is what makes it a parse error).
    //
    // The FIRST byte additionally excludes `"`, `'`, `` ` `` — those
    // open a `quoted_key_segment` instead (§ 5.3.3's positional rule)
    // — while a quote at any OTHER position stays an ordinary key byte
    // (`port": 1`, `don't: 1`, unaffected by quoting).
    //
    // The dotted-path separator is an UNescaped `.`; an unescaped `\`
    // is always the start of an escape sequence (fourteen forms).
    _bare_key_segment: $ => token(seq(
      choice(
        /[^\x00-\x08\x0E-\x1F \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\[\]\{\}\(\):,.\r\n\\"'`]/,
        /\\[\\,\}\]\{\[nr.:"'`]/,
        /\\u[0-9a-fA-F]{4}/,
      ),
      repeat(choice(
        /[^\x00-\x08\x0E-\x1F \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\[\]\{\}\(\):,.\r\n\\]/,
        /\\[\\,\}\]\{\[nr.:"'`]/,
        /\\u[0-9a-fA-F]{4}/,
      )),
    )),

    // Continuation word of a spaced key (§ 5.3.3), used only in
    // `_spaced_key`'s repetition tail — i.e. every word AFTER the first
    // one. Identical to `_bare_key_segment` except a leading quote is
    // NOT excluded: the positional rule only looks at the first code
    // point of the whole segment (the first byte of the FIRST word), so
    // a quote starting a later glued word is ordinary content, same as
    // a quote at any non-initial position already is. This is exactly
    // `_bare_key_segment`'s own non-first-byte class, applied uniformly
    // (no separate first-byte restriction).
    //
    // This never conflicts with `quoted_key_segment` at parse time:
    // `quoted_key_segment` is only reachable as the very first token of
    // a `key` or right after a dotted-path `.`, while
    // `_bare_key_segment_cont` is only reachable inside `_spaced_key`'s
    // tail (after its leading `_bare_key_segment`) — two disjoint LR
    // states, so tree-sitter never has to choose between them for the
    // same input position, even though both can start with a quote.
    _bare_key_segment_cont: $ => token(repeat1(choice(
      /[^\x00-\x08\x0E-\x1F \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\[\]\{\}\(\):,.\r\n\\]/,
      /\\[\\,\}\]\{\[nr.:"'`]/,
      /\\u[0-9a-fA-F]{4}/,
    ))),

    // Quoted key segment (spec 0.7.0 § 5.3.3, § 4): opened by `"`, `'`,
    // or `` ` ``, running to the first UNescaped occurrence of that
    // SAME character. One token per delimiter — `.` `:` `,` `{` `}`
    // `[` `]` and the two OTHER quote characters are all ordinary
    // content inside it (never split/terminate), and content is never
    // trimmed. Because the whole segment is a single token, this
    // opacity falls out of tokenization — no external scanner needed.
    // Excluded from content: ASCII control bytes other than tab/VT/FF,
    // DEL, the escape lead `\`, and the segment's own delimiter (§ 4's
    // `<dq-char>`/`<sq-char>`/`<bt-char>`).
    //
    // Escapes recognised here: the full fourteen-form table (spec 0.7.0
    // § 3.7 / § 5.3.3 — "there is no separate, smaller table for quoted
    // content"), including ALL THREE quote-escapes uniformly regardless
    // of delimiter (only the segment's OWN raw, unescaped delimiter is
    // structural; the escaped spelling of any of the three always works,
    // and the other two raw quote characters need no escape at all) and
    // `\uXXXX`.
    quoted_key_segment: $ => token(choice(
      seq('"', repeat(choice(
        /[^\x00-\x08\x0A\x0D\x0E-\x1F\x7F\\"]/,
        /\\[\\,\}\]\{\[nr.:"'`]/,
        /\\u[0-9a-fA-F]{4}/,
      )), '"'),
      seq("'", repeat(choice(
        /[^\x00-\x08\x0A\x0D\x0E-\x1F\x7F\\']/,
        /\\[\\,\}\]\{\[nr.:"'`]/,
        /\\u[0-9a-fA-F]{4}/,
      )), "'"),
      seq('`', repeat(choice(
        /[^\x00-\x08\x0A\x0D\x0E-\x1F\x7F\\`]/,
        /\\[\\,\}\]\{\[nr.:"'`]/,
        /\\u[0-9a-fA-F]{4}/,
      )), '`'),
    )),

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

    // Empty value = separator followed by a line end or true EOF.
    empty_value: $ => $._eol,

    // ---- Empty inline compounds (one full line) ----
    empty_object:       $ => seq(token(prec(5, '{}')),   $._eol),
    empty_array:        $ => seq(token(prec(5, '[]')),   $._eol),
    empty_paren:        $ => seq(token(prec(5, '()')),   $._eol),
    empty_double_paren: $ => seq(token(prec(5, '(())')), $._eol),

    // ---- Multi-line compounds ----
    open_brace:    $ => token(prec(4, /\{[ \t]*(\r\n|\r|\n)/)),
    close_brace:   $ => seq(token(prec(4, '}')),    $._strict_eol),
    open_bracket:  $ => token(prec(4, /\[[ \t]*(\r\n|\r|\n)/)),
    close_bracket: $ => seq(token(prec(4, ']')),    $._strict_eol),
    open_paren:    $ => token(prec(4, /\([ \t]*(\r\n|\r|\n)/)),
    open_dparen:   $ => token(prec(5, /\(\([ \t]*(\r\n|\r|\n)/)),
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
      $._eol,
    ),

    inline_array: $ => seq(
      '[',
      optional($._inline_item_list),
      ']',
      $._eol,
    ),

    _inline_pair_list: $ => seq(
      $.inline_pair,
      repeat(seq(',', $.inline_pair)),
      optional(','),
    ),

    // The value is optional: `{x:, y: 1}` and `{empty:}` are valid —
    // a separator immediately followed by `,` or `}` is an empty value
    // (spec 0.5.0 § 5.8).
    // Spec 0.7.0 § 4: the two separators have DIFFERENT value branches.
    // After `::` the body is the dedicated <inline-raw-scalar> — literal
    // data to the first unescaped `,` / `}` / `]`, escapes processed, an
    // initial `{`/`[` literal — "This production does NOT dispatch through
    // <inline-value> or <inline-scalar>" (spec.md:588-596); "the `::`
    // marker therefore cannot open or recurse into a compound"
    // (§ 5.8.5, spec.md:1573-1577). After `:` the value goes through the
    // full <inline-value> dispatch (§ 5.8.5: "The dispatch rules below
    // apply only after a plain `:` separator"). Empty value after either
    // separator is the explicit empty String (§ 5.8.2). Inline pairs, unlike
    // multi-line pairs, require no whitespace after the separator (§ 4,
    // spec.md:620-624).
    inline_pair: $ => choice(
      seq(
        field('key', $.key),
        field('separator', $.sep_raw),
        optional(field('value', $.inline_raw_scalar)),
      ),
      seq(
        field('key', $.key),
        field('separator', $.sep_string),
        optional(field('value', $.inline_value)),
      ),
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

    // Escape sequences recognised inside inline scalars (spec 0.7.0 § 3.7:
    // fourteen forms). `\.` and `\:` yield literal `.` and `:` — inside a
    // value these are redundant (already literal bytes there) but remain
    // accepted for symmetry with key parsing. `\"`, `\'`, `` \` `` yield
    // their literal quote byte (§ 5.3.3: recognised in every escape-aware
    // context alike, values included, even though a raw quote in a value
    // is never structural). `\uXXXX` names a code point by exactly four
    // case-insensitive hex digits; a malformed form (fewer than four
    // digits) matches no alternative here and is therefore never
    // partially consumed.
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
      '\\"',
      '\\\'',
      '\\`',
      /\\u[0-9a-fA-F]{4}/,
    )),

    // Leading chunk of a scalar: first byte excludes whitespace and the
    // openers `{`/`[` (so a value starting with an opener is a nested
    // compound), plus the usual `\` `,` `}` `]` / CR / LF. Subsequent
    // bytes allow `{`/`[` as literal content.
    // Raw inline scalar body (spec 0.7.0 § 4 <inline-raw-scalar>,
    // § 5.8.5): identical to `inline_scalar` except the FIRST byte may be
    // `{` or `[` — literal data, because `::` never dispatches to a
    // compound. Terminators are the same unescaped `,` / `}` / `]`
    // (line-end inside an inline compound is the § 6.11 error).
    inline_raw_scalar: $ => seq(
      choice($.escape_sequence, $._inline_raw_scalar_head),
      repeat(choice($.escape_sequence, $._inline_scalar_text)),
    ),
    _inline_raw_scalar_head: $ => token(/[^ \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\\,\}\]\r\n][^\\,\}\]\r\n]*/),

    _inline_scalar_head: $ => token(/[^ \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\\,\{\[\}\]\r\n][^\\,\}\]\r\n]*/),

    // Continuation text after the head (or after an escape): any byte
    // except `\`, `,`, the closers `}` `]`, and CR / LF. Open delimiters
    // `{`/`[` are allowed here as literal content.
    _inline_scalar_text: $ => token(/[^\\,\}\]\r\n]+/),

    // ---- Array items ----
    array_item: $ => choice(
      seq(
        field('marker', $.sep_raw),
        choice(
          field('value', $.empty_value),
          seq($._marker_ws, field('value', $.raw_scalar)),
        ),
      ),
      // Plain value item — same set as object pair value.
      field('value', $._value_line),
    ),

    // Top-level array item (§ 5.0.1).
    top_array_item: $ => choice(
      seq(
        field('marker', $.sep_raw),
        choice(
          field('value', $.empty_value),
          seq($._marker_ws, field('value', $.raw_scalar)),
        ),
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
      field('value', alias($._array_follow_text, $.top_scalar)),
      field('value', alias($._array_follow_eof, $.top_scalar)),
    ),

    _array_follow_text: $ => token(/[^ \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000:\{\[\}\]\(\r\n][^\r\n]*(\r\n|\r|\n)/),

    // `top_scalar` — bare-scalar at the document root. Forbids `:` so
    // that pair-shaped lines always parse as `object_pair`.
    top_scalar: $ => choice($._top_scalar_text, $._top_scalar_eof),
    _top_scalar_text: $ => token(/[^ \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000:\{\[\}\]\(\r\n][^:\r\n]*(\r\n|\r|\n)/),

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

    // External so it can distinguish a literal embedded NUL byte from a
    // true end-of-input via `lexer->eof()` — the regex this replaced,
    // `/[^\r\n]*(\r\n|\r|\n)/`, could not: tree-sitter's compiled
    // character-class matcher treats `lookahead == 0` as end-of-input
    // unconditionally, so it silently stopped at any embedded NUL. See
    // task #243 and tests/eof_and_nul.rs.
    multiline_content_line: $ => $._content_line,

    // ---- Scalar (default value body, until end of line) ----
    scalar: $ => seq(
      $._scalar_text,
      $._eol,
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
      $._eol,
    ),
    _raw_scalar_text: $ => /[^ \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\r\n][^\r\n]*/,

    // Scalar text: any non-whitespace, non-newline content up to end
    // of line. Both `#` and `##` are allowed as content bytes in 0.5.0.
    // Lines starting with `{` or `[` are always handled by structural
    // rules (compound_object, compound_array, empty_object, empty_array,
    // inline_object, inline_array), so `_scalar_text` explicitly excludes
    // those opening bytes at position 0 to avoid the greedy-token
    // ambiguity. Lines starting with `(` are handled by multiline or
    // empty-paren rules likewise.
    // `(` / `((` followed by text is a scalar, not a multiline opener:
    // the openers require `(` (ws) &line-end (§ 4 <value-start>), and
    // § 5.8.5 (spec.md:1579-1588) makes leading parens ordinary content.
    // The `)` exclusion keeps `()`/`(())` unambiguous with the
    // empty-paren tokens (higher lexical precedence, same length).
    _scalar_text: $ => choice(
      /[^ \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\{\[\(\r\n][^\r\n]*/,
      /\([^ \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\r\n\)][^\r\n]*/,
    ),

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
    // In 0.8, redundant-leading-zero decimals are strings (§ 5.2).
    integer: $ => choice(
      token(prec(2, /[+-]?(0x[0-9a-fA-F]([_]?[0-9a-fA-F])*|0o[0-7]([_]?[0-7])*|0b[01]([_]?[01])*|0|[1-9]([_]?[0-9])*)[ \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]*(\r\n|\r|\n)/)),
      $._integer_eof,
    ),

    // Only the float's integer part is subject to the 0.8 zero rule.
    float: $ => choice(
      token(prec(3, /([+-]?(0|[1-9]([_]?[0-9])*)\.[0-9]([_]?[0-9])*([eE][+-]?[0-9]([_]?[0-9])*)?|[+-]?(0|[1-9]([_]?[0-9])*)[eE][+-]?[0-9]([_]?[0-9])*)[ \t\x0B\x0C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]*(\r\n|\r|\n)/)),
      $._float_eof,
    ),

    // ---- Keywords ----
    keyword: $ => seq(
      choice($.kw_null, $.kw_true, $.kw_false),
      $._eol,
    ),
    kw_null:  $ => token(prec(3, 'null')),
    kw_true:  $ => token(prec(3, 'true')),
    kw_false: $ => token(prec(3, 'false')),
  },
});
