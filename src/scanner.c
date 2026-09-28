// Tree-sitter external scanner for Ktav.
//
// Emits seventeen tokens that the LR(1) grammar generated from grammar.js
// cannot express on its own:
//
//   _marker_ws  — a zero-width assertion that fires only when the
//                 byte immediately following a pair separator
//                 (`:` or `::`) is one of spec 0.7.0 § 3.3's 25
//                 whitespace code points (see `is_ktav_ws` below —
//                 NOT just ASCII space/tab/CR/LF) or EOF. The
//                 assertion is zero-width — it does not consume any
//                 input — so the existing `extras` whitespace handling
//                 and the `_newline` rule for empty values both still
//                 apply unchanged. Its sole purpose is to MAKE A PARSE
//                 FAIL when a writer omits the mandatory whitespace,
//                 e.g. `key:value` (§ 6.10 of the spec).
//
//   _eol         — a line terminator (LF, CR, CRLF) or a true EOF, with
//                 optional leading horizontal whitespace. The end of a
//                 scalar, keyword or inline compound. Split from
//                 `_strict_eol` only to keep closer-strictness legible.
//
//   _strict_eol — consumes a run of `is_h_ws` (§ 3.3 whitespace minus
//                 the two line terminators) followed by `\r`, `\n`,
//                 `\r\n`, OR EOF. Used as the line terminator for
//                 compound closers (`}`, `]`) so that any non-
//                 whitespace content between the closer and the line
//                 terminator causes a parse failure (§ 5.6.1 closer-
//                 on-its-own-line and the cleanliness rule for
//                 object/array closers).
//
//   _stripped_close  — context-sensitive closer for `(...)` multi-line
//                      strings. Matches `)` followed by `is_h_ws*` then
//                      a line terminator (or EOF). Only valid inside
//                      the body of a `multiline_stripped`. A `))` line
//                      in that context is NOT a close — the scanner
//                      declines and the line falls through to
//                      CONTENT_LINE.
//
//   _verbatim_close  — context-sensitive closer for `((...))` multi-line
//                      strings. Matches `))` followed by `is_h_ws*` then
//                      a line terminator (or EOF). Only valid inside
//                      `multiline_verbatim`. A single `)` line in that
//                      context falls through to CONTENT_LINE.
//
//   _content_line    — a `multiline_content_line` body line: everything
//                      up to the line terminator, THEN the terminator.
//                      External (not a grammar regex) so it can call
//                      `lexer->eof()` and treat an embedded NUL byte as
//                      ordinary content instead of end-of-input — see
//                      the block below for why the regex it replaced
//                      couldn't do that. Task #243.
//
//   _integer_eof / _float_eof — complete numeric values at true EOF.
//                      Unlike regex prefixes, these reject trailing text.
//   _top_scalar_eof / _comment_eof — complete root scalar/comment at EOF.
//   _root_fallback_scalar — first-line scalar without a pair separator.
//   _array_follow_eof — final Array scalar, including pair-shaped text.
//   _inline_integer / _inline_float / _inline_null / _inline_true /
//   _inline_false — an inline value (inside `{...}` / `[...]`) whose
//                      whole trimmed text, up to its unescaped `,` / `}`
//                      / `]`, is a number or keyword. Any escape forces
//                      String (§ 3.7), so the scanner declines and the
//                      grammar's `inline_scalar` takes over.
//
// All tokens are stateless: the parser supplies the necessary context
// via `valid_symbols`. The external_scanner_state size is therefore
// zero, and serialize / deserialize are no-ops.

#include "tree_sitter/parser.h"
#include <string.h>

// Order MUST match the `externals` array in grammar.js.
enum TokenType {
    MARKER_WS,
    STRICT_EOL,
    EOL,
    STRIPPED_CLOSE,
    VERBATIM_CLOSE,
    CONTENT_LINE,
    INTEGER_EOF,
    FLOAT_EOF,
    TOP_SCALAR_EOF,
    COMMENT_EOF,
    ROOT_FALLBACK_SCALAR,
    ARRAY_FOLLOW_EOF,
    INLINE_INTEGER,
    INLINE_FLOAT,
    INLINE_NULL,
    INLINE_TRUE,
    INLINE_FALSE,
};

void *tree_sitter_ktav_external_scanner_create(void) {
    return NULL;
}

void tree_sitter_ktav_external_scanner_destroy(void *payload) {
    (void)payload;
}

unsigned tree_sitter_ktav_external_scanner_serialize(void *payload, char *buffer) {
    (void)payload;
    (void)buffer;
    return 0;
}

void tree_sitter_ktav_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
    (void)payload;
    (void)buffer;
    (void)length;
}

// Spec 0.7.0 § 3.3 freezes whitespace at exactly twenty-five code points:
// tab, LF, VT, FF, CR, space, NEL (U+0085), NBSP (U+00A0), OGHAM SPACE MARK
// (U+1680), EN QUAD..HAIR SPACE (U+2000-U+200A), LINE/PARAGRAPH SEPARATOR
// (U+2028/U+2029), NNBSP (U+202F), MMSP (U+205F), IDEOGRAPHIC SPACE
// (U+3000). Implementations MUST recognise exactly this set, never a host
// Unicode-whitespace primitive (§ 3.3 says so explicitly) — hence the
// explicit code-point list below rather than any libc/Unicode helper.
static inline bool is_ktav_ws(int32_t c) {
    return c == 0x09 || c == 0x0A || c == 0x0B || c == 0x0C || c == 0x0D ||
           c == 0x20 || c == 0x85 || c == 0xA0 || c == 0x1680 ||
           (c >= 0x2000 && c <= 0x200A) || c == 0x2028 || c == 0x2029 ||
           c == 0x202F || c == 0x205F || c == 0x3000;
}

// The same 25-code-point set, minus the two line terminators (LF, CR):
// "horizontal" whitespace usable around structural markers within a
// single line (closer lines' leading/trailing `(ws)`, `<sep-end>`'s
// mandatory post-separator run) without ever consuming a line terminator.
static inline bool is_h_ws(int32_t c) {
    return is_ktav_ws(c) && c != '\n' && c != '\r';
}

static int ascii_digit_value(int32_t c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return -1;
}

static bool scan_digit_run(TSLexer *lexer, int base) {
    int digit = ascii_digit_value(lexer->lookahead);
    if (digit < 0 || digit >= base) return false;
    for (;;) {
        lexer->advance(lexer, false);
        if (lexer->lookahead == '_') {
            lexer->advance(lexer, false);
            digit = ascii_digit_value(lexer->lookahead);
            if (digit < 0 || digit >= base) return false;
        } else {
            digit = ascii_digit_value(lexer->lookahead);
            if (digit < 0 || digit >= base) return true;
        }
    }
}

// `[0-9]([_]?[0-9])*` over `text[*pos..len)` for the given base.
static bool buffer_digit_run(const char *text, unsigned len, unsigned *pos, int base) {
    unsigned i = *pos;
    if (i >= len) return false;
    int digit = ascii_digit_value(text[i]);
    if (digit < 0 || digit >= base) return false;
    i++;
    while (i < len) {
        if (text[i] == '_') {
            if (i + 1 >= len) return false;
            digit = ascii_digit_value(text[i + 1]);
            if (digit < 0 || digit >= base) return false;
            i += 2;
            continue;
        }
        digit = ascii_digit_value(text[i]);
        if (digit < 0 || digit >= base) break;
        i++;
    }
    *pos = i;
    return true;
}

enum NumberKind { NOT_A_NUMBER, NUMBER_INTEGER, NUMBER_FLOAT };

// Same literal shapes as the `integer` / `float` rules in grammar.js,
// including § 5.2's redundant-leading-zero exception.
static enum NumberKind classify_number(const char *text, unsigned len) {
    unsigned i = 0;
    if (i < len && (text[i] == '+' || text[i] == '-')) i++;
    if (i >= len) return NOT_A_NUMBER;
    if (text[i] == '0') {
        i++;
        if (i < len && (text[i] == 'x' || text[i] == 'o' || text[i] == 'b')) {
            int base = text[i] == 'x' ? 16 : text[i] == 'o' ? 8 : 2;
            i++;
            if (!buffer_digit_run(text, len, &i, base) || i != len) return NOT_A_NUMBER;
            return NUMBER_INTEGER;
        }
        if (i < len && ((text[i] >= '0' && text[i] <= '9') || text[i] == '_')) return NOT_A_NUMBER;
    } else {
        if (text[i] < '1' || text[i] > '9' || !buffer_digit_run(text, len, &i, 10)) {
            return NOT_A_NUMBER;
        }
    }
    if (i == len) return NUMBER_INTEGER;
    if (text[i] == '.') {
        i++;
        if (!buffer_digit_run(text, len, &i, 10)) return NOT_A_NUMBER;
        if (i == len) return NUMBER_FLOAT;
    }
    if (text[i] != 'e' && text[i] != 'E') return NOT_A_NUMBER;
    i++;
    if (i < len && (text[i] == '+' || text[i] == '-')) i++;
    if (!buffer_digit_run(text, len, &i, 10) || i != len) return NOT_A_NUMBER;
    return NUMBER_FLOAT;
}

static bool scan_inline_value(TSLexer *lexer, const bool *valid_symbols) {
    while (is_h_ws(lexer->lookahead)) lexer->advance(lexer, true);
    char text[256];
    unsigned len = 0;
    bool trailing_ws = false;
    for (;;) {
        int32_t c = lexer->lookahead;
        if (lexer->eof(lexer) || c == ',' || c == '}' || c == ']' || c == '\r' || c == '\n') break;
        if (is_h_ws(c)) {
            trailing_ws = true;
            lexer->advance(lexer, false);
            continue;
        }
        // Interior whitespace, an escape, or non-ASCII text is never a number or keyword.
        if (trailing_ws || c == '\\' || c > 127 || len == sizeof text) return false;
        text[len++] = (char)c;
        lexer->advance(lexer, false);
        lexer->mark_end(lexer);
    }
    if (len == 0) return false;

    if (len == 4 && !memcmp(text, "null", 4) && valid_symbols[INLINE_NULL]) {
        lexer->result_symbol = INLINE_NULL;
        return true;
    }
    if (len == 4 && !memcmp(text, "true", 4) && valid_symbols[INLINE_TRUE]) {
        lexer->result_symbol = INLINE_TRUE;
        return true;
    }
    if (len == 5 && !memcmp(text, "false", 5) && valid_symbols[INLINE_FALSE]) {
        lexer->result_symbol = INLINE_FALSE;
        return true;
    }
    enum NumberKind kind = classify_number(text, len);
    if (kind == NUMBER_INTEGER && valid_symbols[INLINE_INTEGER]) {
        lexer->result_symbol = INLINE_INTEGER;
        return true;
    }
    if (kind == NUMBER_FLOAT && valid_symbols[INLINE_FLOAT]) {
        lexer->result_symbol = INLINE_FLOAT;
        return true;
    }
    return false;
}

static bool is_keyword(const char *prefix, unsigned length) {
    return (length == 4 &&
            (!memcmp(prefix, "true", 4) || !memcmp(prefix, "null", 4))) ||
           (length == 5 && !memcmp(prefix, "false", 5));
}

static bool scan_eof_number(TSLexer *lexer, const bool *valid_symbols) {
    while (is_h_ws(lexer->lookahead)) lexer->advance(lexer, true);
    if (lexer->lookahead == '+' || lexer->lookahead == '-') lexer->advance(lexer, false);

    if (lexer->lookahead == '0') {
        lexer->advance(lexer, false);
        int base = 0;
        if (lexer->lookahead == 'x') base = 16;
        if (lexer->lookahead == 'o') base = 8;
        if (lexer->lookahead == 'b') base = 2;
        if (base != 0) {
            lexer->advance(lexer, false);
            if (!scan_digit_run(lexer, base)) return false;
            goto finish_integer;
        }
        int next = ascii_digit_value(lexer->lookahead);
        if ((next >= 0 && next < 10) || lexer->lookahead == '_') return false;
    } else {
        int first = ascii_digit_value(lexer->lookahead);
        if (first <= 0 || first >= 10 || !scan_digit_run(lexer, 10)) return false;
    }

    if (lexer->lookahead == '.') {
        lexer->advance(lexer, false);
        if (!scan_digit_run(lexer, 10)) return false;
        goto exponent;
    }
    if (lexer->lookahead != 'e' && lexer->lookahead != 'E') goto finish_integer;

exponent:
    if (lexer->lookahead == 'e' || lexer->lookahead == 'E') {
        lexer->advance(lexer, false);
        if (lexer->lookahead == '+' || lexer->lookahead == '-') lexer->advance(lexer, false);
        if (!scan_digit_run(lexer, 10)) return false;
    }
    if (!valid_symbols[FLOAT_EOF]) return false;
    while (is_h_ws(lexer->lookahead)) lexer->advance(lexer, false);
    if (!lexer->eof(lexer)) return false;
    lexer->mark_end(lexer);
    lexer->result_symbol = FLOAT_EOF;
    return true;

finish_integer:
    if (!valid_symbols[INTEGER_EOF]) return false;
    while (is_h_ws(lexer->lookahead)) lexer->advance(lexer, false);
    if (!lexer->eof(lexer)) return false;
    lexer->mark_end(lexer);
    lexer->result_symbol = INTEGER_EOF;
    return true;
}

// Consume an optional run of `is_h_ws` then a single line terminator
// (LF, CR, CRLF — spec 0.7.0 § 3.2 treats all three as equivalent — or
// EOF). Returns true on success and leaves `mark_end` at the byte after
// the terminator. Returns false (without disturbing mark_end's previous
// position) if the next non-h-ws byte is not a terminator.
static bool consume_line_terminator(TSLexer *lexer) {
    while (is_h_ws(lexer->lookahead)) {
        lexer->advance(lexer, false);
    }
    int32_t c = lexer->lookahead;
    if (c == '\n') {
        lexer->advance(lexer, false);
        lexer->mark_end(lexer);
        return true;
    }
    if (c == '\r') {
        lexer->advance(lexer, false);
        if (lexer->lookahead == '\n') {
            lexer->advance(lexer, false);
        }
        lexer->mark_end(lexer);
        return true;
    }
    // A true end-of-input terminates the final line (§ 3.2). `lookahead`
    // is 0 for BOTH real EOF and an embedded NUL byte, so this MUST ask
    // `eof()` — testing `c == 0` would accept a literal NUL as a line
    // terminator, which § 3.2 does not list as one.
    if (lexer->eof(lexer)) {
        lexer->mark_end(lexer);
        return true;
    }
    return false;
}

static bool scan_root_fallback_scalar(TSLexer *lexer, const bool *valid_symbols) {
    while (is_h_ws(lexer->lookahead)) lexer->advance(lexer, true);
    int32_t first = lexer->lookahead;
    if (lexer->eof(lexer) || first == ':' || first == '{' || first == '[' ||
        first == '(' || first == '}' || first == ']') return false;
    if (first == '#') {
        lexer->advance(lexer, false);
        if (lexer->lookahead == '#') {
            lexer->advance(lexer, false);
            while (!lexer->eof(lexer) && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
                lexer->advance(lexer, false);
            }
            if (!lexer->eof(lexer) || !valid_symbols[COMMENT_EOF]) return false;
            lexer->mark_end(lexer);
            lexer->result_symbol = COMMENT_EOF;
            return true;
        }
    }
    if ((first == '+' || first == '-' || (first >= '0' && first <= '9')) &&
        (valid_symbols[INTEGER_EOF] || valid_symbols[FLOAT_EOF])) {
        if (scan_eof_number(lexer, valid_symbols)) return true;
    }

    int32_t quote = 0;
    bool segment_start = first != '#';
    bool escaped = false;
    bool saw_colon = false;
    bool saw_quote = false;
    bool first_separator_seen = false;
    char prefix[6] = {0};
    unsigned length = 0;
    unsigned last_content = 0;
    while (!lexer->eof(lexer) && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
        int32_t c = lexer->lookahead;
        if (length < 6) {
            prefix[length] = c < 128 ? (char)c : 0;
            length++;
        }
        if (!is_h_ws(c)) last_content = length;
        if (c == ':') saw_colon = true;
        if (escaped) {
            escaped = false;
            lexer->advance(lexer, false);
            continue;
        }
        if (c == '\\') {
            escaped = true;
            segment_start = false;
            lexer->advance(lexer, false);
            continue;
        }
        if (quote != 0) {
            if (c == quote) quote = 0;
            lexer->advance(lexer, false);
            continue;
        }
        if (segment_start && (c == '\'' || c == '"' || c == '`')) {
            quote = c;
            saw_quote = true;
            segment_start = false;
            lexer->advance(lexer, false);
            continue;
        }
        if (c == '.') {
            segment_start = true;
            lexer->advance(lexer, false);
            continue;
        }
        if (c == ':' && !first_separator_seen) {
            first_separator_seen = true;
            lexer->advance(lexer, false);
            if (lexer->lookahead == ':' || is_ktav_ws(lexer->lookahead) ||
                lexer->eof(lexer)) return false;
            continue;
        }
        if (!is_h_ws(c)) segment_start = false;
        lexer->advance(lexer, false);
    }
    if (saw_colon || saw_quote) {
        if (!consume_line_terminator(lexer)) return false;
        lexer->result_symbol = ROOT_FALLBACK_SCALAR;
        return true;
    }
    if (!lexer->eof(lexer) || !valid_symbols[TOP_SCALAR_EOF]) return false;
    if ((first == 't' || first == 'f' || first == 'n') &&
        is_keyword(prefix, last_content)) return false;
    lexer->mark_end(lexer);
    lexer->result_symbol = TOP_SCALAR_EOF;
    return true;
}

static bool scan_array_follow_eof(TSLexer *lexer, const bool *valid_symbols) {
    while (is_h_ws(lexer->lookahead)) lexer->advance(lexer, true);
    int32_t first = lexer->lookahead;
    if (lexer->eof(lexer) || first == ':' || first == '{' || first == '[' ||
        first == '}' || first == ']' || first == '(') return false;
    if (first == '#') {
        lexer->advance(lexer, false);
        if (lexer->lookahead == '#') {
            lexer->advance(lexer, false);
            while (!lexer->eof(lexer) && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
                lexer->advance(lexer, false);
            }
            if (!lexer->eof(lexer) || !valid_symbols[COMMENT_EOF]) return false;
            lexer->mark_end(lexer);
            lexer->result_symbol = COMMENT_EOF;
            return true;
        }
    }
    if ((first == '+' || first == '-' || (first >= '0' && first <= '9')) &&
        (valid_symbols[INTEGER_EOF] || valid_symbols[FLOAT_EOF])) {
        if (scan_eof_number(lexer, valid_symbols)) return true;
    }

    char prefix[6] = {0};
    unsigned length = 0;
    unsigned last_content = 0;
    while (!lexer->eof(lexer)) {
        int32_t c = lexer->lookahead;
        if (c == '\r' || c == '\n') return false;
        if (length < 6) {
            prefix[length] = c < 128 ? (char)c : 0;
            length++;
        }
        if (!is_h_ws(c)) last_content = length;
        lexer->advance(lexer, false);
    }
    if ((first == 't' || first == 'f' || first == 'n') &&
        is_keyword(prefix, last_content)) return false;
    lexer->mark_end(lexer);
    lexer->result_symbol = ARRAY_FOLLOW_EOF;
    return true;
}

bool tree_sitter_ktav_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    (void)payload;

    // Mark the current lex position before any `advance` so that on
    // failure we don't leave bytes consumed (which would corrupt the
    // lexer state for the next attempted token).
    lexer->mark_end(lexer);

    // _marker_ws — zero-width. Succeed iff the next byte is horizontal
    // whitespace, CR, LF, or EOF. We don't `advance`; we only `mark_end`
    // at the current position so the token has zero length.
    if (valid_symbols[MARKER_WS]) {
        int32_t c = lexer->lookahead;
        // An empty value's line end wins over a zero-width separator check.
        if (valid_symbols[EOL] && consume_line_terminator(lexer)) {
            lexer->result_symbol = EOL;
            return true;
        }
        // Spec 0.7.0 § 4 `<sep-end> ::= 1*ws | &line-end`: any of the 25
        // § 3.3 whitespace code points satisfies "1 ws", not just ASCII.
        if (is_ktav_ws(c) || lexer->eof(lexer)) {
            lexer->mark_end(lexer);
            lexer->result_symbol = MARKER_WS;
            return true;
        }
        // _marker_ws is the only valid token here in the strict path —
        // returning false makes tree-sitter raise a parse error, which
        // is exactly the § 6.10 rejection we want. The two branches are
        // mutually exclusive: never fall through to STRICT_EOL.
        return false;
    }

    // Inline typed values. Skipped during error recovery (every symbol is
    // valid then), where a failed scan here would have advanced the lexer.
    bool inline_typed = valid_symbols[INLINE_INTEGER] || valid_symbols[INLINE_FLOAT] ||
                        valid_symbols[INLINE_NULL] || valid_symbols[INLINE_TRUE] ||
                        valid_symbols[INLINE_FALSE];
    if (inline_typed && !valid_symbols[CONTENT_LINE]) {
        return scan_inline_value(lexer, valid_symbols);
    }

    // _verbatim_close — matches `[ \t]*))[ \t]*\r?\n` (or EOF). The
    // closer may have leading horizontal whitespace (the `)` is "on its
    // own line, possibly with leading whitespace" per § 5.6.1). Only
    // valid inside the body of a `multiline_verbatim`. Tried before
    // STRIPPED_CLOSE so `))` is never split into a `)` close + leftover.
    // (In practice the two are mutually exclusive per parse state, so
    // ordering matters only for defensive correctness.)
    //
    // On failure this falls through to the CONTENT_LINE check below
    // rather than returning: a non-`))` line inside verbatim becomes
    // content, and CONTENT_LINE is now also an external token (it used
    // to be a plain regex that tree-sitter retried automatically on
    // external-scanner failure; now that it needs `lexer->eof()` too —
    // see CONTENT_LINE below — this function must do that retry itself).
    // Whatever was speculatively consumed above (e.g. a lone `)`) is
    // still part of the eventual token: CONTENT_LINE's own mark_end
    // covers everything from this call's true start, not from wherever
    // this block gave up.
    if (valid_symbols[VERBATIM_CLOSE]) {
        while (is_h_ws(lexer->lookahead)) {
            lexer->advance(lexer, false);
        }
        if (lexer->lookahead == ')') {
            lexer->advance(lexer, false);
            if (lexer->lookahead == ')') {
                lexer->advance(lexer, false);
                if (consume_line_terminator(lexer)) {
                    lexer->result_symbol = VERBATIM_CLOSE;
                    return true;
                }
            }
        }
    }

    // _stripped_close — matches `[ \t]*)[ \t]*\r?\n` (or EOF). Only
    // valid inside `multiline_stripped`. A `))` line is NOT a stripped
    // close: we require the byte after the first `)` to NOT be another
    // `)`, so `))` falls through to CONTENT_LINE below.
    if (valid_symbols[STRIPPED_CLOSE]) {
        while (is_h_ws(lexer->lookahead)) {
            lexer->advance(lexer, false);
        }
        if (lexer->lookahead == ')') {
            lexer->advance(lexer, false);
            if (lexer->lookahead != ')') {
                if (consume_line_terminator(lexer)) {
                    lexer->result_symbol = STRIPPED_CLOSE;
                    return true;
                }
            }
        }
    }

    // _content_line — a multi-line-string body line: everything up to
    // (not including) the line terminator, THEN the terminator itself.
    // Deliberately does NOT strip leading/trailing horizontal whitespace
    // the way `consume_line_terminator` does for the other tokens —
    // whitespace on a content line is content, verbatim bodies exist
    // specifically to preserve it byte-for-byte.
    //
    // A literal NUL byte is content, same as any other non-terminator
    // byte. This is the one thing the regex it replaces
    // (`/[^\r\n]*(\r\n|\r|\n)/`) could not do: tree-sitter's compiled
    // character-class matcher treats `lookahead == 0` as end-of-input
    // unconditionally, so the regex silently stopped at a NUL even with
    // real bytes still following. Only `lexer->eof()` tells a true
    // end-of-input apart from an embedded NUL. See task #243.
    //
    // A true EOF with no terminator fails, exactly like the regex it
    // replaces — extending that would be a different, unscoped change.
    if (valid_symbols[CONTENT_LINE]) {
        for (;;) {
            int32_t c = lexer->lookahead;
            if (c == '\n' || c == '\r') {
                break;
            }
            if (lexer->eof(lexer)) {
                return false;
            }
            lexer->advance(lexer, false);
        }
        if (lexer->lookahead == '\n') {
            lexer->advance(lexer, false);
        } else {
            lexer->advance(lexer, false); // '\r'
            if (lexer->lookahead == '\n') {
                lexer->advance(lexer, false);
            }
        }
        lexer->mark_end(lexer);
        lexer->result_symbol = CONTENT_LINE;
        return true;
    }

    if (valid_symbols[ROOT_FALLBACK_SCALAR]) {
        // A failed lookahead has advanced the lexer; never try a second token.
        return scan_root_fallback_scalar(lexer, valid_symbols);
    }

    if (valid_symbols[ARRAY_FOLLOW_EOF]) {
        return scan_array_follow_eof(lexer, valid_symbols);
    }

    if (valid_symbols[TOP_SCALAR_EOF] || valid_symbols[COMMENT_EOF] ||
        valid_symbols[INTEGER_EOF] || valid_symbols[FLOAT_EOF]) {
        while (is_h_ws(lexer->lookahead)) lexer->advance(lexer, true);
        int32_t first = lexer->lookahead;
        bool has_content = !lexer->eof(lexer);

        if (first == '#' && valid_symbols[COMMENT_EOF]) {
            lexer->advance(lexer, false);
            if (lexer->lookahead == '#') {
                lexer->advance(lexer, false);
                while (!lexer->eof(lexer) && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
                    lexer->advance(lexer, false);
                }
                if (lexer->eof(lexer)) {
                    lexer->mark_end(lexer);
                    lexer->result_symbol = COMMENT_EOF;
                    return true;
                }
            }
        }

        if ((valid_symbols[INTEGER_EOF] || valid_symbols[FLOAT_EOF]) &&
            scan_eof_number(lexer, valid_symbols)) return true;

        if (valid_symbols[TOP_SCALAR_EOF] && first != ':' && first != '{' &&
            first != '[' && first != '}' && first != ']' && first != '(' &&
            first != '\r' && first != '\n' &&
            has_content) {
            char prefix[6] = {0};
            unsigned length = 0;
            unsigned last_content = 0;
            while (!lexer->eof(lexer)) {
                int32_t c = lexer->lookahead;
                if (c == ':' || c == '\r' || c == '\n') return false;
                if (length < 6) {
                    prefix[length] = c < 128 ? (char)c : 0;
                    length++;
                }
                if (!is_h_ws(c)) last_content = length;
                lexer->advance(lexer, false);
            }
            if (is_keyword(prefix, last_content)) return false;
            lexer->mark_end(lexer);
            lexer->result_symbol = TOP_SCALAR_EOF;
            return true;
        }
        return false;
    }

    // _strict_eol — consume optional horizontal whitespace, then the
    // line terminator (LF, CRLF, or EOF). If a non-whitespace byte
    // appears before the line terminator, fail.
    if (valid_symbols[STRICT_EOL]) {
        if (consume_line_terminator(lexer)) {
            lexer->result_symbol = STRICT_EOL;
            return true;
        }
        return false;
    }

    // _eol terminates scalars, keywords and inline compounds; numbers at
    // true EOF use their dedicated tokens above.
    if (valid_symbols[EOL]) {
        if (consume_line_terminator(lexer)) {
            lexer->result_symbol = EOL;
            return true;
        }
        return false;
    }

    return false;
}
