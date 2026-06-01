# 为 tree-sitter-ktav 做贡献

**语言:** [English](CONTRIBUTING.md) · [Русский](CONTRIBUTING.ru.md) · **简体中文**

## 核心规则

### 1. 每个 bug 修复都伴随一个回归测试

发现 bug 时,**在修复之前** 先写一个复现它的测试 —— 测试在
`main` 分支上 **必须失败**,修复之后才通过。两者放在同一个 PR。

测试位于 `test/corpus/`,以 tree-sitter 测试 fixture 的形式存放。

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

## 语言政策

本仓库参与组织级三语政策(EN / RU / ZH)。每份 prose 文档都有三种
并行版本 —— 命名约定和"三份一并更新"规则见
[`ktav-lang/.github/AGENTS.md`](https://github.com/ktav-lang/.github/blob/main/AGENTS.md)。

### 贡献的许可

除非您另有明确声明,否则您有意提交以纳入本项目的任何贡献(按
Apache-2.0 许可证中的定义),均按 **MIT OR Apache-2.0** 双重许可,
不附加任何额外条款或条件。
