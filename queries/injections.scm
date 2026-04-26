; Language injections for Ktav multi-line strings.
;
; Currently empty. Future versions may inject e.g. JSON / YAML / regex
; into multi-line string bodies based on the key name (`pattern`,
; `body`, `template`, …) — see the discussion in the spec rationale.
;
; Example (commented out — uncomment once a stable convention emerges):
;
; ((multiline_stripped) @injection.content
;   (#set! injection.language "json"))
