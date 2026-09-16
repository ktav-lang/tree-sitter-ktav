# Ktav spec 0.7.0 — grammar gap audit (`tree-sitter-ktav`)

- **Branch:** `spec-0.7-audit` · **Date:** 2026-09-16
- **Spec pinned:** `spec/` submodule moved `c9593e8` (v0.6.0-4) → `04f867f` (**v0.7.0**, verified `git -C spec log -1` and `git -C spec describe --tags`).
- **Grammar audited:** `grammar.js` at 444 lines (unchanged by this audit; `src/` untouched; `tree-sitter generate` not run).
- **Baseline:** `tree-sitter test` was 54/54 green before any change; 55/55 green after (one corpus entry added, see § 10).
- **Method:** every claim below about parser behaviour was **observed** by running the checked-in generated parser (`tree-sitter` CLI 0.26.13, installed from the declared devDependency into gitignored `node_modules/`) on byte-exact scratch inputs under gitignored `build/scratch/`. Parse snippets are pasted verbatim (CLI warning banner and timing line trimmed; positions are byte offsets). Claims about untested members of a set are labelled INFERRED.

## 0. Summary

| # | Gap (spec §) | Failure mode today | Owner (queued task) | External scanner needed? |
|---|--------------|--------------------|---------------------|--------------------------|
| G1 | Quoted keys (§ 5.3.3, § 4) | wrong tree / errors / accepted-but-invalid | **quoted keys** | no |
| G2 | Escape table 10 vs 14 (§ 3.7, § 3.7.1) | errors on valid input | **\uXXXX + BOM** | only for lone-surrogate diagnosis |
| G3 | Whitespace set = 25 cp (§ 3.3, § 4) | silent key/value corruption AND false rejections | **unassigned — human decision** | no (scanner.c C edits yes) |
| G4 | Leading BOM (§ 3.1) | structurally absent (accidentally near-correct) | **\uXXXX + BOM** | no |
| G5 | Root-kind detection (§ 5.0.1/§ 5.1) | accepts spec-errors; tree-shape divergence | **unassigned — human decision** | yes, if ever enforced |
| G6 | Lone-CR terminators (§ 3.2) | hard parse errors | **regenerate-and-green pass** | no |
| G7 | Stripped-form trailing-ws (§ 5.6) | **none** — grammar compatible | none | n/a |

Severity intuition: G3 is the nastiest (silent wrong decoded keys — no error surfaces); G1/G2 are loud but block all 0.7 key/escape features; G4/G6 are robustness; G5 is a design decision.

## 1. G1 — Quoted key segments do not exist (§ 5.3.3, § 4)

**Spec requirement** (`spec/versions/0.7/spec.md:1158`):

> A key segment MAY be written as a `<quoted-segment>` (§ 4) instead of a `<bare-segment>`: opened by `"`, `'`, or `` ` ``, running to the first unescaped occurrence of that SAME character, which closes it.

Supported by § 4 (`spec.md:418`): `<quoted-segment> ::= "\"" <dq-token>* "\"" | "'" <sq-token>* "'" | "`" <bt-token>* "`"`; the positional rule (`spec.md:1185`): a quote opens a segment "if and only if it is the first code point of a segment's raw text *after* the same edge-whitespace trimming"; content is never trimmed (`spec.md:1203`); nothing may follow the closer (`spec.md:1232`); quoting is **keys only** (`spec.md:1167`).

**Grammar today** (`grammar.js:136-163`): a key is only bare segments —

```js
key: $ => choice($._spaced_key, $.dotted_key),                       // 136-139
_spaced_key: $ => prec.left(repeat1($._key_segment)),                // 146
dotted_key: $ => prec.left(seq($._key_segment, repeat1(seq('.', $._key_segment)))),  // 148-151
_key_segment: $ => /([^\s\[\]\{\}\(\):#,.\r\n\\]|\\[\\,\}\]\{\[nr.:])+/  // 163
```

Quote characters are not excluded from `_key_segment`, so today they are ordinary key bytes — there is no delimiter concept at all.

**Demonstrated inputs** (all parses observed):

`"port": 1` — parses, but the key node spans the quotes; spec: key `port`, delimiters are pure syntax:
```
(object_pair [0, 0] - [1, 0]
  key: (key [0, 0] - [0, 6])
  separator: (sep_string [0, 6] - [0, 7])
  value: (integer [0, 8] - [1, 0]))
```

`"a.b": 1` — parses as a **dotted** key (segments `"a`, `b"`); spec: ONE flat segment `a.b` (the dot inside quotes must not split, `spec.md:537-544`):
```
key: (key [0, 0] - [0, 5]
  (dotted_key [0, 0] - [0, 5]))
```

`"a}b": 1` — ERROR inside the key; spec: valid key `a}b` (`}` is ordinary content inside quotes):
```
key: (key [0, 0] - [0, 5]
  (ERROR [0, 2] - [0, 3]))
```

`` `a:b`: 1 `` — broken recovery: key `` `a ``, ERROR region over `` :b` ``, separator found at the second colon; spec: valid key `a:b`:
```
key: (key [0, 0] - [0, 2])
(ERROR [0, 2] - [0, 5]
  (sep_string [0, 2] - [0, 3]))
separator: (sep_string [0, 5] - [0, 6])
```

`"a" "b": 1` — **accepted** as one 7-byte key; spec: `InvalidKey` error — "no form combining quoted content with further bare or quoted content inside one segment" (`spec.md:1236-1238`):
```
key: (key [0, 0] - [0, 7])
```

`k: {"a,b": 1, c: 2}` — the comma inside the quoted key is structural today: the parser recovers into two pairs only by embedding an ERROR at the comma inside the first key node; spec: clean two pairs, comma opaque inside quotes (`spec.md:1337-1351`):
```
(inline_pair [0, 4] - [0, 12]
  key: (key [0, 4] - [0, 9]
    (ERROR [0, 6] - [0, 7]))
  ...)
(inline_pair [0, 14] - [0, 18]
  key: (key [0, 14] - [0, 15])
  ...)
```

`'tis the season: fa` (document's first line) — parses as an `object_pair` with key `'tis the season`; spec 0.7: the leading `'` opens an **unterminated quoted segment**, the separator scan finds no separator, and an undecided root falls to § 5.0.1 rule 7 — a root-**Array** String item (`spec.md:1292-1296`, a breaking change):
```
(object_pair [0, 0] - [1, 0]
  key: (key [0, 0] - [0, 15])
  separator: (sep_string [0, 15] - [0, 16])
  value: (scalar [0, 17] - [1, 0]))
```

Conformant counterpoint (no change needed): `port": 1` parses with key `port"` — a quote **mid-segment** is an ordinary `<key-char>` in 0.7 too (`spec.md:1199-1202`).

**Must produce:** a quoted-segment alternative in the key grammar (three delimiters; closes at the first unescaped same delimiter; self-escape via `\"` / `\'` / `` \` `` — see G2; content untrimmed; opaque to `.` `:` `,` `{` `}` `[` `]`; nothing but whitespace between closer and the next `.`/separator, else the `InvalidKey` case above).

**Owner:** the **quoted keys** task.

**Difficulty / scanner note:** the segment token itself is expressible as a single regex token (three delimiter alternatives, char classes excluding only the own delimiter + control bytes/DEL, plus the 14 escape forms incl. `\uXXXX`). Because the whole quoted segment is ONE token, the `.`/`:`/`,`/bracket opacity inside it falls out of tokenization — no external scanner needed. Required refactors: `word: $ => $._key_segment` (`grammar.js:76`) cannot stay on `_key_segment` once it gains alternatives (tree-sitter's word token must be a single token); root-detection interplay (`'tis the season` case) belongs to the G5 dispatch work; the `UnterminatedQuotedKey` vs `MissingSeparator` **diagnosis** (§ 6.16) is error-taxonomy, not tree shape.

## 2. G2 — Escape table: grammar has 10 forms, 0.7.0 has 14 (§ 3.7, § 3.7.1)

**Spec requirement** (`spec.md:234`): "The following **fourteen** escape sequences are recognised". The four the grammar lacks (`spec.md:255-258`):

| Sequence | Replacement |
|----------|-------------|
| `\"`     | `"` (literal double quote) |
| `\'`     | `'` (literal single quote) |
| `` \` `` | `` ` `` (literal backtick) |
| `\uXXXX` | the Unicode code point `U+XXXX` — see below |

`\uXXXX` rules (`spec.md:303-332`): "exactly **four** hexadecimal digits (`[0-9a-fA-F]`, case-insensitive)"; "Fewer than four hex digits following `\u` ... is a `BadEscapeSequence` error — the escape is never partially consumed"; surrogate pairs combine above the BMP; "A high surrogate not immediately followed by a valid low-surrogate `\uXXXX` escape, or a low surrogate that does not immediately follow a high surrogate, is a **lone surrogate** and is a `BadEscapeSequence` error"; recognised "only ... inline scalar values and keys. It is **not** processed inside multi-line scalar values, multi-line string content (`(…)` / `((…))`, § 5.6), or comments". § 4 (`spec.md:412-415`) adds the same forms to `<key-escape>`/`<escapable-byte>`.

**Grammar today:** ten two-byte forms in both places —
- `grammar.js:163` — `_key_segment: /([^\s\[\]\{\}\(\):#,.\r\n\\]|\\[\\,\}\]\{\[nr.:])+/` (escape char class lacks `"`, `'`, `` ` ``, and any `\u` form)
- `grammar.js:301-312` — `escape_sequence: token(choice('\\\\','\\,','\\}','\\]','\\{','\\[','\\n','\\r','\\.','\\:'))`

Provenance: the grammar matches spec 0.6 exactly (0.6 § 3.7 says "ten"); 0.6.1–0.6.4 added none (0.6.4 is float-canonicalisation only, `spec/CHANGELOG.md:504-516`). Note: Appendix A's "the escape table grows from eleven entries to fourteen" (`spec.md:3428`) contradicts the 0.6 spec's own "ten" — an editorial slip in the spec's changelog; the normative 0.7 table (fourteen) is what binds.

**Demonstrated inputs** (observed):

`a\u0041b: 1` — ERROR (recovered as a junk `multiline_content_line`); spec: valid key `aAb`:
```
(ERROR [0, 0] - [1, 0]
  (multiline_content_line [0, 1] - [1, 0]))
```

`a\u002Eb: 1` — ERROR; spec: the **flat** key `a.b` — "a key segment spelling the dot as `\u` followed by the four hex digits for `U+002E` decodes identically to `\.` above (flat key, no nesting)" (`spec.md:530-536`); a recognised escape is "never re-examined as a structural delimiter" (`spec.md:237-241`).

`k: {x: A\u0041B}` — ERROR inside the inline value; spec: inline scalar `AAB` (String — a recognised escape forces String, § 5.2 rule 14):
```
(ERROR [0, 0] - [1, 0]
  (key [0, 0] - [0, 1])
  (sep_string [0, 1] - [0, 2])
  (inline_pair [0, 4] - [0, 8] ... )
  (multiline_content_line [0, 8] - [1, 0]))
```

`k: {\uD83D\uDE00}` — ERROR; spec: valid (surrogate pair → one code point above the BMP).

`k: {\uD800}` — ERROR today, and spec **also** rejects it (lone surrogate = `BadEscapeSequence`): conformant outcome, different mechanism (the grammar has no `\u` token at all, so rejection is incidental; recovery shape differs — junk content line, no diagnosable node).

Conformant boundary (observed, and now locked into the corpus — § 10): `a: \u0041` parses as a plain `(scalar)` — whole-line values do NOT process escapes; the six bytes are literal content, exactly as 0.7 requires.

**Must produce:** `\"`, `\'`, `` \` ``, `\uXXXX` in BOTH `_key_segment` (keys, bare and quoted) and `escape_sequence` (inline scalars), with exactly-four-hex semantics and no partial consumption; rejection (error) for malformed `\u` forms.

**Owner:** the **\uXXXX + BOM** task.

**Difficulty / scanner note:** the tokens are pure regex — `\\u[0-9a-fA-F]{4}` and the three two-byte quote forms; exactly-four and non-partial are automatic. The one thing a regex lexer **cannot** express is lone-surrogate validation (pairing is cross-token state): either add it to `src/scanner.c` (external scanner in C) or accept surrogate escapes at the syntax level and let the reference parser raise `BadEscapeSequence` — a documented diagnosis trade-off for the task owner to decide (see § 12).

## 3. G3 — Whitespace set: ASCII-only in the grammar vs 25 code points (§ 3.3, § 4)

**Spec requirement** (`spec.md:127-139`): whitespace is "one of the following twenty-five, enumerated exhaustively — ... Unicode's `White_Space` property as of Unicode 6.3": `U+0009 U+000A U+000B U+000C U+000D U+0020 U+0085 U+00A0 U+1680 U+2000–U+200A U+2028 U+2029 U+202F U+205F U+3000`; "Implementations MUST recognise exactly this set, no more and no fewer ... never delegate to a host language's built-in Unicode-whitespace primitive". § 4 makes `ws` line-bounded (all of the above except LF/CR) and uses it for indentation, blank lines, `<sep-end>` (`spec.md:546`), closer lines, and key-segment trimming; interior whitespace is preserved in keys (`spec.md:443-445`). Appendix A (`spec.md:3333`) additionally **requires** raw VT `0x0B` and FF `0x0C` to be admitted as key *content*.

**Grammar today:**
- `grammar.js:61-65` — `extras: $ => [ /[ \t]+/ ]` — indentation/inter-token skip is space+tab only.
- `\s` appears in every content class: `_key_segment` (163), `_inline_scalar_head` (318), `_inline_scalar_text` (323), `_top_scalar_text` (362), `_raw_scalar_text` (396), `_scalar_text` (406), `integer` (427), `float` (432).
- `src/scanner.c:72-74` — `is_h_ws` = space/tab; `src/scanner.c:118` — `_marker_ws` accepts exactly `' ' '\t' '\n' '\r' 0`.

**Observed calibration (important):** tree-sitter's `\s`, as compiled by this grammar, matches **ASCII whitespace only**. Observed memberships: NEL (U+0085), NBSP (U+00A0), U+FEFF, U+3000 are matched by `[^\s...]` as *content*; VT (U+000B) and FF (U+000C) are excluded by `\s`. INFERRED (same class, not individually probed): U+1680, U+2000–U+200A, U+2028, U+2029, U+202F, U+205F behave like NBSP. Either way the grammar is wrong in both directions against the 25-set.

**Failure mode A — silent key corruption.** `a: 1` + a line indented with NEL (`\u0085b: 2`): the NEL is glued into the key text; spec: NEL is indentation whitespace, key is `b`:
```
(object_pair [1, 0] - [2, 0]
  key: (key [1, 0] - [1, 3])      # 3 bytes = NEL(2) + 'b'
  separator: (sep_string [1, 3] - [1, 4])
  value: (integer [1, 5] - [2, 0]))
```
Same shape observed for NBSP (`04`) and U+3000 (`29`). No error node — the decoded key is silently wrong, which is the worst class of divergence here.

**Failure mode B — silent value/blank-line corruption.** `a: <NBSP>x` → the scalar node includes the NBSP; spec: `<scalar-body>` is trimmed of § 3.3 whitespace → value `x` (observed: `value: (scalar [0, 3] - [1, 0])`). A line containing only NBSP parses as `top_array_item (top_scalar)`; spec § 3.5: a line "consisting only of whitespace code points" is a **blank line** (observed tree in `28`).

**Failure mode C — false rejection of spec-valid documents.**
- `a: 1` + FF-indented `\u000Cb: 2` → `(ERROR [1, 0] - [2, 0] (multiline_content_line ...))`; spec: FF is whitespace → valid pair (observed `06`).
- `a\u000Bb: 1` (VT inside a key) → ERROR; spec 0.7 **requires** raw VT/FF as key content (Appendix A `spec.md:3333-3335`) (observed `05`).
- `a:<NBSP>1` → ERROR (recovered as separate junk + `top_scalar`); spec: `<sep-end>` is `1*ws` and NBSP is `ws` → valid pair with value `1` (observed `25`). Root cause: `_marker_ws` (`scanner.c:118`) checks five ASCII bytes only.
- `}` + NBSP + newline as an object closer → parse failure; spec: closer lines are `(ws) "}" (ws) <line-end>` (observed `30`; root cause `is_h_ws`, `scanner.c:72-74`).

**Must produce:** the exact 25-code-point set for: `extras`, all `\s`-class content exclusions (per-position: VT/FF become key content per Appendix A; non-ASCII ws never appears in decoded key/scalar content), `_marker_ws`, `is_h_ws`/`_strict_eol`, comment/blank-line leading `(ws)`.

**Owner:** **none of the three queued tasks names this** — see § 11 (human decision; suggested: fold into the \uXXXX + BOM task, which is already a lexical-foundation change).

**Difficulty / scanner note:** a 23-character line-bounded class is trivially expressible in tree-sitter regex by hard-coding the code points (`[\t\u000B\u000C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]`) — do NOT use `\s` (observed ASCII-only here) and do NOT use host `is_whitespace`-style primitives (spec § 3.3 forbids delegation). `src/scanner.c` needs matching C edits (in scope for the implementing task, not this audit). No external scanner beyond the existing one.

## 4. G4 — Leading byte-order mark (§ 3.1)

**Spec requirement** (`spec.md:97-101`): "A parser-conforming implementation MUST skip exactly one leading byte-order mark (U+FEFF) if it is the very first code point of the document, before any other byte ... A U+FEFF code point anywhere else in the document is ordinary content — § 3.3 does not classify it as whitespace." New in 0.7.0 ("Unspecified in 0.6.4", Appendix A `spec.md:3306-3312`).

**Grammar today:** `grammar.js:83` — `source_file: $ => repeat($._line)` — no BOM term anywhere; U+FEFF bytes at offset 0 match no token.

**Demonstrated inputs** (observed):
- `EF BB BF` + `a: 1\n` → the pair parses, but the source node **starts at [0, 3]** and NO node covers the BOM — it disappears via lexer error recovery, invisibly:
```
(source_file [0, 3] - [1, 0]
  (object_pair [0, 3] - [1, 0]
    key: (key [0, 3] - [0, 4]) ...))
```
- `EF BB BF EF BB BF` + `a: 1\n` (two BOMs) → first BOM swallowed by recovery, second BOM glued into the key text (`key [0, 3] - [0, 7]` = BOM + `a`). Decoded key `\uFEFFa` — which is what § 3.1 *wants* (skip exactly one; the second is content) — but for the wrong reason: nothing in the grammar encodes "exactly one at offset 0"; the outcome is incidental error-recovery behaviour and is not guaranteed for other shapes (e.g. BOM before a comment line was not probed).
- BOM-only document → `(source_file [0, 3] - [0, 3])` (empty tree).
- BOM mid-key (`b\uFEFFc: 2`) → key contains it as content — **conformant** (matches "ordinary content").

**Must produce:** a first-class, guaranteed skip of exactly one leading U+FEFF.

**Owner:** the **\uXXXX + BOM** task.

**Difficulty / scanner note:** trivially regex-expressible — e.g. `source_file: $ => seq(optional(/\uFEFF/), repeat($._line))` — no external scanner. Benefit: the skip becomes a guaranteed grammar property and is visible/testable instead of recovery-dependent.

## 5. G5 — Root-kind detection is not enforced (§ 5.0.1, § 5.1)

**Spec requirement** (`spec.md:808-817`): "The root kind is **fixed** by the first content line." Inside a top-level Array, "a line that looks like a pair (e.g. `host: localhost`) is just a bare scalar String per § 5.4 rule 9; there is no implicit re-classification back to a pair." Inside a top-level Object, "A bare scalar without `:` is a `MissingSeparator` error." Rules 2–5 + § 6.14: after a top-level inline compound or a lone opener, any further content line is `OrphanLineAfterTopLevelInline`.

**Grammar today** (`grammar.js:79-91`) — and the grammar's own header comment admits the delegation:
```js
// The top-level document is a sequence of lines. Per spec § 5.0.1
// the root may be either an Object or an Array. Tree-sitter accepts
// both kinds of line anywhere; semantic dispatch is left to the
// reference parser.
source_file: $ => repeat($._line),
```

**Demonstrated inputs** (observed):
- `a: 1` + `plain` → ACCEPTED as `object_pair` + `top_array_item(top_scalar)`; spec: Object root → `MissingSeparator` error for line 2 (`20`).
- `:: x` + `host: localhost` → `top_array_item` + `object_pair`; spec: Array root, line 2 is a String item `host: localhost` — same tokens, different tree shape (`21`).
- `{a: 1}` + `b: 2` → both lines accepted; spec: `OrphanLineAfterTopLevelInline` error (`22`).
- Quoted-key interplay: `'tis the season: fa` as first line must re-classify from Object pair (today's parse) to root-Array String item (G1, `18`).

**Must produce (if enforced):** document-level dispatch fixed by the first content line, with the three error/shape behaviours above. Note the parser *cannot* distinguish "error" from "unusual but accepted" — for the CST, "must produce" reduces to tree shape (no `top_scalar` node after a pair line; no `object_pair` node after a raw item; no pair line after a top-level inline).

**Owner:** **unassigned** — none of the three queued tasks covers it; see § 11.

**Difficulty / scanner note:** root-kind-dependent dispatch across the whole document is context-sensitive — not expressible with tree-sitter's regex lexer alone; it would need a stateful **external scanner** (tracking "root seen / which kind") or an accepted, documented continued delegation to the reference parser (the current design intent, per the comment quoted above). This audit takes no side; it is a human decision.

## 6. G6 — Lone `CR` is not a line terminator (§ 3.2)

**Spec requirement** (`spec.md:105-111`): "A line terminator is one of three byte sequences: `LF` (0x0A), `CR` (0x0D), `CR LF` (0x0D 0x0A). Implementations MUST treat all three as equivalent line terminators." Also `spec.md:114`: "A `CR` byte never appears as a content byte at parse time."

**Grammar today:** `grammar.js:95` — `_newline: $ => /\r?\n/` — plus the same `\r?\n` embedded in `comment` (103), `_top_scalar_text` (362), `multiline_content_line` (377), `integer` (427), `float` (432). Inconsistent corner: the external scanner's `consume_line_terminator` (`src/scanner.c:90-97`) DOES accept a lone CR — so closers tolerate CR-only endings while `_newline` does not.

**Demonstrated input** (observed): `a: 1\rb: 2\r` (CR-only endings) —
```
(ERROR [0, 0] - [0, 10]
  (key [0, 0] - [0, 1])
  (sep_string [0, 1] - [0, 2])
  (ERROR [0, 4] - [0, 5])
  (sep_string [0, 6] - [0, 7])
  (ERROR [0, 9] - [0, 10]))
```
Spec: two clean pairs. (Pre-existing gap — § 3.2's CR rule predates 0.7 — but still normative for 0.7.0 conformance.)

**Must produce:** `\r\n | \r | \n` everywhere a line terminator is consumed, grammar and scanner alike.

**Owner:** the **regenerate-and-green pass** (mechanical sweep + regenerate).

**Difficulty / scanner note:** no external scanner; regex sweep across ~7 rules plus the scanner's already-correct terminator logic; corpus coverage belongs in `basic.txt` (invisible-byte caveat, § 10).

## 7. G7 — § 5.6 stripped-form trailing-whitespace stripping: no grammar change needed

**Spec change** (`spec.md:1418-1422`): "Prior to 0.7, trailing whitespace on each line was preserved verbatim ... As of 0.7, the stripped form's name matches its behaviour on both edges of each line." (Stripped form `( … )` now strips trailing § 3.3 whitespace per content line after removing the common leading prefix; `(( … ))` stays fully verbatim.)

**Observed:** `(` + `\n  abc \n` + `)` parses cleanly; the content line is captured verbatim by `multiline_content_line` (`grammar.js:377`):
```
(top_array_item [0, 0] - [3, 0]
  value: (multiline_stripped [0, 0] - [3, 0]
    (open_paren [0, 0] - [1, 0])
    (multiline_content_line [1, 0] - [2, 0])
    (close_paren [2, 0] - [3, 0])))
```
**Verdict:** the stripping is a **Value-level** computation (common prefix + trailing trim + `\n` join) performed on the captured lines; it is invisible in the CST either way. The grammar's verbatim capture is compatible with 0.7 — the reference parser implements stripping downstream. **No grammar.js change required.** A corpus entry locking this in is possible (it parses green today) but was deliberately NOT added: the case's input contains a trailing space, which editor "strip trailing whitespace on save" would silently flip to a red suite — the exact hazard § 5.6 describes. Recorded here instead.

## 8. 0.7.0 items with no grammar impact (checked, no action)

- **§ 6.15 `InvalidUtf8`** — a byte-level check that must happen "before any line-oriented or grammar-level processing". Tree-sitter receives already-valid UTF-8 by ABI; this is not expressible in `grammar.js` and belongs to the embedding parser. No action.
- **§ 5.2 rule 14** (a recognised escape forces String classification ahead of keyword/number) — semantic, decided on the decoded value; the CST already exposes `escape_sequence` nodes for the reference parser to key off. No action.
- **§ 6.13 `BadEscapeSequence` taxonomy** (malformed `\u`, lone surrogates) — error naming; see G2 for the one structural piece.
- **Writer-side 0.7 items** — § 5.9.0 representable Values, § 5.9.8 float boundaries/zero, § 5.9.10 key re-escaping (quoted-form preference), § 5.9.12 first-output-byte guard, § 8 numeric-domain caveats: all canonical-writer concerns; no parse-side effect.
- **Stale doc comments (cosmetic, for whichever task touches the file next):** `grammar.js:4` still points at the 0.6 spec; `src/scanner.c:8` still lists the removed `:i`/`:f` markers among the separators `_marker_ws` follows. No behaviour impact.

## 9. Where `\uXXXX` is and is not recognised (boundary summary, per § 3.7.1)

| Context | 0.7.0 | Grammar today |
|---|---|---|
| bare key segment | processed (decoded cp never re-examined structurally) | not recognised — parse ERROR (`a\u0041b: 1`) |
| quoted key segment | processed | no quoted segments exist (G1) + no `\u` token (G2) |
| inline scalar value | processed; forces String | not recognised — parse ERROR (`k: {x: A\u0041B}`) |
| whole-line scalar value | NOT processed — literal | matches (observed `(scalar)`; corpus entry added) |
| multi-line `((…))`/`(…)` content | NOT processed — verbatim | matches structurally (`multiline_content_line` is opaque) |
| comments | NOT processed | matches (`comment` token is opaque) |

## 10. Corpus

**Added by this audit** (the only corpus change; suite 55/55 green): one entry in `test/corpus/escape_sequences.txt` — "Whole-line scalar value: backslash-u sequence is literal content (spec 0.7 § 3.7 boundary — no escape processing here)" with input `a: \u0041` and expected `(scalar)`. Chosen because it **currently parses correctly** and was untested; it pins the not-processed boundary that G2's fix must not disturb.

**`test/corpus/typed_markers.txt` verdict: misnamed, NOT stale.** Its single case is titled "Raw string marker (spec 0.5.0 — only :: remains)" and its content is three `::` raw-marker pairs (`pattern:: [a-z]+`, `ipv6:: [::1]:8080`, `template:: {issue.id}.tpl`) with an all-`sep_raw`/`raw_scalar` expected tree. The removed `:i`/`:f` markers appear nowhere in it, and the test passes. The file documents the *survivor* of the 0.5.0 marker removal; only its filename evokes the removed feature. A rename to e.g. `raw_markers.txt` would be cosmetic; left to a maintainer.

**Regression-test ownership once the fixes land** (suggested homes; all currently-failing inputs must stay OUT of the corpus until their fix lands — a red suite is not a TODO):

| Gap | Suggested corpus homes |
|---|---|
| G1 quoted keys | `edge_keys.txt` (three delimiters, positional rule, `"a" "b"` InvalidKey, escaped delimiter); `dotted_keys.txt` (`"a.b"` flatness, `a."b.c".d`); `inline_compounds.txt` (`{"a}b": 1, c: 2}`, `{"a,b": 1, c: 2}` opacity); `basic.txt` (`"port": 1`); `spec-conformance.txt` (`'tis the season: fa` root fallback) |
| G2 escapes | `escape_sequences.txt` (`\uXXXX` in key and inline value; surrogate pair; lone-surrogate `:error`; `\"`/`\'`/`` \` `` in keys and values); whole-line negative already present |
| G3 whitespace | `edge_keys.txt` + `mixed.txt` (VT/FF key content; NBSP/U+3000 indentation; `a:<NBSP>1`; NBSP-only blank line; closer with NBSP) |
| G4 BOM | `spec-conformance.txt` (leading-BOM document) |
| G5 root kind | `spec-conformance.txt` (`:error` entries: scalar-after-pair, orphan-after-inline; shape entry: pair-shaped line in Array root) |
| G6 CR endings | `basic.txt` (CR-only and mixed CR/LF/CRLF document) |

Caveat for G3/G4/G6 homes: the relevant bytes (NBSP, VT, FF, BOM, bare CR) are invisible or invisible-ish in a text corpus file and some editors/tools "helpfully" strip them (BOM, trailing whitespace, CRLF); if the suite must be robust for humans, prefer byte-level fixtures outside the corpus for those, and keep corpus entries only for the visibly-safe cases.

## 11. Queued-task ownership and open human decisions

- **Quoted keys task:** G1 (all of § 1).
- **\uXXXX + BOM task:** G2 (§ 2) and G4 (§ 4).
- **Regenerate-and-green pass:** G6 (§ 6), plus the actual `tree-sitter generate` + suite-green gate after each of the above lands.
- **Human decision 1 — G3 ownership:** the whitespace-set gap (§ 3) is in neither the quoted-keys nor the \uXXXX+BOM scope as named. Suggestion: fold it into the \uXXXX + BOM task (same lexical-foundation character, touches the same rules) or spin it off; either way `src/scanner.c` C edits are required.
- **Human decision 2 — G2 lone surrogates:** reject at the syntax layer (needs an external-scanner addition to `src/scanner.c`) or accept `\uD800`-style escapes syntactically and let the reference parser raise `BadEscapeSequence`. The spec outcome is the same; the CST and diagnosis differ.
- **Human decision 3 — G5:** keep the documented root-kind delegation to the reference parser (status quo, cheapest, already written down in `grammar.js:79-82`) or enforce it (requires a stateful external scanner). G1's `'tis the season` breaking change interacts with this decision.

## 12. External-scanner summary

- **No external scanner needed:** G1 (quoted-key token is a plain regex token; opacity falls out of single-token consumption), G3 (hard-coded 25-cp classes; existing scanner.c byte-set edits only), G4 (`optional(/\uFEFF/)`), G6 (regex sweep).
- **External scanner (new logic in C) required if:** G2's lone-surrogate rejection is wanted at parse time (cross-token surrogate-pairing state); G5's root-kind enforcement is ever wanted (document-state tracking). Both alternatives (semantic-layer rejection / continued delegation) avoid new scanner code — that is the decision in § 11.
- The existing external scanner (`_marker_ws`, `_strict_eol`, `_stripped_close`, `_verbatim_close`) stays; G3 widens its accepted byte sets.

## 13. Provenance

- CLI: `tree-sitter` 0.26.13 — the version range declared in `package.json` (`^0.26.0`), installed into gitignored `node_modules/`; no other environment change.
- All demo inputs were byte-exact files under gitignored `build/scratch/` (deleted after the audit; nothing under `build/` is committable).
- `spec/` submodule: `04f867fbb338f97f3d3ec30d74af8373ff42d8b8` = tag `v0.7.0` (verified with `git -C spec log -1` and `git -C spec describe --tags`).
- Suite: 54/54 green before; 55/55 green after this audit. `grammar.js` and `src/` untouched; `tree-sitter generate` not run; no version fields touched.
