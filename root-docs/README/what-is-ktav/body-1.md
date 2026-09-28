>>>>> lang=en
## What is Ktav?

Ktav (Hebrew **כְּתָב**, "writing") is a plain-text configuration
format with a JSON-shaped data model (scalars, arrays, objects, `null`,
booleans). Strings are unquoted, ordinary entries have no commas (inline
compounds use commas), and dotted keys (`server.port: 8080`) express
nesting. The full specification — the same
one all official Ktav implementations target — lives in the
[`ktav-lang/spec`](https://github.com/ktav-lang/spec) repository.

>>>>> lang=ru
## Что такое Ktav?

Ktav (иврит **כְּתָב**, «писание») — текстовый формат конфигурации
JSON-формы (скаляры, массивы, объекты, `null`, булево), но без кавычек
вокруг строк; между обычными элементами запятых нет, однако в inline-
структурах они используются. Для вложенности служат точечные ключи
(`server.port: 8080`). Полная спецификация (та же, на которую ориентируются
все официальные реализации Ktav) лежит в
[`ktav-lang/spec`](https://github.com/ktav-lang/spec).

>>>>> lang=zh
## 什么是 Ktav？

Ktav（希伯来语 **כְּתָב**，"书写"）是一种纯文本配置格式。形态与
JSON 相同（标量、数组、对象、`null`、布尔值），但字符串不加引号；
普通条目之间不使用逗号（内联复合结构中会使用逗号），并使用点式键
（`server.port: 8080`）表示嵌套。完整规范——所有官
方 Ktav 实现共同遵循的——在
[`ktav-lang/spec`](https://github.com/ktav-lang/spec) 仓库中。

