// Headless check of what the page shows: the demo parses cleanly and every
// corpus fixture meets its expectation under the WASM build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Parser, Language, Query } from 'web-tree-sitter';
import { DEMO, verdict } from './shared.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
await Parser.init();
const language = await Language.load(path.join(here, 'out/tree-sitter-ktav.wasm'));
const parser = new Parser();
parser.setLanguage(language);
const data = JSON.parse(fs.readFileSync(path.join(here, 'out/data.json'), 'utf8'));
new Query(language, data.highlights).delete();

let failures = 0;
const demo = parser.parse(DEMO);
if (demo.rootNode.hasError) {
  failures++;
  console.error(`demo document has parse errors:\n${demo.rootNode}`);
}
demo.delete();
for (const fixture of data.fixtures) {
  const tree = parser.parse(fixture.text);
  if (!verdict(fixture, tree.rootNode.hasError)) {
    failures++;
    console.error(`unexpected result: ${fixture.category}/${fixture.path}`);
  }
  tree.delete();
}
console.log(`playground check: demo + ${data.fixtures.length} fixtures, ${failures} failure(s)`);
process.exit(failures ? 1 : 0);
