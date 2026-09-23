>>>>> lang=en
### Node.js (`tree-sitter` package)

```bash
npm install tree-sitter tree-sitter-ktav
```

```js
const Parser = require("tree-sitter");
const Ktav   = require("tree-sitter-ktav");

const parser = new Parser();
parser.setLanguage(Ktav);

const tree = parser.parse("name: Russia\nport: 8080\n");
console.log(tree.rootNode.toString());
```

>>>>> lang=ru
### Node.js (пакет `tree-sitter`)

```bash
npm install tree-sitter tree-sitter-ktav
```

```js
const Parser = require("tree-sitter");
const Ktav   = require("tree-sitter-ktav");

const parser = new Parser();
parser.setLanguage(Ktav);

const tree = parser.parse("name: Russia\nport: 8080\n");
console.log(tree.rootNode.toString());
```

>>>>> lang=zh
### Node.js（`tree-sitter` 包）

```bash
npm install tree-sitter tree-sitter-ktav
```

```js
const Parser = require("tree-sitter");
const Ktav   = require("tree-sitter-ktav");

const parser = new Parser();
parser.setLanguage(Ktav);

const tree = parser.parse("name: Russia\nport: 8080\n");
console.log(tree.rootNode.toString());
```

