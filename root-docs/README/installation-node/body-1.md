>>>>> lang=en
### Node.js (`tree-sitter` package)

The npm package ships native source, not prebuilt `.node` binaries.
Installation needs a C/C++ build toolchain and Python for `node-gyp`;
the generated parser is included, so the Tree-sitter CLI is not needed.

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

Пакет npm содержит исходники нативного модуля, а не готовые `.node`-бинарники.
Для установки нужны компилятор C/C++ и Python для `node-gyp`;
сгенерированный парсер уже включён, поэтому Tree-sitter CLI не нужен.

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

npm 包提供原生源码，而不是预编译的 `.node` 二进制文件。
安装需要 C/C++ 编译工具链及供 `node-gyp` 使用的 Python；
包已包含生成的解析器，因此无需 Tree-sitter CLI。

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

