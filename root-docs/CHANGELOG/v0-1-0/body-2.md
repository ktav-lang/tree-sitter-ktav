>>>>> lang=en
### Known limitations

- The grammar does **not** enforce the spec's "mandatory whitespace
  after marker" rule (§ 6.10) — `key:value` parses as `key + sep_string`
  with `value` becoming part of the scalar. Lints / consumers that
  need strict v0.1.0 compliance should run the upstream spec
  conformance suite via the canonical implementations.
- Multi-line string content is captured as opaque `multiline_content_line`
  tokens; the parser cannot detect content lines whose trimmed form
  equals the block terminator with trailing whitespace pathologies
  (§ 5.6.1 edge cases). Real-world documents are unaffected.
- Indentation is not enforced — Ktav itself is not
  indentation-significant, so this matches the spec.
>>>>> lang=ru
### Известные ограничения

- Грамматика **не** проверяет правило «обязательный пробел после
  маркера» (§ 6.10): `key:value` будет разобрано как
  `key + sep_string` с `value`, попадающим в scalar. Потребителям,
  которым нужна строгая v0.1.0-совместимость, следует запускать
  апстримный conformance-набор спецификации через каноничные
  реализации.
- Содержимое многострочных строк захватывается как непрозрачные
  `multiline_content_line`-токены; парсер не различает edge-case-ы
  закрывателя с пробелами (§ 5.6.1). На реальных документах это
  незаметно.
- Отступы не проверяются — это соответствует спецификации (Ktav не
  индентационно-значимый язык).
>>>>> lang=zh
### 已知限制

- 语法**不**强制规范中"标记后必须有空格"规则（§ 6.10）：
  `key:value` 会被解析为 `key + sep_string`，`value` 进入 scalar。
  需要严格 v0.1.0 一致性的消费者请使用规范实现与一致性测试套件。
- 多行字符串内容以不透明的 `multiline_content_line` 词元捕获；解析
  器无法识别带尾随空白的封闭符边界条件（§ 5.6.1）。在真实文档中没
  有影响。
- 不强制缩进——这与规范一致（Ktav 并非缩进敏感的格式）。
