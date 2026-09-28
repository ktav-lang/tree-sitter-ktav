# Ktav 0.7.0 规范语法差距审计（`tree-sitter-ktav`）

> 历史审计：记录 2026-09-16 的状态，不代表当前符合性结论。

- **分支：** `spec-0.7-audit` · **日期：** 2026-09-16
- **固定的规范版本：** `spec/` 子模块从 `c9593e8`（v0.6.0-4）更新到 `04f867f`（**v0.7.0**；通过 `git -C spec log -1` 和 `git -C spec describe --tags` 核实）。
- **被审计语法：** `grammar.js` 共 444 行（本次审计未改动它；`src/` 未触及；未运行 `tree-sitter generate`）。
- **基线：** 修改前 `tree-sitter test` 为 54/54 通过；修改后为 55/55（一条 corpus 测试，见 § 10）。
- **方法：** 下文每项关于解析器行为的结论，均通过仓库内已生成的解析器（tree-sitter CLI 0.26.13，按声明的 devDependency 安装至 Git 忽略的 `node_modules/`）对 Git 忽略的 `build/scratch/` 中字节精确的输入实测。语法树片段按原样粘贴（已删 CLI 警告横幅与计时行；位置为字节偏移）。集合中未经单独测试的成员明确标为 INFERRED。

## 0. 摘要

| 编号 | 差距（规范章节） | 当前失败方式 | 负责人（已排定任务） | 是否需要外部扫描器？ |
|---|---|---|---|---|
| G1 | 引号键（§ 5.3.3、§ 4） | 语法树错误 / 报错 / 错误接受 | **引号键任务** | 否 |
| G2 | 转义形式为 10 种而非 14 种（§ 3.7、§ 3.7.1） | 有效输入解析失败 | **\uXXXX + BOM 任务** | 仅孤立代理项诊断需要 |
| G3 | 25 个空白码点集合（§ 3.3、§ 4） | 键/值静默损坏且误拒绝输入 | **未分配，待人工决定** | 否（但需改 scanner.c 的 C 代码） |
| G4 | 开头 BOM（§ 3.1） | 结构上未实现（偶然表现接近正确） | **\uXXXX + BOM 任务** | 否 |
| G5 | 根类型判定（§ 5.0.1/§ 5.1） | 接受规范无效输入，语法树形状不同 | **未分配，待人工决定** | 若要强制执行则需要 |
| G6 | 单独 CR 作为行结束符（§ 3.2） | 解析时报错 | **重新生成并保持测试通过** | 否 |
| G7 | 简化形式的尾随空白裁剪（§ 5.6） | **无**，语法兼容 | 无 | 不适用 |

严重性判断：G3 最危险（解码后的键被静默改错，且无错误提示）；G1/G2 虽会报错，却阻断了 0.7 的键和转义功能；G4/G6 是健壮性问题；G5 属于设计决策。

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

`"a}b": 1` 在键内产生 ERROR；规范允许键 `a}b`（引号内的 `}` 是普通内容）：
```
key: (key [0, 0] - [0, 5]
  (ERROR [0, 2] - [0, 3]))
```

`` `a:b`: 1 `` 恢复错误：键为 `` `a ``，ERROR 区域覆盖 `` :b` ``，直到第二个冒号才找到分隔符；规范允许键 `a:b`：
```
key: (key [0, 0] - [0, 2])
(ERROR [0, 2] - [0, 5]
  (sep_string [0, 2] - [0, 3]))
separator: (sep_string [0, 5] - [0, 6])
```

`"a" "b": 1` 被接受为一个 7 字节键；规范要求 `InvalidKey`，因为「一个键段中不能将带引号的内容与后续裸内容或另一个带引号内容组合」（`spec.md:1236-1238`）：
```
key: (key [0, 0] - [0, 7])
```

`k: {"a,b": 1, c: 2}` 中，引号键里的逗号目前仍被当作结构符号：只有在第一个键的逗号位置嵌入 ERROR 才能恢复出两项；规范要求两项均正常解析，且逗号在引号内不透明（`spec.md:1337-1351`）：
```
(inline_pair [0, 4] - [0, 12]
  key: (key [0, 4] - [0, 9]
    (ERROR [0, 6] - [0, 7]))
  ...)
(inline_pair [0, 14] - [0, 18]
  key: (key [0, 14] - [0, 15])
  ...)
```

`'tis the season: fa`（文档首行）被解析为键为 `'tis the season` 的 `object_pair`；按 0.7，开头的 `'` 开启一个**未闭合的引号段**，分隔符扫描找不到分隔符，尚未确定的根类型依 § 5.0.1 规则 7 归为根 **Array** 中的字符串项（`spec.md:1292-1296`，这是破坏性变更）：
```
(object_pair [0, 0] - [1, 0]
  key: (key [0, 0] - [0, 15])
  separator: (sep_string [0, 15] - [0, 16])
  value: (scalar [0, 17] - [1, 0]))
```

符合规范的反例（无需更改）：`port": 1` 解析出的键为 `port"`；位于**段中间**的引号在 0.7 仍是普通 `<key-char>`（`spec.md:1199-1202`）。

**必须实现：**键语法增加带引号段（三种定界符；由首个未转义的同一字符闭合；自身定界符用 `\"` / `\'` / `` \` `` 转义，见 G2；内容不裁剪；段内 `. : , { } [ ]` 均不作为结构符号；结束引号与后续点号/分隔符之间只能有空白，否则属于上例的 `InvalidKey`）。

**负责人：** **引号键任务**。

**难度 / 扫描器：**键段可由一个正则 token 表达（三种定界符选项；字符类仅排除当前定界符和控制字节/DEL；并纳入 14 种转义，包括 `\uXXXX`）。整段由单一 token 消费，因此点号、冒号、逗号和括号自然保持不透明，无需外部扫描器。必须重构 `word: $ => $._key_segment`（`grammar.js:76`）：`_key_segment` 增加多个备选后不能继续作为 `word`，因为 tree-sitter 的 word 必须是单一 token。与根类型的交互（`'tis the season`）属于 G5；`UnterminatedQuotedKey` 与 `MissingSeparator`（§ 6.16）的选择属于错误分类，而非语法树形状。

## 2. G2 — 转义表：语法支持 10 种，0.7.0 定义 14 种（§ 3.7、§ 3.7.1）

**规范要求**（`spec.md:234`）：识别「十四种」转义序列。语法缺少其中四种（`spec.md:255-258`）：

| 序列 | 替换结果 |
|---|---|
| `\"` | `"`（双引号字面字符） |
| `\'` | `'`（单引号字面字符） |
| `` \` `` | `` ` ``（反引号字面字符） |
| `\uXXXX` | Unicode 码点 `U+XXXX`，详见下文 |

`\uXXXX` 规则（`spec.md:303-332`）：必须恰好有**四位**十六进制数字（`[0-9a-fA-F]`，大小写均可）；少于四位属于 `BadEscapeSequence`，且不得部分消费。代理项对合并成 BMP 之外的码点。高代理项后未紧接有效低代理项 `\uXXXX`，或低代理项前没有紧邻的高代理项，都属于**孤立代理项**，应报告 `BadEscapeSequence`。Unicode 转义仅适用于内联标量值和键，不适用于多行标量、多行字符串内容（`(…)` / `((…))`，§ 5.6）或注释。§ 4（`spec.md:412-415`）将相同形式加入 `<key-escape>`/`<escapable-byte>`。

**当前语法：**两处均只有十种双字节形式——
- `grammar.js:163`：`_key_segment: /([^\s\[\]\{\}\(\):#,\.\r\n\\]|\\[\\,\}\]\{\[nr.:])+/`（转义类缺少 `"`、`'`、`` ` `` 和 `\u`）
- `grammar.js:301-312`：`escape_sequence: token(choice('\\\\','\\,','\\}','\\]','\\{','\\[','\\n','\\r','\\.','\\:'))`

来源：语法与 0.6 规范完全一致（0.6 § 3.7 写的是「十种」）；0.6.1–0.6.4 没有增加转义形式（0.6.4 仅改动浮点规范化，见 `spec/CHANGELOG.md:504-516`）。附录 A 称转义表从十一项增至十四项（`spec.md:3428`），与 0.6 的「十项」相矛盾，属于编辑错误；应以 0.7 的规范性十四项表为准。

**实测输入：**

`a\u0041b: 1` 报 ERROR（恢复时生成无关的 `multiline_content_line`）；规范要求它是有效键 `aAb`：
```
(ERROR [0, 0] - [1, 0]
  (multiline_content_line [0, 1] - [1, 0]))
```

`a\u002Eb: 1` 报 ERROR；规范要求得到**平面键** `a.b`。`\u002E` 与 `\.` 一样解码，解码结果不会再次被识别为结构分隔符（`spec.md:530-536`、`237-241`）。

`k: {x: A\u0041B}` 在内联值中报 ERROR；规范要求内联标量 `AAB`（类型为 String：识别到转义会强制归类，§ 5.2 规则 14）：
```
(ERROR [0, 0] - [1, 0]
  (key [0, 0] - [0, 1])
  (sep_string [0, 1] - [0, 2])
  (inline_pair [0, 4] - [0, 8] ... )
  (multiline_content_line [0, 8] - [1, 0]))
```

`k: {\uD83D\uDE00}` 报 ERROR，但规范认为有效（代理项对合并为一个 BMP 之外的码点）。`k: {\uD800}` 被语法和规范都拒绝（孤立代理项 = `BadEscapeSequence`），但语法只是碰巧拒绝，因为没有 `\u` token；恢复结果是无关内容，且没有可诊断节点。

符合规范的边界案例（已实测并在 § 10 的 corpus 中固定）：`a: \u0041` 解析为普通 `(scalar)`。整行值不处理转义；六个字节是字面内容，符合 0.7。

**必须实现：**在 `_key_segment`（裸键和带引号键）及 `escape_sequence`（内联标量）中支持 `\"`、`\'`、`` \` ``、`\uXXXX`，必须恰好四位十六进制且不得部分消费；格式错误时应报错。

**负责人：** **\uXXXX + BOM 任务**。

**难度 / 扫描器：**这些 token 可由正则表达式表示（`\\u[0-9a-fA-F]{4}` 及三种双字节引号转义）。正则词法器无法跨 token 验证孤立代理项：可在 `src/scanner.c` 中增加状态，或在语法层接受、再由参考解析器报告 `BadEscapeSequence`（诊断方式的取舍；见 § 12）。

## 3. G3 — 空白集合：语法仅支持 ASCII，规范要求 25 个码点（§ 3.3、§ 4）

**规范要求**（`spec.md:127-139`）：恰好 25 个码点，即 Unicode 6.3 的 `White_Space`：`U+0009 U+000A U+000B U+000C U+000D U+0020 U+0085 U+00A0 U+1680 U+2000–U+200A U+2028 U+2029 U+202F U+205F U+3000`。不得增减，也不得交由宿主语言决定。§ 4 将 `ws` 限定在单行内（LF/CR 除外），用于缩进、空行、`<sep-end>`（`spec.md:546`）、闭合行以及键边缘裁剪；键内部的空白保留（`spec.md:443-445`）。附录 A（`spec.md:3333`）还要求 VT `0x0B` 和 FF `0x0C` 的原始字节可作为键内容。

**当前语法：**
- `grammar.js:61-65`：`extras: $ => [ /[ \t]+/ ]`，缩进和 token 间仅跳过空格/制表符。
- `_key_segment`（163）、`_inline_scalar_head`（318）、`_inline_scalar_text`（323）、`_top_scalar_text`（362）、`_raw_scalar_text`（396）、`_scalar_text`（406）、`integer`（427）、`float`（432）均使用 `\s`。
- `src/scanner.c:72-74` 中 `is_h_ws` 仅指空格/制表符；`src/scanner.c:118` 的 `_marker_ws` 只接受 `' ' '\t' '\n' '\r' 0`。

**实测校准：**tree-sitter 编译此语法后的 `\s` 只匹配 ASCII 空白。实测 NEL（U+0085）、NBSP（U+00A0）、U+FEFF、U+3000 会由取反字符类 `[^\s...]` 作为内容匹配；VT、FF 会被 `\s` 排除。INFERRED、未逐个探测：U+1680、U+2000–U+200A、U+2028、U+2029、U+202F、U+205F 与 NBSP 表现相同。不论如何，语法集合两边都不符合规范。

**失败 A — 键被静默破坏：**`a: 1` 后若一行以 NEL 缩进（`\u0085b: 2`），NEL 会粘入键文本；规范将 NEL 视为空白，键应为 `b`：
```
(object_pair [1, 0] - [2, 0]
  key: (key [1, 0] - [1, 3])      # 3 bytes = NEL(2) + 'b'
  separator: (sep_string [1, 3] - [1, 4])
  value: (integer [1, 5] - [2, 0]))
```

NBSP（`04`）和 U+3000（`29`）也观察到相同键形状。没有 ERROR 节点，解码后的键被静默破坏。

**失败 B — 值/空行静默损坏：**`a: <NBSP>x` 中标量范围包含 NBSP；按 § 3.3 裁剪后值应为 `x`（实测 `value: (scalar [0, 3] - [1, 0])`）。只有 NBSP 的行被解析为 `top_array_item (top_scalar)`，但 § 3.5 规定仅含空白的行应为空行（实测编号 `28`）。

**失败 C — 误拒绝规范有效文档：**
- `a: 1` 后的 FF 缩进 `\u000Cb: 2` 产生 `(ERROR [1, 0] - [2, 0] (multiline_content_line ...))`；规范规定 FF 是空白（`06`）。
- `a\u000Bb: 1`（键内 VT）报错，但附录 A 要求 VT/FF 原始字节可作为键内容（`05`）。
- `a:<NBSP>1` 报错并恢复为垃圾内容加 `top_scalar`；`<sep-end>` 允许 `1*ws`，故应解析为键值对。`_marker_ws` 只检查五种 ASCII 字节（`25`）。
- `}` + NBSP + 换行无法作为对象闭合符解析；规范允许 `(ws) "}" (ws) <line-end>`。根因是 `is_h_ws`（`30`）。

FF 缩进、键中的 VT/FF、冒号后的 NBSP、闭合行中的 NBSP 分别由字节精确用例 `06`、`05`、`25`、`30` 探测。前两项会误拒绝有效输入；后两项也表明扫描器按 ASCII 字节列表判断，而非使用规范集合。

**必须实现：**对 `extras`、所有内容空白排除项（按位置将 VT/FF 作为键内容；非 ASCII 空白不得成为解码后的键/标量内容）、`_marker_ws`、`is_h_ws`/`_strict_eol` 以及注释/空行的前导 `ws` 使用精确 25 点集合。

**负责人：**三个已排任务均未涵盖，见 § 11。建议并入 `\uXXXX` + BOM 的词法基础任务。

**难度 / 扫描器：**可直接用显式的单行字符类 `[\t\u000B\u000C\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]`。不得使用 `\s` 或宿主语言的 `is_whitespace` 函数。需同步修改 `src/scanner.c` 字节集合；无需增加外部扫描器。

## 4. G4 — 文档开头的字节顺序标记（BOM，§ 3.1）

**规范要求**（`spec.md:97-101`）：只在 U+FEFF 为首个码点/字节时跳过一个；后续 U+FEFF 是普通内容，不是空白。0.7.0 新增；0.6.4 未规定（附录 A，`spec.md:3306-3312`）。

跳过必须发生在读取任何其他字节之前；第二个 U+FEFF 必须保留在输入中。这是“恰好一个”的规则，不是通用 BOM 清除。

**当前语法：**`grammar.js:83` 为 `source_file: $ => repeat($._line)`；无 BOM token，因此开头 U+FEFF 不匹配任何 token。

**实测输入：**
- `EF BB BF` + `a: 1\n`：键值对可解析，但 source 从 `[0, 3]` 开始；BOM 未被节点覆盖，靠词法错误恢复消失：
```
(source_file [0, 3] - [1, 0]
  (object_pair [0, 3] - [1, 0]
    key: (key [0, 3] - [0, 4]) ...))
```
- 两个 BOM 后接 `a: 1\n`：第一个靠恢复吞掉，第二个进入键成为 `\uFEFFa`（`key [0, 3] - [0, 7]`），结果正确但原因错误。语法未编码偏移零处恰好一个 BOM；BOM 在注释前的情况未探测。
- 仅 BOM 得到 `(source_file [0, 3] - [0, 3])`（空树）。`b\uFEFFc: 2` 中间的 BOM 保留为内容，符合规范。

**必须实现：**明确保证仅跳过开头的一个 U+FEFF。

**负责人：** **\uXXXX + BOM 任务**。

**难度 / 扫描器：**在开头加可选 token 即可，如 `source_file: $ => seq(optional(/\uFEFF/), repeat($._line))`；无需外部扫描器。

## 5. G5 — 未强制检查根类型（§ 5.0.1、§ 5.1）

**规范要求**（`spec.md:808-817`）：首个内容行固定根类型。在顶层 Array 中，看似键值对的文本（如 `host: localhost`）仍是裸字符串标量（§ 5.4 规则 9），不得重新分类为键值对。在顶层 Object 中，没有 `:` 的裸标量属于 `MissingSeparator`。规则 2–5 及 § 6.14 规定：顶层内联复合值或单独开符之后再有内容行，应报 `OrphanLineAfterTopLevelInline`。

因此，若要强制此规则，CST 层的要求是分类和树形；tree-sitter 本身不能表达参考解析器的类型化错误分类。

**当前语法**（`grammar.js:79-91`）明确委托处理：
```js
// The top-level document is a sequence of lines. Per spec § 5.0.1
// the root may be either an Object or an Array. Tree-sitter accepts
// both kinds of line anywhere; semantic dispatch is left to the
// reference parser.
source_file: $ => repeat($._line),
```

**实测输入：**
- `a: 1` + `plain` 被接受为键值对和 `top_array_item(top_scalar)`；规范要求根为 Object，第二行报 `MissingSeparator`（`20`）。
- `:: x` + `host: localhost` 被解析为数组项加键值对；规范要求根为 Array，第二行是字符串项 `host: localhost`（token 相同，树形不同，`21`）。
- `{a: 1}` + `b: 2` 两行均被接受；规范要求 `OrphanLineAfterTopLevelInline`（`22`）。
- G1 的交互：首行 `'tis the season: fa` 必须成为根 Array 字符串项（`18`）。

**若强制执行，必须得到：**由首个内容行决定整份文档的分派，并保持上述树形：键值对后不能有 `top_scalar`；裸数组项后不能有 `object_pair`；顶层内联值后不能再有键值对。解析器本身无法区分错误与异常接受。

**负责人：**未分配，见 § 11。根状态分派是上下文相关的，需要有状态外部扫描器，或继续明确委托参考解析器。审计不预先选择方案。

## 6. 单独的 `CR` 不是行终止符（§ 3.2）

**规范要求**（`spec.md:105-111`）：LF（`0x0A`）、CR（`0x0D`）和 CR LF（`0x0D 0x0A`）是等价行终止符。`spec.md:114` 规定解析时 CR 不得作为内容。

**当前语法：**`grammar.js:95` 中 `_newline: $ => /\r?\n/`；`comment`（103）、`_top_scalar_text`（362）、`multiline_content_line`（377）、`integer`（427）和 `float`（432）也嵌入同一形式。但外部扫描器的 `consume_line_terminator`（`src/scanner.c:90-97`）已接受单独 CR，因此闭合符可用 CR 结束，而 `_newline` 不行。

**实测输入：**`a: 1\rb: 2\r`：
```
(ERROR [0, 0] - [0, 10]
  (key [0, 0] - [0, 1])
  (sep_string [0, 1] - [0, 2])
  (ERROR [0, 4] - [0, 5])
  (sep_string [0, 6] - [0, 7])
  (ERROR [0, 9] - [0, 10]))
```

规范要求得到两个无错误键值对。此问题早于 0.7，但仍属规范要求。**必须实现：**语法/扫描器消费行结束符的所有位置都接受 `\r\n | \r | \n`。**负责人：**重新生成并保持测试通过的任务。**难度：**无需新扫描器；改约七处 regex，保留现有扫描器逻辑，并在 `basic.txt` 加测试（字节不可见，见 § 10）。

## 7. 简化形式的尾随空白裁剪：语法无需更改（§ 5.6）

0.7 之前，简化多行形式逐行保留尾随空白；0.7 改为去除公共缩进后裁剪两侧（`spec.md:1418-1422`）。`((…))` 仍逐字保留。实测 `(` + `\n  abc \n` + `)` 的内容行原样捕获：
```
(top_array_item [0, 0] - [3, 0]
  value: (multiline_stripped [0, 0] - [3, 0]
    (open_paren [0, 0] - [1, 0])
    (multiline_content_line [1, 0] - [2, 0])
    (close_paren [2, 0] - [3, 0])))
```

裁剪属于 Value 层计算（公共前缀、行尾裁剪、以 `\n` 拼接），CST 看不到。原样捕获与规范兼容；参考解析器随后完成裁剪。无需改 `grammar.js`。未加 corpus 用例，因为编辑器通常会删除行尾空格，使测试不稳定。

## 8. 不影响语法的 0.7.0 项目（已核查，无需处理）

- **§ 6.15 `InvalidUtf8`** 是按字节检查，必须早于行处理或语法解析。tree-sitter 的 ABI 输入已是有效 UTF-8，因此应由嵌入式解析器负责，而非 `grammar.js`。
- **§ 5.2 规则 14：**已识别的转义会在关键字/数字判定前强制归类为 String。这属于解码后值的语义；CST 提供 `escape_sequence` 节点供参考解析器使用。
- **§ 6.13 的 `BadEscapeSequence` 分类**（格式错误的 `\u`、孤立代理项）涉及错误名称；结构层面的部分见 G2。
- **写入端规则：**§ 5.9.0 可表示 Values、§ 5.9.8 浮点边界/零、§ 5.9.10 键重转义偏好、§ 5.9.12 首个输出字节限制及 § 8 数值范围注意事项都影响规范化写入，不影响解析。
- **过时注释（仅外观问题）：**`grammar.js:4` 仍引用 spec 0.6；`src/scanner.c:8` 仍将已删除的 `:i`/`:f` 标记列在 `_marker_ws` 后跟的分隔符中。不影响行为。

## 9. `\uXXXX` 的处理与不处理位置（§ 3.7.1）

| 上下文 | 0.7.0 规范 | 当前语法 |
|---|---|---|
| 裸键段 | 解码；解码后的码点不再作为结构符号检查 | 不识别，报 ERROR（`a\u0041b: 1`） |
| 带引号键段 | 解码 | 不支持引号段（G1），也没有 `\u`（G2） |
| 内联标量值 | 解码并强制归类为 String | 不识别，报 ERROR（`k: {x: A\u0041B}`） |
| 整行标量值 | 不处理，作为字面内容 | 一致；实测为 `(scalar)`，且已加 corpus 用例 |
| 多行 `((…))` / `(…)` 内容 | 不处理，逐字保留 | 结构一致；`multiline_content_line` 不透明 |
| 注释 | 不处理 | 一致；`comment` 不透明 |

## 10. Corpus 测试集

**本审计新增**（唯一的 corpus 变更；测试共 55/55 通过）：在 `test/corpus/escape_sequences.txt` 添加用例 “Whole-line scalar value: backslash-u sequence is literal content (spec 0.7 § 3.7 boundary — no escape processing here)”，输入为 `a: \u0041`，预期 `(scalar)`。该输入当前可正确解析，用于固定 G2 修复不得破坏的“不处理转义”边界。

**`test/corpus/typed_markers.txt`：名称不准确，但并未过时。**唯一用例 “Raw string marker (spec 0.5.0 — only :: remains)” 包含三组 `::` 键值对（`pattern:: [a-z]+`、`ipv6:: [::1]:8080`、`template:: {issue.id}.tpl`），预期树仅含 `sep_raw`/`raw_scalar`。已删除的 `:i`/`:f` 不存在，测试通过。它记录了仍保留的标记，只是文件名容易让人想到已移除功能。改名 `raw_markers.txt` 属外观调整，留给维护者决定。

建议的回归测试位置（修复前不得把失败输入加入 corpus；红测不是待办标记）：

| 差距 | 建议的 corpus 文件 |
|---|---|
| G1 | `edge_keys.txt`（三种定界符、位置规则、`"a" "b"`、转义定界符）；`dotted_keys.txt`（`"a.b"`、`a."b.c".d`）；`inline_compounds.txt`（`{"a}b": 1, c: 2}`、`{"a,b": 1, c: 2}`）；`basic.txt`（`"port": 1`）；`spec-conformance.txt`（`'tis the season: fa`） |
| G2 | `escape_sequences.txt`（键/内联 `\uXXXX`、代理项对、孤立代理项 `:error`、键/值中的引号转义）；整行负例已存在 |
| G3 | `edge_keys.txt` + `mixed.txt`（键内 VT/FF、NBSP/U+3000 缩进、`a:<NBSP>1`、纯 NBSP 空行、NBSP 闭合符） |
| G4 | `spec-conformance.txt`（开头 BOM） |
| G5 | `spec-conformance.txt`（键值对后标量/内联值后孤立行的 `:error`；Array 中类似键值对的行） |
| G6 | `basic.txt`（仅 CR 及 CR/LF/CRLF 混合） |

注意：NBSP、VT、FF、BOM、单独 CR 和行尾空格不易察觉，且可能被编辑器/工具规范化。稳健测试应优先采用字节级 fixture；文本 corpus 只放不易被改写的可见案例。

## 11. 已排任务归属与待人工决定事项

- **引号键任务：**G1（§ 1 全部内容）。
- **`\uXXXX` + BOM 任务：**G2（§ 2）和 G4（§ 4）。
- **重新生成并保持测试通过：**G6（§ 6）；上述每项修复后还需执行 `tree-sitter generate` 并通过完整相关测试。
- **人工决定 1 — G3 归属：**空白差距既不属于引号键，也不属于 `\uXXXX` + BOM。建议并入词法基础任务或另立任务；无论哪种都必须修改 `src/scanner.c`。
- **人工决定 2 — G2 孤立代理项：**在语法层借助外部扫描器状态拒绝，或语法接受 `\uD800` 并由参考解析器报告 `BadEscapeSequence`。规范结果相同，但 CST 与诊断不同。
- **人工决定 3 — G5：**维持 `grammar.js:79-82` 中将根类型委托给参考解析器的设计，或用有状态外部扫描器强制检查。G1 的 `'tis the season` 破坏性变更与此决定相关。

## 12. 外部扫描器总结

- **无需外部扫描器：**G1（引号键的正则 token，单 token 消费自然保证内容不透明）、G3（硬编码的 25 码点集合及修改现有 `scanner.c` 字节集合）、G4（`optional(/\uFEFF/)`）、G6（替换行结束符正则）。
- **仅在以下选择下才需新增 C 外部扫描逻辑：**G2 若要在解析时拒绝孤立代理项（需跨 token 状态），或 G5 若要强制检查根类型（需跟踪文档状态）。改由语义层拒绝或继续委托参考解析器都不需新扫描器逻辑，见 § 11。
- 现有外部扫描器 token `_marker_ws`、`_strict_eol`、`_stripped_close`、`_verbatim_close` 保留；G3 会扩大其接受的字节集合。

## 13. 来源记录

- CLI：`tree-sitter` 0.26.13；`package.json` 声明范围为 `^0.26.0`。安装在 Git 忽略的 `node_modules/` 中；未做其他环境更改。
- 演示输入是 Git 忽略的 `build/scratch/` 下字节精确的文件；审计后已删除。`build/` 下内容不应提交。
- `spec/` 子模块：`04f867fbb338f97f3d3ec30d74af8373ff42d8b8` 对应标签 `v0.7.0`，通过 `git -C spec log -1` 和 `git -C spec describe --tags` 核实。
- 测试集：修改前 54/54 通过，修改后 55/55。未改 `grammar.js` 或 `src/`；未运行 `tree-sitter generate`；未触及版本字段。
