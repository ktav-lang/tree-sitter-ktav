>>>>> lang=en
## Building from source

```bash
git clone https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm install
npx tree-sitter generate     # writes src/parser.c
npx tree-sitter test         # runs the corpus
```

The generated `src/parser.c`, `src/grammar.json`, `src/node-types.json`,
and `src/tree_sitter/*` are checked into git per tree-sitter convention,
so consumers do not need the CLI to build.

>>>>> lang=ru
## Сборка из исходников

```bash
git clone https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm install
npx tree-sitter generate     # writes src/parser.c
npx tree-sitter test         # runs the corpus
```

Файлы `src/parser.c`, `src/grammar.json`, `src/node-types.json` и
`src/tree_sitter/*` коммитятся в git по соглашению tree-sitter, так
что потребителям грамматики не нужен CLI для сборки.

>>>>> lang=zh
## 从源码构建

```bash
git clone https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm install
npx tree-sitter generate     # writes src/parser.c
npx tree-sitter test         # runs the corpus
```

`src/parser.c`、`src/grammar.json`、`src/node-types.json` 与
`src/tree_sitter/*` 按 tree-sitter 惯例已纳入 git，下游消费者无需
CLI 即可构建。

