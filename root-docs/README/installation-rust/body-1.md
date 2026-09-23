>>>>> lang=en
## Installation

### Rust (`tree-sitter` crate)

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

>>>>> lang=ru
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

>>>>> lang=zh
## 安装

### Rust（`tree-sitter` crate）

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

