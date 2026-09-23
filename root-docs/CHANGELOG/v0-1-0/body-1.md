>>>>> lang=en
## [0.1.0] — 2026-04-26

Initial release. Implements [Ktav spec 0.1.0](https://github.com/ktav-lang/spec/blob/main/versions/0.1/spec.md).

### Added

- **Grammar (`grammar.js`)** — line-oriented LR(1) grammar for Ktav
  v0.1.0 with no external scanner. Recognises:
  - line comments (`# ...`)
  - blank lines
  - object pairs with all four separators (`:`, `::`, `:i`, `:f`)
  - dotted keys (`a.b.c: value`)
  - keywords (`null`, `true`, `false`, case-sensitive)
  - empty inline compounds (`{}`, `[]`, `()`, `(())`)
  - multi-line objects (`{` … `}`) and arrays (`[` … `]`)
  - multi-line strings, both stripped (`(` … `)`) and verbatim
    (`((` … `))`)
  - array items with marker prefixes (`:: x`, `:i 42`, `:f 0.5`)
- **Node bindings** (`bindings/node/*`) — N-API binding for use with
  `tree-sitter` from Node.js.
- **Rust bindings** (`bindings/rust/*`) — exposes `LANGUAGE: LanguageFn`
  for the `tree-sitter` crate, plus `HIGHLIGHTS_QUERY`,
  `LOCALS_QUERY`, `INJECTIONS_QUERY`, `NODE_TYPES`.
- **Highlight queries** (`queries/highlights.scm`) — captures for
  keys (`@property`), keywords (`@constant.builtin`), comments
  (`@comment`), markers (`@punctuation.special`), strings, numbers,
  brackets.
- **Locals queries** (`queries/locals.scm`) — object scopes and
  property definitions.
- **Injections queries** (`queries/injections.scm`) — placeholder
  (no injections defined for v0.1.0).
- **Corpus tests** (`test/corpus/*.txt`) — twelve files covering
  scalars, dotted keys, typed markers, raw markers, keywords,
  comments, multi-line and inline compounds, multi-line strings,
  nesting, and edge-case keys.
- **CI** (`.github/workflows/ci.yml`) — runs `tree-sitter generate`
  and `tree-sitter test` on Ubuntu / macOS / Windows.
- **Release** (`.github/workflows/release.yml`) — on tag `v*`,
  publishes to crates.io and npm and creates a GitHub Release.

>>>>> lang=ru
## [0.1.0] — 2026-04-26

Первый релиз. Реализует [Ktav 0.1.0](https://github.com/ktav-lang/spec/blob/main/versions/0.1/spec.md).

### Добавлено

- **Грамматика (`grammar.js`)** — построчная LR(1)-грамматика без
  внешнего сканера. Распознаёт:
  - комментарии (`# ...`);
  - пустые строки;
  - пары `ключ: значение` со всеми четырьмя разделителями (`:`, `::`,
    `:i`, `:f`);
  - точечные ключи (`a.b.c: значение`);
  - ключевые слова (`null`, `true`, `false`, чувствительно к регистру);
  - пустые inline-составные значения (`{}`, `[]`, `()`, `(())`);
  - многострочные объекты (`{` … `}`) и массивы (`[` … `]`);
  - многострочные строки в обеих формах: stripped (`(` … `)`) и
    verbatim (`((` … `))`);
  - элементы массива с префикс-маркерами (`:: x`, `:i 42`, `:f 0.5`).
- **Node-биндинг** (`bindings/node/*`) — N-API биндинг для пакета
  `tree-sitter` из Node.js.
- **Rust-биндинг** (`bindings/rust/*`) — экспортирует `LANGUAGE:
  LanguageFn` для крейта `tree-sitter`, а также строки запросов
  `HIGHLIGHTS_QUERY`, `LOCALS_QUERY`, `INJECTIONS_QUERY` и
  `NODE_TYPES`.
- **Запросы подсветки** (`queries/highlights.scm`) — захваты для
  ключей (`@property`), ключевых слов (`@constant.builtin`),
  комментариев (`@comment`), маркеров (`@punctuation.special`),
  строк, чисел и скобок.
- **Запросы локалов** (`queries/locals.scm`) — области видимости
  объектов и определения свойств.
- **Инъекции** (`queries/injections.scm`) — заготовка (для v0.1.0
  инъекций не определено).
- **Корпус-тесты** (`test/corpus/*.txt`) — 12 файлов: скаляры,
  точечные ключи, типизированные маркеры, raw-маркер, ключевые слова,
  комментарии, многострочные и inline-составные значения,
  многострочные строки, вложенность, edge-case ключи.
- **CI** (`.github/workflows/ci.yml`) — `tree-sitter generate` и
  `tree-sitter test` на Ubuntu / macOS / Windows.
- **Release** (`.github/workflows/release.yml`) — по тегу `v*`
  публикует на crates.io и npm и создаёт GitHub Release.

>>>>> lang=zh
## [0.1.0] — 2026-04-26

首次发布。实现 [Ktav 0.1.0 规范](https://github.com/ktav-lang/spec/blob/main/versions/0.1/spec.md)。

### 新增

- **语法（`grammar.js`）** — 行式 LR(1) 语法，无需外部扫描器。识别：
  - 行注释（`# ...`）；
  - 空行；
  - 键值对（四种分隔符：`:`、`::`、`:i`、`:f`）；
  - 点式键（`a.b.c: 值`）；
  - 关键字（`null`、`true`、`false`，区分大小写）；
  - 空内联复合值（`{}`、`[]`、`()`、`(())`）；
  - 多行对象（`{` … `}`）和数组（`[` … `]`）；
  - 多行字符串：去缩进式（`(` … `)`）与原文式（`((` … `))`）；
  - 数组元素的标记前缀（`:: x`、`:i 42`、`:f 0.5`）。
- **Node 绑定**（`bindings/node/*`）— 供 Node.js `tree-sitter` 使用
  的 N-API 绑定。
- **Rust 绑定**（`bindings/rust/*`）— 为 `tree-sitter` crate 提供
  `LANGUAGE: LanguageFn`，并暴露 `HIGHLIGHTS_QUERY`、`LOCALS_QUERY`、
  `INJECTIONS_QUERY`、`NODE_TYPES`。
- **高亮查询**（`queries/highlights.scm`）— 键（`@property`）、关键
  字（`@constant.builtin`）、注释（`@comment`）、标记
  （`@punctuation.special`）、字符串、数字、括号的捕获。
- **作用域查询**（`queries/locals.scm`）— 对象作用域与属性定义。
- **注入查询**（`queries/injections.scm`）— 占位（v0.1.0 暂未定义注
  入）。
- **语料库测试**（`test/corpus/*.txt`）— 12 个文件，覆盖标量、点式
  键、类型标记、raw 标记、关键字、注释、多行与内联复合值、多行字符
  串、嵌套及边界键名。
- **CI**（`.github/workflows/ci.yml`）— 在 Ubuntu / macOS / Windows
  上运行 `tree-sitter generate` 和 `tree-sitter test`。
- **Release**（`.github/workflows/release.yml`）— 当推送 `v*` 标签
  时发布到 crates.io 与 npm，并创建 GitHub Release。

