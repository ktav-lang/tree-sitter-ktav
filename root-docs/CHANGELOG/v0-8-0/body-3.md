>>>>> lang=en
### Changed

- Conformance suite walks the spec **0.8.0** corpus (was 0.6) with no
  valid-fixture allow-list and checks root kinds against JSON oracles.
- Every `invalid/` fixture must surface a syntax error unless its
  expected error is semantic (`DuplicateKey`, `KeyPathConflict`,
  `InvalidUtf8`), which a context-free grammar cannot detect.
- Corpus guard validates manifest, version, and oracle schemas, and
  safely validates raw-byte fixture stems.
- CI: `cargo publish` uses Trusted Publishing (OIDC); `npm publish`
  prefers OIDC and can fall back to a registry token.

>>>>> lang=ru
### Изменено

- Conformance-набор обходит корпус спецификации **0.8.0** (ранее 0.6)
  без исключений valid-фикстур и сверяет вид корня с JSON-оракулами.
- Каждая фикстура `invalid/` обязана давать синтаксическую ошибку, если
  ожидаемая ошибка не семантическая (`DuplicateKey`, `KeyPathConflict`,
  `InvalidUtf8`) — такие контекстно-свободная грамматика обнаружить не может.
- Защитная проверка корпуса контролирует схемы manifest, версии и
  oracle, а также безопасно проверяет имена raw-byte фикстур.
- CI: `cargo publish` использует Trusted Publishing (OIDC);
  `npm publish` предпочитает OIDC, но может использовать токен реестра.

>>>>> lang=zh
### 变更

- 一致性套件现在遍历规范 **0.8.0** 语料（此前为 0.6），不再豁免
  有效样例，并根据 JSON 预期结果检查根类型。
- 每个 `invalid/` 样例都必须产生语法错误，除非其预期错误属于语义类
  （`DuplicateKey`、`KeyPathConflict`、`InvalidUtf8`）——上下文无关
  语法无法检测这类错误。
- 语料保护检查 manifest、版本和 oracle 的结构，并安全校验
  raw-byte fixture 的文件名。
- CI：`cargo publish` 使用 Trusted Publishing（OIDC）；
  `npm publish` 优先使用 OIDC，也可回退到 registry 令牌。

