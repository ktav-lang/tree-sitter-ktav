>>>>> lang=en
### Helix

Add to `~/.config/helix/languages.toml`:

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

Then `hx --grammar fetch && hx --grammar build`.

>>>>> lang=ru
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

>>>>> lang=zh
### Helix

在 `~/.config/helix/languages.toml` 中：

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

随后执行 `hx --grammar fetch && hx --grammar build`。

