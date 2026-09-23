>>>>> lang=en
## Editor integration

### Neovim (with [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter))

Until the grammar is upstreamed, register it manually in your config:

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

Then `:TSInstall ktav`. Drop `queries/highlights.scm`,
`queries/locals.scm`, and `queries/injections.scm` into your
`~/.config/nvim/queries/ktav/` directory (or let nvim-treesitter pick
them up from the parser repo).

>>>>> lang=ru
## Интеграция с редакторами

### Neovim (с [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter))

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

>>>>> lang=zh
## 编辑器集成

### Neovim（搭配 [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter)）

在语法尚未上游之前，请在配置中手动注册：

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

随后执行 `:TSInstall ktav`。把 `queries/highlights.scm`、
`queries/locals.scm` 与 `queries/injections.scm` 放入
`~/.config/nvim/queries/ktav/`（或让 `nvim-treesitter` 自动从仓库
拉取）。

