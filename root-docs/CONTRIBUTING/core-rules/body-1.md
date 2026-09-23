>>>>> lang=en
## Core rules

### 1. Every bug fix ships with a regression test

When you find a bug, **before fixing it**, write a test that reproduces
it — the test **must fail on `main`** and pass after the fix. Include
both in the same PR.

Tests live in `test/corpus/` as tree-sitter test fixtures.

### 2. Keep the grammar in sync with the spec

The grammar targets
[`ktav-lang/spec`](https://github.com/ktav-lang/spec). Format-level
changes belong in the spec first; grammar changes follow.

### 3. One concept per commit

Commits should be atomic: a bug fix and its test together, a feature
and its tests together, a rename on its own, a refactor on its own.
`git log --oneline` should read like a changelog. Don't prefix commit
messages with `feat:` / `fix:` — no conventional commits here.

>>>>> lang=ru
## Основные правила

### 1. Каждый багфикс сопровождается регрессионным тестом

Когда вы нашли баг, **до исправления** напишите тест, который его
воспроизводит — он **должен падать на `main`** и проходить после
фикса. Оба — в одном PR.

Тесты лежат в `test/corpus/` как tree-sitter-фикстуры.

### 2. Грамматика следует за спецификацией

Грамматика ориентирована на
[`ktav-lang/spec`](https://github.com/ktav-lang/spec). Изменения
формата сначала попадают в спецификацию; грамматика подтягивается
вслед.

### 3. Один концепт — один коммит

Коммиты атомарны: фикс вместе с тестом, фича вместе с тестами,
переименование — отдельно, рефакторинг — отдельно. `git log --oneline`
должен читаться как changelog. Без `feat:` / `fix:` префиксов.

>>>>> lang=zh
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

