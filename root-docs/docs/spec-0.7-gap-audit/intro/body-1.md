>>>>> lang=en
# Ktav spec 0.7.0 — grammar gap audit (`tree-sitter-ktav`)

> Historical audit; it records the 2026-09-16 state and is not a current conformance claim.

- **Branch:** `spec-0.7-audit` · **Date:** 2026-09-16
- **Spec pinned:** `spec/` submodule moved `c9593e8` (v0.6.0-4) → `04f867f` (**v0.7.0**, verified `git -C spec log -1` and `git -C spec describe --tags`).
- **Grammar audited:** `grammar.js` at 444 lines (unchanged by this audit; `src/` untouched; `tree-sitter generate` not run).
- **Baseline:** `tree-sitter test` was 54/54 green before any change; 55/55 green after (one corpus entry added, see § 10).
- **Method:** every claim below about parser behaviour was **observed** by running the checked-in generated parser (`tree-sitter` CLI 0.26.13, installed from the declared devDependency into gitignored `node_modules/`) on byte-exact scratch inputs under gitignored `build/scratch/`. Parse snippets are pasted verbatim (CLI warning banner and timing line trimmed; positions are byte offsets). Claims about untested members of a set are labelled INFERRED.

>>>>> lang=ru
# Ktav 0.7.0 — аудит пробелов грамматики (`tree-sitter-ktav`)

> Исторический аудит: здесь зафиксировано состояние на 2026-09-16; это не утверждение о текущем соответствии.

- **Ветка:** `spec-0.7-audit` · **Дата:** 2026-09-16
- **Закреплённая спецификация:** submodule `spec/` переведён с `c9593e8` (v0.6.0-4) на `04f867f` (**v0.7.0**; проверено командами `git -C spec log -1` и `git -C spec describe --tags`).
- **Проверенная грамматика:** `grammar.js`, 444 строки (аудит её не менял; `src/` не затронут; `tree-sitter generate` не запускался).
- **Базовый результат:** `tree-sitter test` проходил 54/54 до изменений и 55/55 после них (добавлена одна запись corpus, см. § 10).
- **Метод:** все приведённые ниже утверждения о поведении парсера **наблюдались** на проверенном сгенерированном парсере (`tree-sitter` CLI 0.26.13, установленном из объявленной devDependency в игнорируемый Git каталог `node_modules/`) на побайтно точных входах в игнорируемом `build/scratch/`. Фрагменты дерева приведены дословно (баннер предупреждений CLI и время удалены; позиции — смещения байтов). Непроверенные элементы набора явно помечены как INFERRED.

>>>>> lang=zh
# Ktav 0.7.0 规范语法差距审计（`tree-sitter-ktav`）

> 历史审计：记录 2026-09-16 的状态，不代表当前符合性结论。

- **分支：** `spec-0.7-audit` · **日期：** 2026-09-16
- **固定的规范版本：** `spec/` 子模块从 `c9593e8`（v0.6.0-4）更新到 `04f867f`（**v0.7.0**；通过 `git -C spec log -1` 和 `git -C spec describe --tags` 核实）。
- **被审计语法：** `grammar.js` 共 444 行（本次审计未改动它；`src/` 未触及；未运行 `tree-sitter generate`）。
- **基线：** 修改前 `tree-sitter test` 为 54/54 通过；修改后为 55/55（一条 corpus 测试，见 § 10）。
- **方法：** 下文每项关于解析器行为的结论，均通过仓库内已生成的解析器（tree-sitter CLI 0.26.13，按声明的 devDependency 安装至 Git 忽略的 `node_modules/`）对 Git 忽略的 `build/scratch/` 中字节精确的输入实测。语法树片段按原样粘贴（已删 CLI 警告横幅与计时行；位置为字节偏移）。集合中未经单独测试的成员明确标为 INFERRED。

