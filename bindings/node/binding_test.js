const assert = require("node:assert/strict");
const test = require("node:test");
const Parser = require("tree-sitter");

const grammar = require("./");

test("Node addon exports the Ktav language", () => {
  assert.equal(grammar.name, "ktav");
  assert.ok(grammar.language);
  assert.ok(Array.isArray(grammar.nodeTypeInfo));
  assert.ok(grammar.nodeTypeInfo.length > 0);

  const parser = new Parser();
  parser.setLanguage(grammar);
  const tree = parser.parse("name: web\nport: 8080\n");
  assert.equal(tree.rootNode.hasError, false);
});

test("0.8 leading-zero values use string nodes", () => {
  const parser = new Parser();
  parser.setLanguage(grammar);
  const tree = parser.parse("zip: 01234\nver: 01.5\ncount: 1234\nsub: 0.5\n");
  assert.equal(tree.rootNode.hasError, false);
  assert.deepEqual(
    tree.rootNode.namedChildren.map((node) => node.childForFieldName("value").type),
    ["scalar", "scalar", "integer", "float"],
  );
});
