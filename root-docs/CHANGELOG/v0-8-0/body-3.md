>>>>> lang=en
### Changed

- Conformance suite walks the spec **0.8.0** corpus (was 0.6) with no
  valid-fixture allow-list and checks root kinds against JSON oracles.
- Every `invalid/` fixture must surface a syntax error unless it needs
  key validation (`DuplicateKey`, `KeyPathConflict`) or pre-parse UTF-8
  byte validation (`InvalidUtf8`).
- Corpus guard validates manifest, version, and oracle schemas, and
  safely validates raw-byte fixture stems.
- A browser playground for development (`npm run playground`) shows
  highlighting, parse errors and the syntax tree, and checks the spec
  0.8 corpus against its expectations; it is not part of the packages.
- CI: `cargo publish` uses Trusted Publishing (OIDC); `npm publish`
  prefers OIDC and can fall back to a registry token.

>>>>> lang=ru
### Изменено

- Conformance-набор обходит корпус спецификации **0.8.0** (ранее 0.6)
  без исключений valid-фикстур и сверяет вид корня с JSON-оракулами.
- Каждая фикстура `invalid/` обязана давать синтаксическую ошибку,
  кроме требующих проверки ключей (`DuplicateKey`, `KeyPathConflict`)
  или исходных байтов UTF-8 до разбора (`InvalidUtf8`).
- Защитная проверка корпуса контролирует схемы manifest, версии и
  oracle, а также безопасно проверяет имена raw-byte фикстур.
- Браузерная песочница для разработки (`npm run playground`) показывает
  подсветку, ошибки разбора и дерево разбора и сверяет корпус spec 0.8
  с ожиданиями; в пакеты она не входит.
- CI: `cargo publish` использует Trusted Publishing (OIDC);
  `npm publish` предпочитает OIDC, но может использовать токен реестра.

>>>>> lang=zh
### 变更

- 一致性套件现在遍历规范 **0.8.0** 语料（此前为 0.6），不再豁免
  有效样例，并根据 JSON 预期结果检查根类型。
- 每个 `invalid/` 样例都必须产生语法错误，除非它需要验证键
  （`DuplicateKey`、`KeyPathConflict`）或在解析前检查原始 UTF-8
  字节（`InvalidUtf8`）。
- 语料保护检查 manifest、版本和 oracle 的结构，并安全校验
  raw-byte fixture 的文件名。
- 新增用于开发的浏览器演练场（`npm run playground`），显示高亮、解析错误
  和语法树，并按预期结果核对 spec 0.8 语料库；它不包含在发布包中。
- CI：`cargo publish` 使用 Trusted Publishing（OIDC）；
  `npm publish` 优先使用 OIDC，也可回退到 registry 令牌。

