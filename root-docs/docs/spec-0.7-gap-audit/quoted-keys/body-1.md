>>>>> lang=en
## 1. G1 — Quoted key segments do not exist (§ 5.3.3, § 4)

**Spec requirement** (`spec/versions/0.7/spec.md:1158`):

> A key segment MAY be written as a `<quoted-segment>` (§ 4) instead of a `<bare-segment>`: opened by `"`, `'`, or `` ` ``, running to the first unescaped occurrence of that SAME character, which closes it.

Supported by § 4 (`spec.md:418`): `<quoted-segment> ::= "\"" <dq-token>* "\"" | "'" <sq-token>* "'" | "`" <bt-token>* "`"`; the positional rule (`spec.md:1185`): a quote opens a segment "if and only if it is the first code point of a segment's raw text *after* the same edge-whitespace trimming"; content is never trimmed (`spec.md:1203`); nothing may follow the closer (`spec.md:1232`); quoting is **keys only** (`spec.md:1167`).

**Grammar today** (`grammar.js:136-163`): a key is only bare segments —

```js
key: $ => choice($._spaced_key, $.dotted_key),                       // 136-139
_spaced_key: $ => prec.left(repeat1($._key_segment)),                // 146
dotted_key: $ => prec.left(seq($._key_segment, repeat1(seq('.', $._key_segment)))),  // 148-151
_key_segment: $ => /([^\s\[\]\{\}\(\):#,.\r\n\\]|\\[\\,\}\]\{\[nr.:])+/  // 163
```

Quote characters are not excluded from `_key_segment`, so today they are ordinary key bytes — there is no delimiter concept at all.

**Demonstrated inputs** (all parses observed):

`"port": 1` — parses, but the key node spans the quotes; spec: key `port`, delimiters are pure syntax:
```
(object_pair [0, 0] - [1, 0]
  key: (key [0, 0] - [0, 6])
  separator: (sep_string [0, 6] - [0, 7])
  value: (integer [0, 8] - [1, 0]))
```

>>>>> lang=ru
## 1. G1 — Сегменты ключа в кавычках отсутствуют (§ 5.3.3, § 4)

**Требование спецификации** (`spec/versions/0.7/spec.md:1158`):

> Сегмент ключа МОЖЕТ быть записан как `<quoted-segment>` (§ 4) вместо `<bare-segment>`: он начинается с `"`, `'` или `` ` ``, продолжается до первого неэкранированного вхождения ТОГО ЖЕ символа, который его закрывает.

Это уточняет § 4 (`spec.md:418`): `<quoted-segment> ::= "\"" <dq-token>* "\"" | "'" <sq-token>* "'" | "`" <bt-token>* "`"`; правило позиции (`spec.md:1185`): кавычка открывает сегмент «тогда и только тогда, когда это первая кодовая точка необработанного текста сегмента *после* той же обрезки краёв»; содержимое не обрезается (`spec.md:1203`); после закрывающей кавычки ничего не может следовать (`spec.md:1232`); кавычки используются **только в ключах** (`spec.md:1167`).

**Текущая грамматика** (`grammar.js:136-163`): ключ состоит только из голых сегментов —

```js
key: $ => choice($._spaced_key, $.dotted_key),                       // 136-139
_spaced_key: $ => prec.left(repeat1($._key_segment)),                // 146
dotted_key: $ => prec.left(seq($._key_segment, repeat1(seq('.', $._key_segment)))),  // 148-151
_key_segment: $ => /([^\s\[\]\{\}\(\):#,\.\r\n\\]|\\[\\,\}\]\{\[nr.:])+/  // 163
```

Кавычки не исключены из `_key_segment`, поэтому сейчас они считаются обычными байтами ключа: понятия разделителя-синтаксиса нет.

**Наблюдавшийся вход**: `"port": 1` разбирается, но узел ключа включает кавычки; по спецификации ключ — `port`, кавычки являются только синтаксисом:
```
(object_pair [0, 0] - [1, 0]
  key: (key [0, 0] - [0, 6])
  separator: (sep_string [0, 6] - [0, 7])
  value: (integer [0, 8] - [1, 0]))
```

`"a.b": 1` разбирается как **составной ключ с точкой** (сегменты `"a`, `b"`); по спецификации это ОДИН плоский сегмент `a.b` (точка внутри кавычек не делит сегмент, `spec.md:537-544`):
```
key: (key [0, 0] - [0, 5]
  (dotted_key [0, 0] - [0, 5]))
```

>>>>> lang=zh
## 1. G1 — 不支持带引号的键段（§ 5.3.3、§ 4）

**规范要求**（`spec/versions/0.7/spec.md:1158`）：

> 键段可以写成 `<quoted-segment>`（§ 4），而不是 `<bare-segment>`：以 `"`、`'` 或 `` ` `` 开始，并延伸到首个未转义的同一字符，该字符闭合该段。

§ 4（`spec.md:418`）进一步规定：`<quoted-segment> ::= "\"" <dq-token>* "\"" | "'" <sq-token>* "'" | "`" <bt-token>* "`"`；位置规则（`spec.md:1185`）是：仅当引号为段原始文本经同样的边缘裁剪后的首个码点时，才开启键段；段内内容不裁剪（`spec.md:1203`）；闭合引号后不得有其他内容（`spec.md:1232`）；引号形式**仅用于键**（`spec.md:1167`）。

**当前语法**（`grammar.js:136-163`）：键仅由裸段组成——

```js
key: $ => choice($._spaced_key, $.dotted_key),                       // 136-139
_spaced_key: $ => prec.left(repeat1($._key_segment)),                // 146
dotted_key: $ => prec.left(seq($._key_segment, repeat1(seq('.', $._key_segment)))),  // 148-151
_key_segment: $ => /([^\s\[\]\{\}\(\):#,\.\r\n\\]|\\[\\,\}\]\{\[nr.:])+/  // 163
```

引号没有从 `_key_segment` 中排除，因此目前只是普通键字节，语法中没有引号分隔符的概念。

**实测输入：** `"port": 1` 可以解析，但键节点包含引号；规范中的键应为 `port`，引号只是语法符号：
```
(object_pair [0, 0] - [1, 0]
  key: (key [0, 0] - [0, 6])
  separator: (sep_string [0, 6] - [0, 7])
  value: (integer [0, 8] - [1, 0]))
```

`"a.b": 1` 被解析成**点分键**（段为 `"a` 和 `b"`）；规范要求它是一个平面键段 `a.b`（引号内的点号不能拆分键，`spec.md:537-544`）：
```
key: (key [0, 0] - [0, 5]
  (dotted_key [0, 0] - [0, 5]))
```

