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
    $._marker_ws,        // zero-width assertion after pair separators
    $._strict_eol,       // [ \t]*\r?\n  (or EOF) — for compound closers
    $._stripped_close,   // `)[ \t]*\r?\n` (or EOF) — only valid inside `(...)` body
    $._verbatim_close,   // `))[ \t]*\r?\n` (or EOF) — only valid inside `((...))` body
  ],

  conflicts: $ => [],

  word: $ => $._key_segment,

  rules: {
    // The top-level document is a sequence of lines. Per spec § 5.0.1
    // (added in spec 0.1.1) the root may be either an Object (the
    // historical default — every content line is a pair) or an Array
    // (every content line is an array item). Tree-sitter is a generic
    // parser of trees: rather than encode the spec's "first content
    // line decides" rule structurally, we accept either kind of line
    // anywhere at the top level. The reference parser performs the
    // semantic § 5.0.1 dispatch and rejects mixed roots; the grammar's
    // job here is only to produce a clean syntax tree for both shapes
    // (and for editors / LSPs) without spurious ERROR nodes on bare
    // top-level scalars or `:i`/`:f`/`::` lines.
    source_file: $ => repeat($._line),

    // ---- Top-level lines ----
    //
    // `top_array_item` covers the top-level Array case (§ 5.0.1): a
    // bare scalar, a typed-marker item (`:: …`, `:i …`, `:f …`), a
    // lone `{` / `[` opener, or a `(` / `((` multi-line opener. It
    // is structurally identical to `array_item` (used inside `[ ]`)
    // but is kept as a distinct rule so we can apply a lexer-level
    // disambiguation: a line that classifies as a pair (§ 5.3) must
    // remain a pair at the top level (spec § 5.0.1 step 2), so
    // `top_array_item`'s plain bare-scalar branch is given lower
    // precedence than `object_pair` via `prec.dynamic`.
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
    // Captured as a single whole-line token so it is the
    // unambiguous longest match at line start when the line
    // begins with `#`. Without this, `_top_scalar_text` (also a
    // whole-line token) would tie or beat a structurally-defined
    // comment that's split into `'#'` + tail + newline pieces.
    comment: $ => token(prec(1, /#[^\r\n]*\r?\n/)),

    // ---- Object pair ----
    //
    // After the separator, the external `_marker_ws` token asserts
    // that the next byte is whitespace, CR, LF, or EOF. This enforces
    // § 6.10 (mandatory whitespace after marker): `key:value` fails.
    object_pair: $ => choice(
      // After `::`, `:i`, `:f` the body is a literal/typed scalar — § 5.2:
      // it is NOT dispatched through compound-opener / multi-line dispatch.
      // Only `empty_value` (immediate newline) or `scalar` is allowed.
      seq(
        field('key', $.key),
        field('separator', choice($.sep_raw, $.sep_int, $.sep_float)),
        $._marker_ws,
        field('value', choice($.empty_value, $.scalar)),
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
    open_dparen:   $ => token(prec(5, /\(\([ \t]*\r?\n/)),
    // close_paren / close_dparen are emitted by the external scanner as
    // `_stripped_close` / `_verbatim_close`. They are context-sensitive:
    // inside `(...)` only `)` closes (a `))` line is content); inside
    // `((...))` only `))` closes (a single `)` line is content). The
    // scanner consults `valid_symbols` to decide which form to attempt.
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

    // Top-level array item (§ 5.0.1, added in spec 0.1.1).
    //
    // Structurally a sibling of `array_item` (used inside `[ ]`),
    // but with two differences that realise spec § 5.0.1 step 2:
    //
    // * The plain bare-scalar branch uses `_top_scalar_text`, a
    //   token that disallows `:` anywhere in the line. This makes
    //   any line containing a `:` (i.e. any pair-shaped line)
    //   parseable ONLY as `object_pair`, never as a top-level
    //   bare-scalar — which is what § 5.0.1 step 2 requires.
    //   Per spec note: to force a colon-bearing scalar at the root
    //   to be an Array item, use the raw marker (`:: foo: bar`).
    //
    // * Compound openers (`{`, `[`, `(`, `((`) and the empty-inline
    //   compound forms (`{}` / `[]` / `()` / `(())`) and the
    //   keywords are still allowed unchanged — they are
    //   unambiguous lines that cannot be confused with a pair.
    top_array_item: $ => choice(
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
      field('value', $.compound_object),
      field('value', $.compound_array),
      field('value', $.multiline_stripped),
      field('value', $.multiline_verbatim),
      field('value', $.empty_object),
      field('value', $.empty_array),
      field('value', $.empty_paren),
      field('value', $.empty_double_paren),
      field('value', $.keyword),
      // Bare-scalar branch — the line is captured as a `scalar`
      // node whose text comes from the `_top_scalar_text` token
      // (no `:` allowed). Wrapping in `top_scalar` keeps the AST
      // tidy: tools see exactly the same `(scalar)` shape as
      // elsewhere, with the only difference being which lexer
      // rule produced the inner token.
      field('value', $.top_scalar),
    ),

    // `top_scalar` is a one-token whole-line scalar used at the
    // document root for spec § 5.0.1's bare-scalar Array-item
    // case. The token swallows the trailing newline, which makes
    // it strictly longer than the `_key_segment` token a pair
    // would emit (`_key_segment` stops at the first `:` / `\n` /
    // structural byte). Two consequences:
    //
    //   1. On a colon-free line such as `foo\n`, the whole-line
    //      `_top_scalar_text` token (length 4) wins the lexer's
    //      longest-match against `_key_segment` (length 3) — so
    //      the parser commits to the top-level Array-item path,
    //      not the always-ERROR pair-without-separator path.
    //   2. On a pair-shaped line such as `name: Russia\n`, the
    //      `_top_scalar_text` regex CANNOT match (it forbids
    //      `:`), so `_key_segment` is the only viable token at
    //      line-start and the parser correctly enters
    //      `object_pair` (spec § 5.0.1 step 2).
    top_scalar: $ => $._top_scalar_text,
    _top_scalar_text: $ => token(/[^\s:\r\n][^:\r\n]*\r?\n/),

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
