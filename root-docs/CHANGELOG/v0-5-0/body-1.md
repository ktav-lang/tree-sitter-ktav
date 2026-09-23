>>>>> lang=en
## [0.5.0] — 2026-05-27

Spec sync: tracks **Ktav 0.5.0** — a breaking revision of the
format. All changes below correspond to spec delta items listed in
spec 0.5.0 § 1 "Introduction".

### Breaking changes

- **Comment marker: `#` → `##`.**  The `comment` rule now matches
  `/##[^\r\n]*\r?\n/`. A single `#` byte is ordinary content and no
  longer opens a comment; it is valid in keys and scalar values.
  All comment corpus tests updated.

- **Typed markers removed: `:i` and `:f` no longer exist.**  The
  `sep_int` and `sep_float` node kinds are removed from the grammar.
  The only pair separators are now `:` (`sep_string`) and `::` (`sep_raw`).
  `array_item` no longer accepts `:i`/`:f` marker branches.
  Any document that previously used `:i`/`:f` must migrate to a bare
  `:` pair (the spec now infers the type from the scalar's lexical
  form — see number literals below).

### Added

>>>>> lang=ru
## [0.5.0] — 2026-05-27

Синхронизация со спецификацией: трекинг **Ktav 0.5.0** —
несовместимая ревизия формата. Все изменения ниже соответствуют
пунктам дельты спецификации, перечисленным в спецификации 0.5.0
§ 1 "Introduction".

### Несовместимые изменения

- **Маркер комментария: `#` → `##`.**  Правило `comment` теперь матчит
  `/##[^\r\n]*\r?\n/`. Одиночный байт `#` — обычное содержимое и больше
  не открывает комментарий; он допустим в ключах и скалярных значениях.
  Все corpus-тесты комментариев обновлены.

- **Типизированные маркеры удалены: `:i` и `:f` больше не существуют.**
  Виды узлов `sep_int` и `sep_float` убраны из грамматики. Теперь
  единственные разделители пар — `:` (`sep_string`) и `::` (`sep_raw`).
  `array_item` больше не принимает ветки маркеров `:i`/`:f`. Любой
  документ, использовавший `:i`/`:f`, должен быть переведён на голую
  пару `:` (спецификация теперь выводит тип из лексической формы
  скаляра — см. числовые литералы ниже).

### Добавлено

>>>>> lang=zh
## [0.5.0] — 2026-05-27

规范同步：跟进 **Ktav 0.5.0** —— 对格式的破坏性修订。以下所有变更
均对应规范 0.5.0 § 1"Introduction"中列出的规范增量条目。

### 破坏性变更

- **注释标记：`#` → `##`。**  `comment` 规则现在匹配
  `/##[^\r\n]*\r?\n/`。单个 `#` 字节是普通内容，不再开启注释；
  它在键与标量值中均合法。所有注释语料测试已更新。

- **类型化标记已移除：`:i` 与 `:f` 不再存在。**  节点类型 `sep_int`
  与 `sep_float` 已从语法中删除。现在仅有的键值对分隔符是 `:`
  （`sep_string`）与 `::`（`sep_raw`）。`array_item` 不再接受
  `:i`/`:f` 标记分支。任何此前使用 `:i`/`:f` 的文档都必须迁移到
  裸 `:` 键值对（规范现在从标量的词法形式推断类型 —— 见下文
  数字字面量）。

### 新增

