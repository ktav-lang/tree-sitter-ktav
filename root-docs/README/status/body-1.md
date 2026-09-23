>>>>> lang=en
## Status

`0.8.0` — implements [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md).
The grammar accepts every valid Ktav 0.8.0 document (verified against
all `tests/valid/*.ktav` fixtures from the spec repo). It is a
syntactic accepter, not a strict spec validator — see
[`CHANGELOG.md`](CHANGELOG.md) "Known limitations" for the small
number of pathological cases the grammar accepts that the spec
rejects (mostly missing-whitespace-after-marker — § 6.10).

>>>>> lang=ru
## Статус

`0.8.0` — реализует [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md).
Грамматика принимает любой валидный документ Ktav 0.8.0 (проверено на
всех фикстурах `tests/valid/*.ktav` из spec-репозитория). Это
синтаксический акцептор, а не строгий валидатор — небольшое число
патологических случаев, которые грамматика принимает, а спецификация
отвергает (в основном отсутствие пробела после маркера — § 6.10),
перечислено в разделе «Известные ограничения»
[`CHANGELOG.ru.md`](CHANGELOG.ru.md).

>>>>> lang=zh
## 状态

`0.8.0` — 实现 [Ktav 0.8.0](https://github.com/ktav-lang/spec/blob/main/versions/0.8/spec.md)。
语法接受所有合法的 Ktav 0.8.0 文档（对 spec 仓库下
`tests/valid/*.ktav` 全部用例验证通过）。它是一个语法接受器，而非
严格的规范校验器——少数语法接受但规范拒绝的边界情况（主要是
§ 6.10 “标记后必须有空格”）见 [`CHANGELOG.zh.md`](CHANGELOG.zh.md)
的“已知限制”一节。

