>>>>> lang=en
## Editor integration

### Neovim (with [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter))

The current `nvim-treesitter` main branch no longer uses the legacy
`get_parser_configs()` registration API. Build the parser library from the
grammar repository, then load it with Neovim's Tree-sitter API. The CLI
includes `src/scanner.c` automatically when building this grammar:

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

Create the target `parser` directory first. On Unix, for example, run
`mkdir -p ~/.local/share/nvim/site/parser`, then build from the grammar
repository with `npx tree-sitter build --output
~/.local/share/nvim/site/parser/ktav.so`. The directory and `.so` filename
are Unix examples; use the path from `stdpath("data")` and your platform's
shared-library extension (for example, `.dll` on Windows) in both the build
command and Lua config. If building from an explicit source-file list,
include both `src/parser.c` and `src/scanner.c`. Copy
`queries/highlights.scm`, `queries/locals.scm`, and `queries/injections.scm`
to `~/.config/nvim/queries/ktav/`.

>>>>> lang=ru
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

>>>>> lang=zh
## 编辑器集成

### Neovim（搭配 [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter)）

当前 `nvim-treesitter` 主分支已不再使用旧的
`get_parser_configs()` 注册 API。请从语法仓库构建解析器库，再通过
Neovim 的 Tree-sitter API 加载。构建此语法时，CLI 会自动包含
`src/scanner.c`：

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

先创建目标 `parser` 目录。例如，在 Unix 上运行
`mkdir -p ~/.local/share/nvim/site/parser`，然后在语法仓库中执行
`npx tree-sitter build --output
~/.local/share/nvim/site/parser/ktav.so`。此目录和 `.so` 扩展名是 Unix
示例；请按平台使用 `stdpath("data")` 对应的路径及共享库扩展名（例如
Windows 上的 `.dll`），并同时更新构建命令和 Lua 配置。若显式列出源文件，
请同时包含 `src/parser.c` 和 `src/scanner.c`。将 `queries/highlights.scm`、
`queries/locals.scm` 和 `queries/injections.scm` 复制到
`~/.config/nvim/queries/ktav/`。

