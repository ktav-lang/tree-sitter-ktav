import { Parser, Language, Query } from './web-tree-sitter/web-tree-sitter.js';
import { DEMO, verdict } from './shared.mjs';

const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

// Visible glyphs for whitespace; the rest of the § 3.3 set is shown as `°`.
const WS_GLYPH = { '\t': '→', ' ': '·', '\r': '␍', '\uFEFF': '⟨BOM⟩', '\0': '␀' };
const UNI_WS = /[\u000B\u000C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;

let current = null; // fixture on screen, or null for free text
let selected = null; // [start, end) range hovered in the tree view

await Parser.init({ locateFile: (file) => `./web-tree-sitter/${file}` });
const language = await Language.load('./out/tree-sitter-ktav.wasm');
const parser = new Parser();
parser.setLanguage(language);
const data = await (await fetch('./out/data.json')).json();
const query = new Query(language, data.highlights);

function errorsOf(root) {
  const out = [];
  const walk = (node) => {
    if (node.isError || node.isMissing) out.push(node);
    if (node.hasError) for (const child of node.children) walk(child);
  };
  walk(root);
  return out;
}

const codePoint = (ch) => `U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`;

function glyph(ch, showWs) {
  if (!showWs) return esc(ch);
  if (ch === '\n') return '<span class="ws">↵</span>\n';
  if (ch in WS_GLYPH) return `<span class="ws" title="${codePoint(ch)}">${WS_GLYPH[ch]}</span>`;
  if (UNI_WS.test(ch)) return `<span class="ws" title="${codePoint(ch)}">°</span>`;
  return esc(ch);
}

function renderView(text, tree) {
  const n = text.length;
  const cls = new Array(n).fill('');
  const painted = new Set();
  // Outer nodes first so inner captures overwrite them.
  const captures = query.captures(tree.rootNode).sort((a, b) =>
    a.node.startIndex - b.node.startIndex
    || (b.node.endIndex - b.node.startIndex) - (a.node.endIndex - a.node.startIndex));
  for (const { name, node } of captures) {
    const key = `${node.startIndex}:${node.endIndex}`;
    if (painted.has(key)) continue; // the first pattern wins for the same node
    painted.add(key);
    const c = `c-${name.replace(/\./g, '-')}`;
    for (let i = node.startIndex; i < node.endIndex && i < n; i++) cls[i] = c;
  }
  const err = new Array(n).fill(false);
  const missingAt = new Map();
  for (const e of errorsOf(tree.rootNode)) {
    if (e.isMissing) missingAt.set(e.startIndex, `${missingAt.get(e.startIndex) || ''}⟨missing ${e.type}⟩`);
    else for (let i = e.startIndex; i < Math.max(e.endIndex, e.startIndex + 1) && i < n; i++) err[i] = true;
  }
  const showWs = $('showws').checked;
  let html = '';
  for (let i = 0; i <= n; i++) {
    if (missingAt.has(i)) html += `<span class="missing">${esc(missingAt.get(i))}</span>`;
    if (i === n) break;
    const inSel = selected && i >= selected[0] && i < selected[1];
    const classes = [cls[i], err[i] ? 'err' : '', inSel ? 'sel' : ''].filter(Boolean).join(' ');
    const g = glyph(text[i], showWs);
    html += classes ? `<span class="${classes}">${g}</span>` : g;
  }
  $('view').innerHTML = html;
}

function renderTree(tree) {
  const anon = $('anon').checked;
  const rows = [];
  const walk = (node, depth, field) => {
    if (!node.isNamed && !anon && !node.isMissing) return;
    const { startPosition: s, endPosition: e } = node;
    const label = node.isMissing ? `<span class="e">MISSING ${esc(node.type)}</span>`
      : node.isError ? '<span class="e">ERROR</span>'
      : node.isNamed ? esc(node.type) : `<span class="anon">"${esc(node.type)}"</span>`;
    const text = node.childCount === 0 && node.isNamed ? ` <span class="r">${esc(JSON.stringify(node.text))}</span>` : '';
    rows.push(`<div data-s="${node.startIndex}" data-e="${node.endIndex}">${'  '.repeat(depth)}`
      + `${field ? `<span class="f">${field}:</span> ` : ''}${label} `
      + `<span class="r">[${s.row}:${s.column}–${e.row}:${e.column}]</span>${text}</div>`);
    for (let i = 0; i < node.childCount; i++) walk(node.child(i), depth + 1, node.fieldNameForChild(i));
  };
  walk(tree.rootNode, 0, null);
  $('tree').innerHTML = rows.join('');
}

function update() {
  const text = $('src').value;
  const tree = parser.parse(text);
  const errors = errorsOf(tree.rootNode);
  renderView(text, tree);
  renderTree(tree);
  const edited = current && text !== current.text;
  const v = current && !edited ? verdict(current, tree.rootNode.hasError) : null;
  const parts = [errors.length ? `parse errors: ${errors.length}` : 'no parse errors'];
  if (v !== null) parts.push(v ? '✓ as expected' : '✗ differs from the expectation');
  const status = $('status');
  status.textContent = parts.join(' · ');
  status.className = v === false || (v === null && errors.length) ? 'bad' : 'ok';
  renderInfo(edited);
  tree.delete();
}

function renderInfo(edited) {
  if (!current) {
    $('info').innerHTML = '<span class="muted">Free text. Pick a spec 0.8 fixture from the list or press “Run the whole corpus”.</span>';
    return;
  }
  const expect = {
    clean: 'must parse without errors',
    error: `must produce a syntax error (${esc(current.expectedError || '?')})`,
    any: `${esc(current.expectedError)} is a semantic error the grammar cannot detect; a parse error is not required`,
  }[current.expect];
  const oracleName = current.path.replace(/(\.canonical)?\.ktav$/, '.json');
  $('info').innerHTML = `<b>${esc(current.category)}/${esc(current.path)}</b> — ${expect}`
    + (current.lossy ? ' <span class="bad">(not valid UTF-8: shown with replacement characters)</span>' : '')
    + (edited ? ' <span class="muted">(text edited — expectation check disabled)</span>' : '')
    + (current.oracle ? `<pre>expected (${esc(oracleName)}): ${esc(current.oracle)}</pre>` : '');
}

function open(fixture) {
  current = fixture;
  selected = null;
  $('src').value = fixture ? fixture.text : DEMO;
  $('fixture').value = fixture ? String(data.fixtures.indexOf(fixture)) : '';
  update();
}

function fillSelect() {
  const filter = $('filter').value.trim().toLowerCase();
  const sel = $('fixture');
  sel.innerHTML = '<option value="">— demo document —</option>';
  const groups = {};
  data.fixtures.forEach((f, i) => {
    if (filter && !`${f.category}/${f.path}`.toLowerCase().includes(filter)) return;
    (groups[f.category] ||= []).push(`<option value="${i}">${esc(f.path)}</option>`);
  });
  for (const [cat, opts] of Object.entries(groups)) {
    sel.insertAdjacentHTML('beforeend', `<optgroup label="${esc(cat)} (${opts.length})">${opts.join('')}</optgroup>`);
  }
  if (current) sel.value = String(data.fixtures.indexOf(current));
}

function runAll() {
  const stats = {};
  const failures = [];
  const semanticAccepted = [];
  for (const f of data.fixtures) {
    const tree = parser.parse(f.text);
    const hasError = tree.rootNode.hasError;
    tree.delete();
    const s = (stats[f.category] ||= { total: 0, ok: 0, bad: 0 });
    s.total++;
    if (verdict(f, hasError)) s.ok++; else { s.bad++; failures.push(f); }
    if (f.expect === 'any' && !hasError) semanticAccepted.push(f);
  }
  const link = (f) => `<a data-i="${data.fixtures.indexOf(f)}">${esc(f.category)}/${esc(f.path)}</a>`
    + (f.expectedError ? ` <span class="muted">${esc(f.expectedError)}</span>` : '');
  const rows = Object.entries(stats).map(([c, s]) =>
    `<tr><td>${esc(c)}</td><td>${s.total}</td><td class="ok">${s.ok}</td><td class="${s.bad ? 'bad' : 'muted'}">${s.bad}</td></tr>`);
  $('report').innerHTML = `<h3>spec 0.8 corpus: ${failures.length
    ? `<span class="bad">${failures.length} unexpected result(s)</span>`
    : '<span class="ok">every fixture as expected</span>'}</h3>
    <table><tr><th>category</th><th>files</th><th>as expected</th><th>unexpected</th></tr>${rows.join('')}</table>
    ${failures.length ? `<p>Unexpected:</p><ul>${failures.map((f) => `<li>${link(f)}</li>`).join('')}</ul>` : ''}
    <p class="muted">Invalid fixtures with a semantic error that the grammar accepts, as it should: ${semanticAccepted.length}</p>
    <ul>${semanticAccepted.map((f) => `<li>${link(f)}</li>`).join('')}</ul>`;
}

$('fixture').addEventListener('change', (e) => open(e.target.value === '' ? null : data.fixtures[Number(e.target.value)]));
$('filter').addEventListener('input', fillSelect);
$('demo').addEventListener('click', () => open(null));
$('runall').addEventListener('click', runAll);
$('src').addEventListener('input', () => { selected = null; update(); });
$('showws').addEventListener('change', update);
$('anon').addEventListener('change', update);
$('report').addEventListener('click', (e) => {
  const i = e.target.closest('a[data-i]')?.dataset.i;
  if (i !== undefined) { open(data.fixtures[Number(i)]); window.scrollTo({ top: 0 }); }
});
$('tree').addEventListener('mouseover', (e) => {
  const row = e.target.closest('div[data-s]');
  if (!row) return;
  const range = [Number(row.dataset.s), Number(row.dataset.e)];
  if (selected && selected[0] === range[0] && selected[1] === range[1]) return;
  selected = range;
  const tree = parser.parse($('src').value);
  renderView($('src').value, tree);
  tree.delete();
});

fillSelect();
open(null);
