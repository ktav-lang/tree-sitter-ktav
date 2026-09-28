>>>>> lang=en
## 10. Corpus

**Added by this audit** (the only corpus change; suite 55/55 green): one entry in `test/corpus/escape_sequences.txt` — "Whole-line scalar value: backslash-u sequence is literal content (spec 0.7 § 3.7 boundary — no escape processing here)" with input `a: \u0041` and expected `(scalar)`. Chosen because it **currently parses correctly** and was untested; it pins the not-processed boundary that G2's fix must not disturb.

**`test/corpus/typed_markers.txt` verdict: misnamed, NOT stale.** Its single case is titled "Raw string marker (spec 0.5.0 — only :: remains)" and its content is three `::` raw-marker pairs (`pattern:: [a-z]+`, `ipv6:: [::1]:8080`, `template:: {issue.id}.tpl`) with an all-`sep_raw`/`raw_scalar` expected tree. The removed `:i`/`:f` markers appear nowhere in it, and the test passes. The file documents the *survivor* of the 0.5.0 marker removal; only its filename evokes the removed feature. A rename to e.g. `raw_markers.txt` would be cosmetic; left to a maintainer.

**Regression-test ownership once the fixes land** (suggested homes; all currently-failing inputs must stay OUT of the corpus until their fix lands — a red suite is not a TODO):

| Gap | Suggested corpus homes |
|---|---|
| G1 quoted keys | `edge_keys.txt` (three delimiters, positional rule, `"a" "b"` InvalidKey, escaped delimiter); `dotted_keys.txt` (`"a.b"` flatness, `a."b.c".d`); `inline_compounds.txt` (`{"a}b": 1, c: 2}`, `{"a,b": 1, c: 2}` opacity); `basic.txt` (`"port": 1`); `spec-conformance.txt` (`'tis the season: fa` root fallback) |
| G2 escapes | `escape_sequences.txt` (`\uXXXX` in key and inline value; surrogate pair; lone-surrogate `:error`; `\"`/`\'`/`` \` `` in keys and values); whole-line negative already present |
| G3 whitespace | `edge_keys.txt` + `mixed.txt` (VT/FF key content; NBSP/U+3000 indentation; `a:<NBSP>1`; NBSP-only blank line; closer with NBSP) |
| G4 BOM | `spec-conformance.txt` (leading-BOM document) |
| G5 root kind | `spec-conformance.txt` (`:error` entries: scalar-after-pair, orphan-after-inline; shape entry: pair-shaped line in Array root) |
| G6 CR endings | `basic.txt` (CR-only and mixed CR/LF/CRLF document) |

Caveat for G3/G4/G6 homes: the relevant bytes (NBSP, VT, FF, BOM, bare CR) are invisible or invisible-ish in a text corpus file and some editors/tools "helpfully" strip them (BOM, trailing whitespace, CRLF); if the suite must be robust for humans, prefer byte-level fixtures outside the corpus for those, and keep corpus entries only for the visibly-safe cases.

>>>>> lang=ru
## 10. Corpus

**Добавлено аудитом** (единственное изменение corpus; после него 55/55 тестов): пример в `test/corpus/escape_sequences.txt` «Whole-line scalar value: backslash-u sequence is literal content (spec 0.7 § 3.7 boundary — no escape processing here)»: вход `a: \u0041`, ожидается `(scalar)`. Он уже разбирается верно и закрепляет границу, которую исправление G2 не должно нарушить.

**`test/corpus/typed_markers.txt` — неверное имя, но НЕ устаревший файл.** Единственный тест «Raw string marker (spec 0.5.0 — only :: remains)» содержит три пары с `::` (`pattern:: [a-z]+`, `ipv6:: [::1]:8080`, `template:: {issue.id}.tpl`) и ожидаемое дерево только с `sep_raw`/`raw_scalar`. Удалённых маркеров `:i`/`:f` нет, тест проходит. Файл описывает сохранившийся маркер; только имя напоминает удалённую функцию. Переименование в `raw_markers.txt` — косметика, решение оставлено сопровождающему.

Рекомендуемые corpus-файлы для регрессий (падающие входы НЕ добавлять до исправления: красный тест — не TODO):

| Пробел | Предлагаемые тесты |
|---|---|
| G1 | `edge_keys.txt` (разделители, позиции, `"a" "b"`, экранирование); `dotted_keys.txt` (`"a.b"`, `a."b.c".d`); `inline_compounds.txt` (`{"a}b": 1, c: 2}`, `{"a,b": 1, c: 2}`); `basic.txt` (`"port": 1`); `spec-conformance.txt` (`'tis the season: fa`) |
| G2 | `escape_sequences.txt` (`\uXXXX` в ключах/inline, суррогатная пара, одиночный суррогат `:error`, кавычечные escape в ключах/значениях); отрицательный тест whole-line уже есть |
| G3 | `edge_keys.txt` + `mixed.txt` (VT/FF в ключе, NBSP/U+3000 в отступе, `a:<NBSP>1`, строка только с NBSP, закрытие с NBSP) |
| G4 | `spec-conformance.txt` (начальный BOM) |
| G5 | `spec-conformance.txt` (`:error` для скаляра после пары/осиротевшей строки; строка, похожая на пару, в Array) |
| G6 | `basic.txt` (только CR и смешанные CR/LF/CRLF) |

Оговорка: NBSP, VT, FF, BOM, одиночный CR и хвостовые пробелы плохо видны и могут нормализоваться редакторами/инструментами. Для надёжности предпочтительны побайтные фикстуры; в текстовый corpus добавлять лишь наглядно безопасные случаи.

>>>>> lang=zh
## 10. Corpus 测试集

**本审计新增**（唯一的 corpus 变更；测试共 55/55 通过）：在 `test/corpus/escape_sequences.txt` 添加用例 “Whole-line scalar value: backslash-u sequence is literal content (spec 0.7 § 3.7 boundary — no escape processing here)”，输入为 `a: \u0041`，预期 `(scalar)`。该输入当前可正确解析，用于固定 G2 修复不得破坏的“不处理转义”边界。

**`test/corpus/typed_markers.txt`：名称不准确，但并未过时。**唯一用例 “Raw string marker (spec 0.5.0 — only :: remains)” 包含三组 `::` 键值对（`pattern:: [a-z]+`、`ipv6:: [::1]:8080`、`template:: {issue.id}.tpl`），预期树仅含 `sep_raw`/`raw_scalar`。已删除的 `:i`/`:f` 不存在，测试通过。它记录了仍保留的标记，只是文件名容易让人想到已移除功能。改名 `raw_markers.txt` 属外观调整，留给维护者决定。

建议的回归测试位置（修复前不得把失败输入加入 corpus；红测不是待办标记）：

| 差距 | 建议的 corpus 文件 |
|---|---|
| G1 | `edge_keys.txt`（三种定界符、位置规则、`"a" "b"`、转义定界符）；`dotted_keys.txt`（`"a.b"`、`a."b.c".d`）；`inline_compounds.txt`（`{"a}b": 1, c: 2}`、`{"a,b": 1, c: 2}`）；`basic.txt`（`"port": 1`）；`spec-conformance.txt`（`'tis the season: fa`） |
| G2 | `escape_sequences.txt`（键/内联 `\uXXXX`、代理项对、孤立代理项 `:error`、键/值中的引号转义）；整行负例已存在 |
| G3 | `edge_keys.txt` + `mixed.txt`（键内 VT/FF、NBSP/U+3000 缩进、`a:<NBSP>1`、纯 NBSP 空行、NBSP 闭合符） |
| G4 | `spec-conformance.txt`（开头 BOM） |
| G5 | `spec-conformance.txt`（键值对后标量/内联值后孤立行的 `:error`；Array 中类似键值对的行） |
| G6 | `basic.txt`（仅 CR 及 CR/LF/CRLF 混合） |

注意：NBSP、VT、FF、BOM、单独 CR 和行尾空格不易察觉，且可能被编辑器/工具规范化。稳健测试应优先采用字节级 fixture；文本 corpus 只放不易被改写的可见案例。

