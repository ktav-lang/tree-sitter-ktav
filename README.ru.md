# tree-sitter-ktav

> Грамматика [tree-sitter](https://tree-sitter.github.io/) для
> [Ktav (כְּתָב)](https://github.com/ktav-lang/spec) — формата
> письменной конфигурации.

**Languages:** [English](README.md) · **Русский** · [简体中文](README.zh.md)

**Песочница:** конвертация JSON / YAML / TOML / INI ⇄ Ktav прямо в браузере — **[ktav-lang.github.io](https://ktav-lang.github.io/)**.

[![Crates.io](https://img.shields.io/crates/v/tree-sitter-ktav?style=flat-square&logo=rust&label=crates.io)](https://crates.io/crates/tree-sitter-ktav)
[![CI](https://img.shields.io/github/actions/workflow/status/ktav-lang/tree-sitter-ktav/ci.yml?style=flat-square&logo=github&label=CI)](https://github.com/ktav-lang/tree-sitter-ktav/actions)
![License: MIT OR Apache-2.0](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue?style=flat-square)
[![Playground](https://img.shields.io/badge/playground-try%20online-7c3aed?style=flat-square&logo=rocket&logoColor=white)](https://ktav-lang.github.io/)
[![npm](https://img.shields.io/npm/v/tree-sitter-ktav.svg)](https://www.npmjs.com/package/tree-sitter-ktav)

---

## Что такое Ktav?

Ktav (иврит **כְּתָב**, «писание») — текстовый формат конфигурации
JSON-формы (скаляры, массивы, объекты, `null`, булево), но без кавычек
вокруг строк; между обычными элементами запятых нет, однако в inline-
структурах они используются. Для вложенности служат точечные ключи
(`server.port: 8080`). Полная спецификация (та же, на которую ориентируются
все официальные реализации Ktav) лежит в
[`ktav-lang/spec`](https://github.com/ktav-lang/spec).

## Что такое tree-sitter?

[Tree-sitter](https://tree-sitter.github.io/tree-sitter/) — это
инкрементальный генератор парсеров. Редакторы (Neovim, Helix, Emacs,
VS Code, Zed, …) используют его для подсветки синтаксиса, фолдинга,
структурного выделения и других возможностей, требующих настоящего
дерева разбора, а не regex-токенизатора. Под каждый язык — своя
грамматика; этот пакет — грамматика для Ktav.

## Установка

### Rust (крейт `tree-sitter`)

```toml
[dependencies]
tree-sitter         = "0.25"
tree-sitter-ktav    = "0.8.0"
```

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&tree_sitter_ktav::LANGUAGE.into())?;

    let source = "name: Russia\nport: 8080\n";
    let tree = parser.parse(source, None).unwrap();
    println!("{}", tree.root_node().to_sexp());
    Ok(())
}
```

### Node.js (пакет `tree-sitter`)

Пакет npm содержит исходники нативного модуля, а не готовые `.node`-бинарники.
Для установки нужны компилятор C/C++ и Python для `node-gyp`;
сгенерированный парсер уже включён, поэтому Tree-sitter CLI не нужен.

```bash
npm install tree-sitter tree-sitter-ktav
```

```js
const Parser = require("tree-sitter");
const Ktav   = require("tree-sitter-ktav");

const parser = new Parser();
parser.setLanguage(Ktav);

const tree = parser.parse("name: Russia\nport: 8080\n");
console.log(tree.rootNode.toString());
```

## Интеграция с редакторами

### Neovim (с [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter))

В текущей основной ветке `nvim-treesitter` больше не используется устаревший
API регистрации `get_parser_configs()`. Соберите библиотеку парсера из
репозитория грамматики и загрузите её через Tree-sitter API Neovim. CLI
автоматически включает `src/scanner.c` при сборке этой грамматики:

```lua
require("nvim-treesitter").setup({})
vim.filetype.add({ extension = { ktav = "ktav" } })
vim.treesitter.language.add("ktav", {
  path = vim.fn.stdpath("data") .. "/site/parser/ktav.so",
})
vim.api.nvim_create_autocmd("FileType", {
  pattern = "ktav",
  callback = function() vim.treesitter.start() end,
})
```

Сначала создайте целевой каталог `parser`. Например, в Unix выполните
`mkdir -p ~/.local/share/nvim/site/parser`, затем из репозитория грамматики
соберите библиотеку командой `npx tree-sitter build --output
~/.local/share/nvim/site/parser/ktav.so`. Каталог и расширение `.so` здесь
приведены как пример для Unix; используйте путь из `stdpath("data")` и
расширение динамической библиотеки вашей платформы (например, `.dll` в
Windows) и в команде сборки, и в Lua-конфигурации. Если список исходников
задаётся явно, включите `src/parser.c` и `src/scanner.c`. Скопируйте
`queries/highlights.scm`, `queries/locals.scm` и `queries/injections.scm` в
`~/.config/nvim/queries/ktav/`.

### Helix

В `~/.config/helix/languages.toml`:

```toml
[[language]]
name      = "ktav"
scope     = "source.ktav"
file-types = ["ktav"]
roots     = []
comment-token = "##"
indent    = { tab-width = 4, unit = "    " }

[[grammar]]
name   = "ktav"
source = { git = "https://github.com/ktav-lang/tree-sitter-ktav", rev = "main" }
```

Затем `hx --grammar fetch && hx --grammar build`.

### Другие редакторы

Грамматика экспортирует стандартные tree-sitter-метаданные
(`src/node-types.json`) и запросы (`queries/*.scm`), так что любой
редактор с поддержкой tree-sitter сможет с ней работать.

## Узлы AST

Примеры именованных узлов CST (см. `src/node-types.json`):

| Узел                       | Что захватывает                                  |
|----------------------------|--------------------------------------------------|
| `source_file`              | весь документ                                    |
| `comment`                  | строковый комментарий `##`                       |
| `blank_line`               | пустую строку                                    |
| `object_pair`              | строку `ключ SEP значение`                       |
| `key` / `dotted_key`       | ключ и сегменты точечного пути                   |
| `sep_string` / `sep_raw`   | разделители пар `:` и `::`                       |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | ключевые слова, в строке и inline |
| `integer` / `float`        | числа, в строке и inline (типизация § 5.2)       |
| `scalar` / `raw_scalar`    | обычные и raw-значения в одну строку              |
| `compound_object`          | блок `{` … `}`                                   |
| `compound_array`           | блок `[` … `]`                                   |
| `inline_object` / `inline_array` | inline-структуры с элементами через запятую |
| `inline_pair` / `inline_value` | пары и значения inline-структур              |
| `array_item` / `top_array_item` | элементы массива и массива верхнего уровня    |
| `multiline_stripped`       | блок `(` … `)`                                   |
| `multiline_verbatim`       | блок `((` … `))`                                 |
| `multiline_content_line`   | строка внутри многострочного значения            |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | пустые inline-формы |
| `empty_value`              | разделитель и максимальная последовательность допустимых пробелов до конца строки или файла |

`object_pair` и `inline_pair` имеют поля `key`, `separator`, `value`
(`inline_pair.value` необязательно); `array_item` и `top_array_item` имеют
обязательное `value` и необязательное `marker`.

## Сборка из исходников

```bash
git clone --recurse-submodules https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm ci                       # устанавливает tree-sitter-cli 0.26.8 из lock-файла
npx tree-sitter generate     # обновляет src/parser.c и связанные файлы
npx tree-sitter test         # запускает корпус tree-sitter
cargo test                   # тесты Rust, включая проверку соответствия спекам
```

Файлы `src/parser.c`, `src/grammar.json`, `src/node-types.json` и
`src/tree_sitter/*` коммитятся в git по соглашению tree-sitter, так
что потребителям грамматики не нужен CLI для сборки.

## Статус

`0.8.0` — Tree-sitter-грамматика синтаксиса [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md).
Грамматика разбирает все закреплённые валидные фикстуры spec 0.8 без
ошибок и сверяет корневой Object/Array с JSON-оракулом. Каждая
невалидная фикстура даёт синтаксическую ошибку, кроме семантических
категорий (`DuplicateKey`, `KeyPathConflict`, `InvalidUtf8`): Tree-sitter
строит синтаксическое дерево для редакторов и не заменяет
семантическую проверку эталонного Rust-парсера.

## Лицензия

Двойная лицензия — **MIT OR Apache-2.0**; см.
[LICENSE-MIT](LICENSE-MIT) и [LICENSE-APACHE](LICENSE-APACHE).

## Другие репозитории Ktav

- [`spec`](https://github.com/ktav-lang/spec) — спецификация и conformance-сюита
- [`rust`](https://github.com/ktav-lang/rust) — Rust (`cargo add ktav`)
- [`csharp`](https://github.com/ktav-lang/csharp) — C# / .NET (`dotnet add package Ktav`)
- [`golang`](https://github.com/ktav-lang/golang) — Go
- [`java`](https://github.com/ktav-lang/java) — Java / JVM (Maven Central)
- [`js`](https://github.com/ktav-lang/js) — JS / TS (`npm install @ktav-lang/ktav`)
- [`php`](https://github.com/ktav-lang/php) — PHP (`composer require ktav-lang/ktav`)
- [`python`](https://github.com/ktav-lang/python) — Python (`pip install ktav`)
