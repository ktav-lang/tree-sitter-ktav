>>>>> lang=en
## 11. Queued-task ownership and open human decisions

- **Quoted keys task:** G1 (all of § 1).
- **\uXXXX + BOM task:** G2 (§ 2) and G4 (§ 4).
- **Regenerate-and-green pass:** G6 (§ 6), plus the actual `tree-sitter generate` + suite-green gate after each of the above lands.
- **Human decision 1 — G3 ownership:** the whitespace-set gap (§ 3) is in neither the quoted-keys nor the \uXXXX+BOM scope as named. Suggestion: fold it into the \uXXXX + BOM task (same lexical-foundation character, touches the same rules) or spin it off; either way `src/scanner.c` C edits are required.
- **Human decision 2 — G2 lone surrogates:** reject at the syntax layer (needs an external-scanner addition to `src/scanner.c`) or accept `\uD800`-style escapes syntactically and let the reference parser raise `BadEscapeSequence`. The spec outcome is the same; the CST and diagnosis differ.
- **Human decision 3 — G5:** keep the documented root-kind delegation to the reference parser (status quo, cheapest, already written down in `grammar.js:79-82`) or enforce it (requires a stateful external scanner). G1's `'tis the season` breaking change interacts with this decision.

>>>>> lang=ru
## 11. Назначенные задачи и вопросы для решения человеком

- **Задача ключей в кавычках:** G1 (весь § 1).
- **Задача `\uXXXX` + BOM:** G2 (§ 2) и G4 (§ 4).
- **Этап восстановления и зелёных тестов:** G6 (§ 6), а также `tree-sitter generate` и зелёный набор тестов после каждого исправления выше.
- **Решение 1 — владелец G3:** пробелы не входят ни в задачу кавычечных ключей, ни в `\uXXXX`+BOM. Предлагается включить это в лексическую задачу или завести отдельную; в обоих случаях надо править `src/scanner.c`.
- **Решение 2 — одиночные суррогаты G2:** отклонять синтаксически (состояние внешнего сканера) либо принимать `\uD800` и выдавать `BadEscapeSequence` в эталонном парсере. Результат спецификации одинаков; CST и диагностика различаются.
- **Решение 3 — G5:** сохранить документированное делегирование корня эталонному парсеру (`grammar.js:79-82`) либо проверять состояние новым внешним сканером. С этим решением связан breaking change G1 для `'tis the season`.

>>>>> lang=zh
## 11. 已排任务归属与待人工决定事项

- **引号键任务：**G1（§ 1 全部内容）。
- **`\uXXXX` + BOM 任务：**G2（§ 2）和 G4（§ 4）。
- **重新生成并保持测试通过：**G6（§ 6）；上述每项修复后还需执行 `tree-sitter generate` 并通过完整相关测试。
- **人工决定 1 — G3 归属：**空白差距既不属于引号键，也不属于 `\uXXXX` + BOM。建议并入词法基础任务或另立任务；无论哪种都必须修改 `src/scanner.c`。
- **人工决定 2 — G2 孤立代理项：**在语法层借助外部扫描器状态拒绝，或语法接受 `\uD800` 并由参考解析器报告 `BadEscapeSequence`。规范结果相同，但 CST 与诊断不同。
- **人工决定 3 — G5：**维持 `grammar.js:79-82` 中将根类型委托给参考解析器的设计，或用有状态外部扫描器强制检查。G1 的 `'tis the season` 破坏性变更与此决定相关。

