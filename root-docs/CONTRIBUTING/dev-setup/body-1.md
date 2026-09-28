>>>>> lang=en
## Dev setup

You need:

- Node **24+** (required by the documentation tooling).
- A Rust toolchain via [`rustup`](https://rustup.rs/) (for the Rust
  bindings).
- `git`.

### Build & test

```bash
npm ci                       # installs the locked tree-sitter-cli 0.26.8
npx tree-sitter generate     # regenerates src/parser.c and related files
npx tree-sitter test         # runs the tree-sitter corpus
cargo test                   # Rust tests, including spec conformance
npm test                     # Node binding tests (rebuilds the addon)
```

Initialize the `spec` submodule (`git submodule update --init --recursive`)
before `cargo test`; the Rust conformance tests read its pinned corpus.

>>>>> lang=ru
## Dev-окружение

Нужно:

- Node **24+** (требуется инструментам документации).
- Rust toolchain через [`rustup`](https://rustup.rs/) (для Rust-
  биндингов).
- `git`.

### Сборка и тесты

```bash
npm ci                       # устанавливает tree-sitter-cli 0.26.8 из lock-файла
npx tree-sitter generate     # обновляет src/parser.c и связанные файлы
npx tree-sitter test         # запускает корпус tree-sitter
cargo test                   # тесты Rust, включая проверку соответствия спекам
npm test                     # тесты Node-биндинга (пересобирает аддон)
```

Перед `cargo test` инициализируйте субмодуль `spec` командой
`git submodule update --init --recursive`: Rust-тесты соответствия используют
закреплённый в нём корпус.

>>>>> lang=zh
## 开发环境

你需要:

- Node **24+**（文档工具要求此版本）。
- 通过 [`rustup`](https://rustup.rs/) 安装的 Rust 工具链(用于
  Rust 绑定)。
- `git`。

### 构建与测试

```bash
npm ci                       # 安装 lock 文件固定的 tree-sitter-cli 0.26.8
npx tree-sitter generate     # 重新生成 src/parser.c 等文件
npx tree-sitter test         # 运行 tree-sitter 语料库
cargo test                   # 运行 Rust 测试，包括规范一致性测试
npm test                     # 运行 Node 绑定测试（会重新构建 addon）
```

运行 `cargo test` 前，请执行 `git submodule update --init --recursive`
初始化 `spec` 子模块；Rust 规范一致性测试需要其中固定版本的语料库。

