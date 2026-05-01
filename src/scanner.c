// Tree-sitter external scanner for Ktav.
//
// Emits two zero-/low-width tokens that the LR(1) grammar generated
// from grammar.js cannot express on its own:
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
//                 (`}`, `]`, `)`, `))`) so that any non-whitespace
//                 content between the closer and the line terminator
//                 causes a parse failure (§ 5.6.1 closer-on-its-own-
//                 line and the cleanliness rule for object/array
//                 closers).
//
// Both tokens are designed to be cheap: no allocation, no state
// carried across calls. The external_scanner_state size is therefore
// zero, and serialize / deserialize are no-ops.

#include "tree_sitter/parser.h"

enum TokenType {
    MARKER_WS,
    STRICT_EOL,
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
