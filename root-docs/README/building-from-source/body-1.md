>>>>> lang=en
## Building from source

```bash
git clone --recurse-submodules https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm ci                       # installs the locked tree-sitter-cli 0.26.8
npx tree-sitter generate     # regenerates src/parser.c and related files
npx tree-sitter test         # runs the tree-sitter corpus
cargo test                   # Rust tests, including spec conformance
```

The generated `src/parser.c`, `src/grammar.json`, `src/node-types.json`,
and `src/tree_sitter/*` are checked into git per tree-sitter convention,
so consumers do not need the CLI to build.

>>>>> lang=ru
## Сборка из исходников

```bash
git clone --recurse-submodules https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm ci                       # устанавливает tree-sitter-cli 0.26.8 из lock-файла
npx tree-sitter generate     # обновляет src/parser.c и связанные файлы
npx tree-sitter test         # запускает корпус tree-sitter
cargo test                   # тесты Rust, включая проверку соответствия спекам
```

Файлы `src/parser.c`, `src/grammar.json`, `src/node-types.json` и
`src/tree_sitter/*` коммитятся в git по соглашению tree-sitter, так
что потребителям грамматики не нужен CLI для сборки.

>>>>> lang=zh
## 从源码构建

```bash
git clone --recurse-submodules https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm ci                       # 安装 lock 文件固定的 tree-sitter-cli 0.26.8
npx tree-sitter generate     # 重新生成 src/parser.c 等文件
npx tree-sitter test         # 运行 tree-sitter 语料库
cargo test                   # 运行 Rust 测试，包括规范一致性测试
```

`src/parser.c`、`src/grammar.json`、`src/node-types.json` 与
`src/tree_sitter/*` 按 tree-sitter 惯例已纳入 git，下游消费者无需
CLI 即可构建。

