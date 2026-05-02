// Tree-sitter external scanner for Ktav.
//
// Emits four tokens that the LR(1) grammar generated from grammar.js
// cannot express on its own:
//
//   _marker_ws  — a zero-width assertion that fires only when the
//                 byte immediately following a pair separator
//                 (`:`, `::`, `:i`, `:f`) is ASCII whitespace
//                 (space, tab, CR, LF) or EOF. The assertion is
//                 zero-width — it does not consume any input — so
//                 the existing `extras` whitespace handling and the
//                 `_newline` rule for empty values both still apply
//                 unchanged. Its sole purpose is to MAKE A PARSE FAIL
//                 when a writer omits the mandatory whitespace, e.g.
//                 `key:value` (§ 6.10 of the spec).
//
//   _strict_eol — consumes `[ \t]*` followed by `\r?\n` OR by EOF.
//                 Used as the line terminator for compound closers
//                 (`}`, `]`) so that any non-whitespace content
//                 between the closer and the line terminator
//                 causes a parse failure (§ 5.6.1 closer-on-its-own-
//                 line and the cleanliness rule for object/array
//                 closers).
//
//   _stripped_close  — context-sensitive closer for `(...)` multi-line
//                      strings. Matches `)` followed by `[ \t]*\r?\n`
//                      (or EOF). Only valid inside the body of a
//                      `multiline_stripped`. A `))` line in that
//                      context is NOT a close — the scanner declines
//                      and the line falls through to the
//                      `multiline_content_line` regex token.
//
//   _verbatim_close  — context-sensitive closer for `((...))` multi-line
//                      strings. Matches `))` followed by `[ \t]*\r?\n`
//                      (or EOF). Only valid inside `multiline_verbatim`.
//                      A single `)` line in that context falls through
//                      to `multiline_content_line`.
//
// All tokens are stateless: the parser supplies the necessary context
// via `valid_symbols`. The external_scanner_state size is therefore
// zero, and serialize / deserialize are no-ops.

#include "tree_sitter/parser.h"

enum TokenType {
    MARKER_WS,
    STRICT_EOL,
    STRIPPED_CLOSE,
    VERBATIM_CLOSE,
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

static inline bool is_h_ws(int32_t c) {
    return c == ' ' || c == '\t';
}

// Consume optional `[ \t]*` then a single line terminator (LF, CRLF,
// or EOF). Returns true on success and leaves `mark_end` at the byte
// after the terminator. Returns false (without disturbing mark_end's
// previous position) if the next non-h-ws byte is not a terminator.
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
    if (c == 0) {
        lexer->mark_end(lexer);
        return true;
    }
    return false;
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
        if (c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == 0) {
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

    // _verbatim_close — matches `[ \t]*))[ \t]*\r?\n` (or EOF). The
    // closer may have leading horizontal whitespace (the `)` is "on its
    // own line, possibly with leading whitespace" per § 5.6.1). Only
    // valid inside the body of a `multiline_verbatim`. Tried before
    // STRIPPED_CLOSE so `))` is never split into a `)` close + leftover.
    // (In practice the two are mutually exclusive per parse state, so
    // ordering matters only for defensive correctness.)
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
        // Fall through: a non-`))` line inside verbatim becomes content.
        return false;
    }

    // _stripped_close — matches `[ \t]*)[ \t]*\r?\n` (or EOF). Only
    // valid inside `multiline_stripped`. A `))` line is NOT a stripped
    // close: we require the byte after the first `)` to NOT be another
    // `)`, so `))` falls through to the `multiline_content_line`
    // regex token.
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
        return false;
    }

    // _strict_eol — consume optional horizontal whitespace, then the
    // line terminator (LF, CRLF, or EOF). If a non-whitespace byte
    // appears before the line terminator, fail.
    if (valid_symbols[STRICT_EOL]) {
        while (is_h_ws(lexer->lookahead)) {
            lexer->advance(lexer, false);
        }
        int32_t c = lexer->lookahead;
        if (c == '\n') {
            lexer->advance(lexer, false);
            lexer->mark_end(lexer);
            lexer->result_symbol = STRICT_EOL;
            return true;
        }
        if (c == '\r') {
            lexer->advance(lexer, false);
            if (lexer->lookahead == '\n') {
                lexer->advance(lexer, false);
            }
            lexer->mark_end(lexer);
            lexer->result_symbol = STRICT_EOL;
            return true;
        }
        if (c == 0) {
            // EOF as a line terminator (§ 3.2: trailing content of the
            // final line need not be followed by a line separator).
            lexer->mark_end(lexer);
            lexer->result_symbol = STRICT_EOL;
            return true;
        }
    }

    return false;
}
