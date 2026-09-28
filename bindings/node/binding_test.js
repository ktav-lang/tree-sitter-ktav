const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
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

test("inline numeric nodes do not depend on token length", () => {
  const parser = new Parser();
  parser.setLanguage(grammar);
  for (const value of [
    `0.${"0".repeat(254)}`,
    `0.${"0".repeat(255)}`,
    `0.${"0".repeat(300)}`,
    `1e+${"0".repeat(300)}`,
  ]) {
    const tree = parser.parse(`whole: ${value}\ninline: [${value}]\n`);
    assert.equal(tree.rootNode.hasError, false);
    const whole = tree.rootNode.namedChildren[0].childForFieldName("value");
    const inline = tree.rootNode.namedChildren[1]
      .childForFieldName("value").namedChildren[0].namedChildren[0];
    assert.equal(whole.type, "float");
    assert.equal(inline.type, "float", `inline ${value.length}-byte value`);
  }

  const notNumber = `0.${"0".repeat(300)}x`;
  const tree = parser.parse(`inline: [${notNumber}]\n`);
  assert.equal(tree.rootNode.hasError, false);
  assert.equal(
    tree.rootNode.namedChildren[0].childForFieldName("value").namedChildren[0].namedChildren[0].type,
    "inline_scalar",
  );
});

test("whole-line keywords require the complete trimmed value", () => {
  const parser = new Parser();
  parser.setLanguage(grammar);
  for (const value of ["truex", "falsehood", "nullish", "true1", "null_", "true x"]) {
    for (const suffix of ["\n", "   \n", ""]) {
      const tree = parser.parse(`value: ${value}${suffix}`);
      assert.equal(tree.rootNode.hasError, false, `${value}${suffix}: ${tree.rootNode}`);
      assert.equal(tree.rootNode.namedChildren[0].childForFieldName("value").type, "scalar");
    }
  }
  for (const value of ["true", "false", "null"]) {
    for (const suffix of ["\n", "   \n", "\u00A0\n", "\r", ""]) {
      const tree = parser.parse(`value: ${value}${suffix}`);
      assert.equal(tree.rootNode.hasError, false, `${value}${suffix}: ${tree.rootNode}`);
      assert.equal(tree.rootNode.namedChildren[0].childForFieldName("value").type, "keyword");
    }
  }
  for (const [source, kind] of [
    ["true", "keyword"],
    ["true   ", "keyword"],
    ["truex", "top_scalar"],
    ["truex   ", "top_scalar"],
  ]) {
    const tree = parser.parse(source);
    assert.equal(tree.rootNode.hasError, false, `${source}: ${tree.rootNode}`);
    assert.equal(tree.rootNode.namedChildren[0].childForFieldName("value").type, kind);
  }
});

test("keyword nodes span only the keyword", () => {
  const parser = new Parser();
  parser.setLanguage(grammar);
  for (const value of ["true", "false", "null"]) {
    for (const suffix of ["\n", "   \n", " \r\n", "\r", ""]) {
      for (const source of [
        `${value}${suffix}`,
        `x\n${value}${suffix}`,
        `a: ${value}${suffix}`,
        `a: [\n  ${value}${suffix}${suffix ? "" : "\n"}]\n`,
      ]) {
        const tree = parser.parse(source);
        assert.equal(tree.rootNode.hasError, false, `${JSON.stringify(source)}: ${tree.rootNode}`);
        const keywords = tree.rootNode.descendantsOfType(`kw_${value}`);
        assert.equal(keywords.length, 1, JSON.stringify(source));
        assert.equal(keywords[0].text, value, JSON.stringify(source));
      }
    }
  }
});

test("editor queries cover raw values and inline object scopes", () => {
  const parser = new Parser();
  parser.setLanguage(grammar);
  const tree = parser.parse("raw:: value\nmeta: {pattern:: literal, nested: {id: 0123}}\nlist: [one, [two]]\nzero: 0123\ncount: 1234\n");
  assert.equal(tree.rootNode.hasError, false);

  const queriesDir = path.resolve(__dirname, "../../queries");
  const highlights = new Parser.Query(
    grammar,
    fs.readFileSync(path.join(queriesDir, "highlights.scm"), "utf8"),
  );
  const highlightCaptures = highlights.captures(tree.rootNode);
  assert.equal(
    highlightCaptures.filter(({ name, node }) => name === "string.special" && node.type === "raw_scalar").length,
    1,
  );
  assert.ok(highlightCaptures.some(({ name, node }) =>
    name === "string.special" && node.type === "inline_raw_scalar" && node.text === "literal"));
  assert.ok(highlightCaptures.some(({ name, node }) => name === "string" && node.type === "scalar" && node.text === "0123\n"));
  assert.ok(highlightCaptures.some(({ name, node }) => name === "number" && node.type === "integer" && node.text === "1234\n"));

  const inlineBracketCaptures = highlightCaptures.filter(({ name, node }) =>
    name === "punctuation.bracket" && ["{", "}", "[", "]"].includes(node.type));
  assert.deepEqual(
    inlineBracketCaptures.map(({ node }) => node.text).sort(),
    ["[", "[", "]", "]", "{", "{", "}", "}"],
  );
  assert.ok(!highlightCaptures.some(({ name, node }) =>
    name === "punctuation.bracket" && ["inline_object", "inline_array"].includes(node.type)));

  const locals = new Parser.Query(
    grammar,
    fs.readFileSync(path.join(queriesDir, "locals.scm"), "utf8"),
  );
  const localCaptures = locals.captures(tree.rootNode);
  assert.ok(localCaptures.some(({ name, node }) =>
    name === "local.scope" && node.type === "inline_object" && node.text.includes("pattern:: literal")));
  assert.ok(localCaptures.some(({ name, node }) =>
    name === "local.scope" && node.type === "nested_inline_object" && node.text.includes("id: 0123")));
  const inlineDefinitions = localCaptures
    .filter(({ name }) => name === "local.definition.property")
    .map(({ node }) => node.text);
  assert.ok(inlineDefinitions.includes("pattern"));
  assert.ok(inlineDefinitions.includes("nested"));
  assert.ok(inlineDefinitions.includes("id"));
});

test("numeric edge whitespace follows the 0.8 spec whitespace set", () => {
  const parser = new Parser();
  parser.setLanguage(grammar);
  const tree = parser.parse("vt: 1\u000b\nideographic: 1\u3000");
  assert.equal(tree.rootNode.hasError, false);
  assert.deepEqual(
    tree.rootNode.namedChildren.map((node) => node.childForFieldName("value").type),
    ["integer", "integer"],
  );
});

test("root scalars and comments parse without a final newline", () => {
  const parser = new Parser();
  parser.setLanguage(grammar);
  for (const source of ["plain", "## comment", "value: 1\n## comment"]) {
    const eofTree = parser.parse(source);
    const newlineTree = parser.parse(`${source}\n`);
    assert.equal(eofTree.rootNode.hasError, false);
    assert.equal(eofTree.rootNode.toString(), newlineTree.rootNode.toString());
  }
});

test("the first content line fixes the root kind", () => {
  const parser = new Parser();
  parser.setLanguage(grammar);
  for (const source of ["a:b\n", "a:b", "'tis the season: fa\n", "plain\nhost: localhost\n", "plain\nhost: localhost"]) {
    const tree = parser.parse(source);
    assert.equal(tree.rootNode.hasError, false);
    assert.ok(tree.rootNode.namedChildren.every((node) => node.type === "top_array_item"));
  }
  assert.equal(parser.parse("a: 1\nplain\n").rootNode.hasError, true);
});
