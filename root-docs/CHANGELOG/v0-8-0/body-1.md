>>>>> lang=en
## [0.8.0] — 2026-09-28

Grammar tracks Ktav spec **0.8.0** (spec submodule pinned to `v0.8.0`)
and covers every syntax change since 0.6: 0.7.0's quoted keys, escape
table, whitespace set and root-kind rules, and 0.8.0's § 5.2 leading-zero
typing rule. The crate/package version moves to **0.8.0**, in step with
the core and the specification (0.7.x was never tagged for this package).

### Added

- Quoted key segments (§ 5.3.3): a key segment may be written `"…"`,
  `'…'` or `` `…` `` instead of bare, per dotted-path segment, and is
  distinguished from a bare key in `queries/highlights.scm`. An empty
  quoted segment (`""`, `''`, ` `` `) is a parse error (`EmptyKey`,
  § 6.5); `" "` is a valid one-space key.
- The escape table is complete, at 14 forms (§ 3.7), including `\uXXXX`
  with surrogate pairs (§ 3.7.1); a lone surrogate, or a high surrogate
  not followed by a low one, is a parse error (`BadEscapeSequence`).
- Inline values inside `{...}` and `[...]` are typed like whole-line
  values: `integer`, `float` and `keyword` nodes instead of
  `inline_scalar`, whatever the literal's length (§ 5.2, § 5.8). An
  escape forces String (§ 3.7), and `::` values stay raw (§ 5.8.5).
- Exactly one leading byte-order mark is skipped (§ 3.1).

>>>>> lang=ru
## [0.8.0] — 2026-09-28

Грамматика следует спецификации Ktav **0.8.0** (submodule спецификации
закреплён на `v0.8.0`) и покрывает все синтаксические изменения после
0.6: ключи в кавычках, таблицу экранирования, набор пробельных символов
и правила вида корня из 0.7.0, а также типизационное правило § 5.2 о
ведущем нуле из 0.8.0. Версия crate/пакета поднимается до **0.8.0**, в
ногу с ядром и спецификацией (0.7.x для этого пакета тегирован не был).

### Добавлено

- Сегменты ключа в кавычках (§ 5.3.3): сегмент ключа можно записать как
  `"…"`, `'…'` или `` `…` `` вместо голого, для каждого сегмента
  точечного пути; в `queries/highlights.scm` такой сегмент отличается
  от голого ключа. Пустой сегмент в кавычках (`""`, `''`, ` `` `) —
  ошибка разбора (`EmptyKey`, § 6.5); `" "` — корректный ключ из одного
  пробела.
- Таблица экранирования полна: 14 форм (§ 3.7), включая `\uXXXX` с
  суррогатными парами (§ 3.7.1); одиночный суррогат или старший суррогат
  без следующего младшего — ошибка разбора (`BadEscapeSequence`).
- Inline-значения внутри `{...}` и `[...]` типизируются как значения
  целой строки: узлы `integer`, `float` и `keyword` вместо
  `inline_scalar` независимо от длины литерала (§ 5.2, § 5.8).
  Экранирование делает значение строкой (§ 3.7), а значения после `::`
  остаются raw (§ 5.8.5).
- Ровно один ведущий байтовый маркер порядка байт (BOM) пропускается (§ 3.1).

>>>>> lang=zh
## [0.8.0] — 2026-09-28

语法跟随 Ktav 规范 **0.8.0**（spec 子模块固定在 `v0.8.0`），并覆盖
0.6 以来的全部语法变更：0.7.0 的带引号键、转义表、空白字符集和根类型
规则，以及 0.8.0 的 § 5.2 前导零类型推断规则。crate/包版本随之升至
**0.8.0**，与核心库及规范保持一致（本包从未发布过 0.7.x 标签）。

### 新增

- 带引号的键段（§ 5.3.3）：键段可写作 `"…"`、`'…'` 或 `` `…` ``
  而非裸段，按点分路径逐段适用；此类键段在 `queries/highlights.scm`
  中与裸键区分。空的带引号键段（`""`、`''`、` `` `）属于解析错误
  （`EmptyKey`，§ 6.5）；`" "` 是合法的单空格键。
- 转义表已完整，共 14 种形式（§ 3.7），包括支持代理对的 `\uXXXX`
  （§ 3.7.1）；单独的代理项，或其后未跟低代理项的高代理项，属于
  解析错误（`BadEscapeSequence`）。
- `{...}` 和 `[...]` 中的内联值与整行值一样进行类型区分：生成
  `integer`、`float` 和 `keyword` 节点，而非 `inline_scalar`，与
  字面量长度无关（§ 5.2、§ 5.8）。含转义的值一律为字符串（§ 3.7），
  `::` 之后的值保持 raw（§ 5.8.5）。
- 跳过恰好一个前导的字节顺序标记（BOM）（§ 3.1）。

