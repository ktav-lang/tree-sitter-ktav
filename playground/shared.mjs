// Shared by the page and the headless check.

// Sample document covering the syntax added between spec 0.6 and 0.8.
export const DEMO = `## Ktav 0.8 — tree-sitter-ktav playground
name: tree-sitter-ktav
title: Ktav — כְּתָב
version: 0.8.0
port: 8080
ratio: 0.75
avogadro: 6.022e23
mask: 0xFF
perms: 0o755
flags: 0b1010
population: 1_000_000
zip: 01234
enabled: true
tls: false
proxy: null
not_keyword: truex
empty:
raw:: {not an object}
server.host: localhost
server.port: 443
"dotted.key": one flat key
'single quoted': 1
\`back tick\`: 2
path\\.with\\.dots: escaped dots
unicode\\u0041key: A
emoji: [\\uD83D\\uDE00, \\u0041]
greeting: hello, world
limits: {cpu: 2, memory: 512Mi, burst: true, ratio: 0.5, zip: 007, note: a\\,b}
tags: [web, api, 42, 1.5, null, [nested, 1]]
raw_inline: {glob:: *.ktav, re:: \\[a-z\\]+}
servers: [
    {
        host: a.example
        port: 1080
    }
    {
        host: b.example
        port: 1080
    }
]
matrix: [
    [1, 2]
    [3, 4]
]
banner: (
    Stripped multi-line text.
    The common indent is removed.
)
script: ((
  kept   exactly
    as written
))
nothing: {}
none: []
blank: ()
`;

// Whether a parse result meets a fixture's expectation.
export function verdict(fixture, hasError) {
  if (fixture.expect === 'clean') return !hasError;
  if (fixture.expect === 'error') return hasError;
  return true; // semantic-only invalid fixture: the grammar may accept it
}
