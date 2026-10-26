>>>>> lang=en
### 0.8.1

- Align crate, npm and Tree-sitter metadata versions on 0.8.1 and pin
  the spec submodule to `v0.8.1`. The corpus guard tracks all 340 fixtures
  in all five categories (228/90/5/4/13), without widening syntax exemptions.
- Add Node binding regressions for lowercase-only numeric prefixes in
  whole-line, root-array and inline values, with LF, CRLF, CR and no final
  newline. `0x1A` is numeric; `0X1A`, `0O17` and `0B101` are Strings.
- Pin syntax errors for explicit roots left open at EOF, with closed-root
  controls. Syntax rules are unchanged; the generated parser's version
  metadata is synchronized with 0.8.1. Semantic and raw UTF-8 validation
  remain outside Tree-sitter.
- Update installation and status documentation in English, Russian and Chinese.

>>>>> lang=ru
### 0.8.1

- Версии crate, npm и метаданных Tree-sitter синхронизированы на 0.8.1;
  подмодуль spec закреплён на `v0.8.1`. Corpus-guard учитывает все 340
  фикстур пяти категорий (228/90/5/4/13), без расширения исключений синтаксиса.
- Добавлены регрессии Node binding для числовых префиксов только в нижнем
  регистре: значения строк, корневого массива и inline; LF, CRLF, CR и EOF
  без перевода строки. `0x1A` — число; `0X1A`, `0O17`, `0B101` — строки.
- Ошибки синтаксиса закреплены для незакрытых в EOF явных корней, с проверкой
  закрытых корней. Синтаксические правила не меняются; версия в метаданных
  сгенерированного парсера синхронизирована с 0.8.1. Семантика и проверка
  байтов UTF-8 остаются вне Tree-sitter.
- Установка и статус описаны на EN/RU/ZH.

>>>>> lang=zh
### 0.8.1

- crate、npm 和 Tree-sitter 元数据版本同步至 0.8.1，spec 子模块固定
  在 `v0.8.1`。语料检查覆盖五类全部 340 个样例（228/90/5/4/13），
  不扩大语法错误豁免范围。
- 新增 Node 绑定回归测试，确保只有小写进制前缀为数值，覆盖整行、
  根数组和内联值，以及 LF、CRLF、CR 和无末尾换行。
  `0x1A` 是数值；`0X1A`、`0O17`、`0B101` 是字符串。
- 回归测试固定 EOF 未闭合显式根的语法错误，并包含闭合根的对照。
  语法规则保持不变；生成的解析器版本元数据与 0.8.1 同步。
  语义及原始 UTF-8 验证仍不属于 Tree-sitter 的职责。
- 安装和状态文档同步更新英语、俄语和中文。

