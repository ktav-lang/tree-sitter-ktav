# 为 tree-sitter-ktav 做贡献

**Languages:** [English](CONTRIBUTING.md) · [Русский](CONTRIBUTING.ru.md) · **简体中文**

## 核心规则

### 1. 每个 bug 修复都伴随一个回归测试

发现 bug 时,**在修复之前** 先写一个复现它的测试 —— 测试在
`main` 分支上 **必须失败**,修复之后才通过。两者放在同一个 PR。

测试位于 `test/corpus/`（tree-sitter 语料库）、`tests/*.rs`（Rust 测试，
包括规范一致性测试）和 `bindings/node/binding_test.js`（Node 绑定）。

### 2. 语法跟随规范

语法面向
[`ktav-lang/spec`](https://github.com/ktav-lang/spec)。格式层面的
改动先进规范;语法随后跟进。

### 3. 一个概念一次提交

提交要保持原子:bug 修复与其测试一起、新功能与其测试一起、
重命名单独、重构单独。`git log --oneline` 应当读起来像 changelog。
不要使用 `feat:` / `fix:` 前缀。

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

## 语言政策

本仓库参与组织级三语政策(EN / RU / ZH)。每份 prose 文档都有三种
并行版本 —— 命名约定和"三份一并更新"规则见
[`ktav-lang/.github/AGENTS.md`](https://github.com/ktav-lang/.github/blob/main/AGENTS.md)。

Markdown 文件由 [polydoc](https://github.com/ktav-lang/polydoc) 从
`root-docs/` 生成：请修改其中的单元，三种语言在同一次修改中更新，
不要直接修改生成的 `.md`；然后运行 `npm run docs:build` 和
`npm run docs:check`。

### 贡献的许可

除非您另有明确声明,否则您有意提交以纳入本项目的任何贡献(按
Apache-2.0 许可证中的定义),均按 **MIT OR Apache-2.0** 双重许可,
不附加任何额外条款或条件。
