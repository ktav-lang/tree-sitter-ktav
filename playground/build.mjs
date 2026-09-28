// Builds the playground inputs: the grammar as WASM and the spec 0.8 corpus as data.json.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const corpus = path.join(repo, 'spec/versions/0.8/tests');
const CATEGORIES = ['valid', 'invalid', 'parseable-unrepresentable', 'strict-lossy'];
// Invalid categories a context-free grammar cannot detect.
const NON_SYNTAX = ['DuplicateKey', 'KeyPathConflict', 'InvalidUtf8'];

if (!fs.existsSync(path.join(corpus, 'manifest.json'))) {
  console.error('spec corpus missing: run `git submodule update --init --recursive`');
  process.exit(1);
}

const out = path.join(here, 'out');
fs.mkdirSync(out, { recursive: true });
const wasm = path.join(out, 'tree-sitter-ktav.wasm');
const cli = createRequire(import.meta.url).resolve('tree-sitter-cli/cli.js');
const built = spawnSync(process.execPath, [cli, 'build', '--wasm', '-o', wasm], { cwd: repo, stdio: 'inherit' });
if (built.status !== 0) process.exit(built.status ?? 1);

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

const fixtures = [];
for (const category of CATEGORIES) {
  for (const file of walk(path.join(corpus, category)).filter((f) => f.endsWith('.ktav')).sort()) {
    const bytes = fs.readFileSync(file);
    let lossy = false;
    try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { lossy = true; }
    const oraclePath = file.replace(/(\.canonical)?\.ktav$/, '.json');
    const oracle = fs.existsSync(oraclePath) ? fs.readFileSync(oraclePath, 'utf8') : null;
    const expectedError = category === 'invalid' && oracle ? JSON.parse(oracle).expected_error : null;
    fixtures.push({
      category,
      path: path.relative(corpus, file).split(path.sep).join('/'),
      text: new TextDecoder('utf-8').decode(bytes),
      lossy,
      oracle,
      expect: category !== 'invalid' ? 'clean' : NON_SYNTAX.includes(expectedError) ? 'any' : 'error',
      expectedError,
    });
  }
}

const highlights = fs.readFileSync(path.join(repo, 'queries/highlights.scm'), 'utf8');
fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify({ highlights, fixtures }));
console.log(`playground: ${fixtures.length} fixtures, grammar at ${path.relative(repo, wasm)}`);
