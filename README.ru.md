# tree-sitter-ktav

> Грамматика [tree-sitter](https://tree-sitter.github.io/) для
> [Ktav (כְּתָב)](https://github.com/ktav-lang/spec) — Written
> Configuration Format.

**Языки:** [English](README.md) · **Русский** · [简体中文](README.zh.md)

[![CI](https://github.com/ktav-lang/tree-sitter-ktav/actions/workflows/ci.yml/badge.svg)](https://github.com/ktav-lang/tree-sitter-ktav/actions/workflows/ci.yml)
[![crates.io](https://img.shields.io/crates/v/tree-sitter-ktav.svg)](https://crates.io/crates/tree-sitter-ktav)
[![npm](https://img.shields.io/npm/v/tree-sitter-ktav.svg)](https://www.npmjs.com/package/tree-sitter-ktav)

---

## Что такое Ktav?

Ktav (иврит **כְּתָב**, «писание») — текстовый формат конфигурации
JSON-формы (скаляры, массивы, объекты, `null`, булево), но без кавычек
вокруг строк, без запятых, с точечными ключами (`server.port: 8080`)
для вложенности. Полная спецификация (та же, на которую ориентируются
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

### Rust

```toml
[dependencies]
tree-sitter      = "0.25"
tree-sitter-ktav = "0.1"
```

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&tree_sitter_ktav::LANGUAGE.into())?;

    let source = "name: Russia\nport:i 8080\n";
    let tree = parser.parse(source, None).unwrap();
    println!("{}", tree.root_node().to_sexp());
    Ok(())
}
```

### Node.js

```bash
npm install tree-sitter tree-sitter-ktav
```

```js
const Parser = require("tree-sitter");
const Ktav   = require("tree-sitter-ktav");

const parser = new Parser();
parser.setLanguage(Ktav);

const tree = parser.parse("name: Russia\nport:i 8080\n");
console.log(tree.rootNode.toString());
```

## Интеграция с редакторами

### Neovim (через [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter))

Пока грамматика не зарегистрирована в апстриме, добавьте вручную:

```lua
require("nvim-treesitter.parsers").get_parser_configs().ktav = {
  install_info = {
    url = "https://github.com/ktav-lang/tree-sitter-ktav",
    files = { "src/parser.c" },
    branch = "main",
  },
  filetype = "ktav",
}

vim.filetype.add({ extension = { ktav = "ktav" } })
```

Затем `:TSInstall ktav`. Положите `queries/highlights.scm`,
`queries/locals.scm` и `queries/injections.scm` в
`~/.config/nvim/queries/ktav/` (либо позвольте `nvim-treesitter`
подобрать их из репозитория грамматики).

### Helix

В `~/.config/helix/languages.toml`:

```toml
[[language]]
name      = "ktav"
scope     = "source.ktav"
file-types = ["ktav"]
roots     = []
comment-token = "#"
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

Грамматика генерирует следующие именованные узлы:

| Узел                       | Что захватывает                                  |
|----------------------------|--------------------------------------------------|
| `source_file`              | весь документ                                    |
| `comment`                  | строковый комментарий `#`                        |
| `blank_line`               | пустую строку                                    |
| `object_pair`              | строку `ключ SEP значение`                       |
| `key` / `dotted_key`       | ключ (с возможным `.`-разбиением)                |
| `sep_string` / `sep_raw` / `sep_int` / `sep_float` | четыре разделителя           |
| `keyword` / `kw_null` / `kw_true` / `kw_false`     | ключевые слова               |
| `scalar`                   | универсальное однострочное значение              |
| `compound_object`          | блок `{` … `}`                                   |
| `compound_array`           | блок `[` … `]`                                   |
| `array_item`               | элемент массива                                  |
| `multiline_stripped`       | блок `(` … `)`                                   |
| `multiline_verbatim`       | блок `((` … `))`                                 |
| `multiline_content_line`   | строка внутри многострочного значения            |
| `empty_object` / `empty_array` / `empty_paren` / `empty_double_paren` | пустые inline-формы |
| `empty_value`              | разделитель сразу за концом строки               |

`object_pair` экспонирует поля `key`, `separator`, `value`;
`array_item` — `marker` (опционально) и `value`.

## Сборка из исходников

```bash
git clone https://github.com/ktav-lang/tree-sitter-ktav.git
cd tree-sitter-ktav
npm install
npx tree-sitter generate     # генерирует src/parser.c
npx tree-sitter test         # запускает корпус
```

Файлы `src/parser.c`, `src/grammar.json`, `src/node-types.json` и
`src/tree_sitter/*` коммитятся в git по соглашению tree-sitter, так
что потребителям грамматики не нужен CLI для сборки.

## Статус

`0.1.0` — реализует [Ktav 0.1.0](https://github.com/ktav-lang/spec/blob/main/versions/0.1/spec.md).
Грамматика принимает любой валидный документ Ktav 0.1.0 (проверено на
всех фикстурах `tests/valid/*.ktav` из spec-репозитория). Это
синтаксический акцептор, а не строгий валидатор — небольшое число
патологических случаев, которые грамматика принимает, а спецификация
запрещает (в основном § 6.10, отсутствие пробела после маркера),
перечислены в [`CHANGELOG.md`](CHANGELOG.md).

## Лицензия

MIT — см. [LICENSE](LICENSE).

## Другие репозитории Ktav

- [`spec`](https://github.com/ktav-lang/spec) — спецификация и conformance-сюита
- [`rust`](https://github.com/ktav-lang/rust) — Rust (`cargo add ktav`)
- [`csharp`](https://github.com/ktav-lang/csharp) — C# / .NET (`dotnet add package Ktav`)
- [`golang`](https://github.com/ktav-lang/golang) — Go
- [`java`](https://github.com/ktav-lang/java) — Java / JVM (Maven Central)
- [`js`](https://github.com/ktav-lang/js) — JS / TS (`npm install @ktav-lang/ktav`)
- [`php`](https://github.com/ktav-lang/php) — PHP (`composer require ktav-lang/ktav`)
- [`python`](https://github.com/ktav-lang/python) — Python (`pip install ktav`)
