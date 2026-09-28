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

### Playground

`npm run playground` builds the grammar to WASM and serves a browser
page at <http://127.0.0.1:8123/>: an editable source, highlighting from
`queries/highlights.scm` with parse errors marked, and the syntax tree.
Any spec 0.8 fixture can be opened there and checked against its
expectation, or the whole corpus run at once. `npm run playground:check`
runs the same checks headlessly. The page lives in `playground/`; its
build output goes to the git-ignored `playground/out/`.

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

### Песочница

`npm run playground` собирает грамматику в WASM и открывает страницу
по адресу <http://127.0.0.1:8123/>: редактируемый исходник, подсветку
из `queries/highlights.scm` с отмеченными ошибками разбора и дерево
разбора. Там можно открыть любую фикстуру spec 0.8 и сверить её с
ожиданием или прогнать весь корпус разом. `npm run playground:check`
выполняет те же проверки без браузера. Страница лежит в `playground/`,
результат сборки — в игнорируемом git каталоге `playground/out/`.

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

### 演练场

`npm run playground` 会把语法构建为 WASM，并在
<http://127.0.0.1:8123/> 提供一个浏览器页面：可编辑的源码、按
`queries/highlights.scm` 的高亮（标出解析错误）以及语法树。可以在其中
打开任意 spec 0.8 样例并与其预期结果核对，或一次运行整个语料库。
`npm run playground:check` 在无浏览器环境下执行同样的检查。页面位于
`playground/`，构建产物输出到被 git 忽略的 `playground/out/`。

