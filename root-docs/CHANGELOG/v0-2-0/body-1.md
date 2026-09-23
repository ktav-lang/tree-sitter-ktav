>>>>> lang=en
## [0.2.0] — 2026-05-01

Strict spec-conformance pass. The grammar now rejects the two
syntactic forms that the previous release accepted by oversight.

### Added

- **External scanner (`src/scanner.c`)** with two custom tokens:
  - `_marker_ws` — zero-width assertion; succeeds only when the
    byte immediately after a pair separator (`:`, `::`, `:i`, `:f`)
    is space, tab, CR, LF, or EOF. Enforces § 6.10
    (**MissingSeparatorSpace**).
  - `_strict_eol` — `[ \t]*\r?\n` (or EOF); used as the line
    terminator for compound and multi-line-string closers, so that
    `} trailing\n`, `] trailing\n`, `) trailing\n`, `)) trailing\n`
    are now syntax errors (§ 5.6.1 and the closer-cleanliness rule).
- **Corpus tests** (`test/corpus/spec-conformance.txt`) covering
  the four glued-marker forms, the four empty-body forms, the four
  whitespace-and-body forms, both trailing-after-closer cases, deep
  nesting with comments and blank lines, and dotted keys around
  both multi-line-string forms.

### Changed

- `grammar.js` declares the two new externals and rewires
  `object_pair`, `array_item`, and the four compound-closer rules
  accordingly.
- `binding.gyp` and `bindings/rust/build.rs` now compile
  `src/scanner.c` alongside `src/parser.c`.

### Removed (limitations)

- The "mandatory whitespace after marker" gap (§ 6.10) — now
  enforced.
- The "trailing content after compound closer" gap — now rejected
  for `}`, `]`, `)`, `))`.

>>>>> lang=ru
## [0.2.0] — 2026-05-01

Проход строгой совместимости со спецификацией. Грамматика теперь
отвергает две синтаксические формы, которые в предыдущем релизе
принимались по недосмотру.

### Добавлено

- **Внешний сканер (`src/scanner.c`)** с двумя кастомными токенами:
  - `_marker_ws` — утверждение нулевой ширины; срабатывает только
    если байт сразу после разделителя пары (`:`, `::`, `:i`, `:f`)
    — пробел, табуляция, CR, LF или EOF. Реализует § 6.10
    (**MissingSeparatorSpace**).
  - `_strict_eol` — `[ \t]*\r?\n` (или EOF); используется как
    терминатор строки для закрывающих скобок составных значений и
    многострочных строк, поэтому `} trailing\n`, `] trailing\n`,
    `) trailing\n`, `)) trailing\n` теперь синтаксические ошибки
    (§ 5.6.1 и правило чистоты закрывающей строки).
- **Тесты корпуса** (`test/corpus/spec-conformance.txt`),
  покрывающие четыре «склеенных» формы маркера, четыре формы с
  пустым телом, четыре формы «пробел + тело», оба случая мусора
  после закрывающей скобки, глубокую вложенность с комментариями
  и пустыми строками и точечные ключи вокруг обеих форм
  многострочной строки.

### Изменено

- `grammar.js` объявляет два новых внешних токена и перевязывает
  правила `object_pair`, `array_item` и четыре правила закрывающих
  скобок.
- `binding.gyp` и `bindings/rust/build.rs` теперь компилируют
  `src/scanner.c` вместе с `src/parser.c`.

### Удалено (ограничения)

- Пробел «обязателен после маркера» (§ 6.10) — теперь
  обеспечивается.
- «Мусор после закрывающей скобки» — теперь отвергается для `}`,
  `]`, `)`, `))`.

>>>>> lang=zh
## [0.2.0] — 2026-05-01

严格规范一致性升级。语法现在拒绝上一版本因疏漏而接受的两种语法
形式。

### 新增

- **外部扫描器（`src/scanner.c`）**，提供两个自定义 token：
  - `_marker_ws` — 零宽断言；仅当对分隔符（`:`、`::`、`:i`、
    `:f`）之后的下一个字节为空格、制表符、CR、LF 或 EOF 时成功。
    实现 § 6.10（**MissingSeparatorSpace**）。
  - `_strict_eol` — `[ \t]*\r?\n`（或 EOF）；用作复合值与多行
    字符串闭合括号所在行的行终止符，因此
    `} trailing\n`、`] trailing\n`、`) trailing\n`、
    `)) trailing\n` 现在均为语法错误（§ 5.6.1 与闭合行整洁
    规则）。
- **语料库测试**（`test/corpus/spec-conformance.txt`），覆盖
  四种「贴紧」标记形式、四种空主体形式、四种「空白 + 主体」
  形式、闭合括号后跟随尾随内容的两种情况、含注释与空行的
  多层嵌套，以及围绕两种多行字符串形式的点分键。

### 变更

- `grammar.js` 声明两个新的外部 token，并相应重连
  `object_pair`、`array_item` 与四条复合闭合规则。
- `binding.gyp` 与 `bindings/rust/build.rs` 现在与
  `src/parser.c` 一同编译 `src/scanner.c`。

### 删除（局限性）

- 「分隔符后必须有空白」（§ 6.10）——现已强制。
- 「复合闭合括号后存在尾随内容」——现已对 `}`、`]`、`)`、
  `))` 全部拒绝。

