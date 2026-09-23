>>>>> lang=en
## Dev setup

You need:

- Node **18+**.
- A Rust toolchain via [`rustup`](https://rustup.rs/) (for the Rust
  bindings).
- `git`.

### Build & test

```bash
npm install
npx tree-sitter generate     # generates src/parser.c
npx tree-sitter test         # runs the corpus
```

>>>>> lang=ru
## Dev-окружение

Нужно:

- Node **18+**.
- Rust toolchain через [`rustup`](https://rustup.rs/) (для Rust-
  биндингов).
- `git`.

### Сборка и тесты

```bash
npm install
npx tree-sitter generate     # генерирует src/parser.c
npx tree-sitter test         # запускает корпус
```

>>>>> lang=zh
## 开发环境

你需要:

- Node **18+**。
- 通过 [`rustup`](https://rustup.rs/) 安装的 Rust 工具链(用于
  Rust 绑定)。
- `git`。

### 构建与测试

```bash
npm install
npx tree-sitter generate     # 生成 src/parser.c
npx tree-sitter test         # 运行语料库
```

