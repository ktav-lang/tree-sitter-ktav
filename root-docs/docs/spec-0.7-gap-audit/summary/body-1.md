>>>>> lang=en
## 0. Summary

| # | Gap (spec §) | Failure mode today | Owner (queued task) | External scanner needed? |
|---|--------------|--------------------|---------------------|--------------------------|
| G1 | Quoted keys (§ 5.3.3, § 4) | wrong tree / errors / accepted-but-invalid | **quoted keys** | no |
| G2 | Escape table 10 vs 14 (§ 3.7, § 3.7.1) | errors on valid input | **\uXXXX + BOM** | only for lone-surrogate diagnosis |
| G3 | Whitespace set = 25 cp (§ 3.3, § 4) | silent key/value corruption AND false rejections | **unassigned — human decision** | no (scanner.c C edits yes) |
| G4 | Leading BOM (§ 3.1) | structurally absent (accidentally near-correct) | **\uXXXX + BOM** | no |
| G5 | Root-kind detection (§ 5.0.1/§ 5.1) | accepts spec-errors; tree-shape divergence | **unassigned — human decision** | yes, if ever enforced |
| G6 | Lone-CR terminators (§ 3.2) | hard parse errors | **regenerate-and-green pass** | no |
| G7 | Stripped-form trailing-ws (§ 5.6) | **none** — grammar compatible | none | n/a |

Severity intuition: G3 is the nastiest (silent wrong decoded keys — no error surfaces); G1/G2 are loud but block all 0.7 key/escape features; G4/G6 are robustness; G5 is a design decision.

>>>>> lang=ru
## 0. Сводка

| № | Пробел (раздел спецификации) | Наблюдаемый сбой | Владелец (назначенная задача) | Нужен внешний сканер? |
|---|---|---|---|---|
| G1 | Ключи в кавычках (§ 5.3.3, § 4) | Неверное дерево / ошибки / неправомерное принятие | **ключи в кавычках** | нет |
| G2 | 10 вместо 14 escape-форм (§ 3.7, § 3.7.1) | Ошибки на допустимых данных | **\uXXXX + BOM** | только для диагностики одиночного суррогата |
| G3 | Набор из 25 пробелов (§ 3.3, § 4) | Тихое искажение ключей/значений и ложные отказы | **не назначено — решение человека** | нет (но нужны изменения C-кода scanner.c) |
| G4 | Начальный BOM (§ 3.1) | Структурно не задан (случайно почти верно) | **\uXXXX + BOM** | нет |
| G5 | Определение вида корня (§ 5.0.1/§ 5.1) | Принимаются ошибки спецификации; расходится форма дерева | **не назначено — решение человека** | да, если когда-либо включить проверку |
| G6 | Терминатор одиночного CR (§ 3.2) | Жёсткие ошибки разбора | **этап восстановления и зелёных тестов** | нет |
| G7 | Хвостовые пробелы сокращённой формы (§ 5.6) | **нет** — грамматика совместима | нет | не требуется |

Оценка серьёзности: G3 опаснее всего (тихое искажение декодированного ключа без ошибки); G1/G2 заметны, но блокируют все новые возможности ключей/экранирования 0.7; G4/G6 — устойчивость; G5 — проектное решение.

>>>>> lang=zh
## 0. 摘要

| 编号 | 差距（规范章节） | 当前失败方式 | 负责人（已排定任务） | 是否需要外部扫描器？ |
|---|---|---|---|---|
| G1 | 引号键（§ 5.3.3、§ 4） | 语法树错误 / 报错 / 错误接受 | **引号键任务** | 否 |
| G2 | 转义形式为 10 种而非 14 种（§ 3.7、§ 3.7.1） | 有效输入解析失败 | **\uXXXX + BOM 任务** | 仅孤立代理项诊断需要 |
| G3 | 25 个空白码点集合（§ 3.3、§ 4） | 键/值静默损坏且误拒绝输入 | **未分配，待人工决定** | 否（但需改 scanner.c 的 C 代码） |
| G4 | 开头 BOM（§ 3.1） | 结构上未实现（偶然表现接近正确） | **\uXXXX + BOM 任务** | 否 |
| G5 | 根类型判定（§ 5.0.1/§ 5.1） | 接受规范无效输入，语法树形状不同 | **未分配，待人工决定** | 若要强制执行则需要 |
| G6 | 单独 CR 作为行结束符（§ 3.2） | 解析时报错 | **重新生成并保持测试通过** | 否 |
| G7 | 简化形式的尾随空白裁剪（§ 5.6） | **无**，语法兼容 | 无 | 不适用 |

严重性判断：G3 最危险（解码后的键被静默改错，且无错误提示）；G1/G2 虽会报错，却阻断了 0.7 的键和转义功能；G4/G6 是健壮性问题；G5 属于设计决策。

