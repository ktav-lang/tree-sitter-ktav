>>>>> lang=en
## 13. Provenance

- CLI: `tree-sitter` 0.26.13 — the version range declared in `package.json` (`^0.26.0`), installed into gitignored `node_modules/`; no other environment change.
- All demo inputs were byte-exact files under gitignored `build/scratch/` (deleted after the audit; nothing under `build/` is committable).
- `spec/` submodule: `04f867fbb338f97f3d3ec30d74af8373ff42d8b8` = tag `v0.7.0` (verified with `git -C spec log -1` and `git -C spec describe --tags`).
- Suite: 54/54 green before; 55/55 green after this audit. `grammar.js` and `src/` untouched; `tree-sitter generate` not run; no version fields touched.
>>>>> lang=ru
## 13. Происхождение

- CLI: `tree-sitter` 0.26.13; диапазон в `package.json` — `^0.26.0`. Установлен в игнорируемый `node_modules/`; других изменений среды не было.
- Демонстрационные входы были побайтно точными файлами в игнорируемом `build/scratch/`; после аудита их удалили. Содержимое `build/` не предназначено для коммита.
- Submodule `spec/`: `04f867fbb338f97f3d3ec30d74af8373ff42d8b8` = тег `v0.7.0`, проверенный командами `git -C spec log -1` и `git -C spec describe --tags`.
- Набор тестов: 54/54 до изменений, 55/55 после. `grammar.js` и `src/` не затронуты; `tree-sitter generate` не запускался; поля версий не менялись.
>>>>> lang=zh
## 13. 来源记录

- CLI：`tree-sitter` 0.26.13；`package.json` 声明范围为 `^0.26.0`。安装在 Git 忽略的 `node_modules/` 中；未做其他环境更改。
- 演示输入是 Git 忽略的 `build/scratch/` 下字节精确的文件；审计后已删除。`build/` 下内容不应提交。
- `spec/` 子模块：`04f867fbb338f97f3d3ec30d74af8373ff42d8b8` 对应标签 `v0.7.0`，通过 `git -C spec log -1` 和 `git -C spec describe --tags` 核实。
- 测试集：修改前 54/54 通过，修改后 55/55。未改 `grammar.js` 或 `src/`；未运行 `tree-sitter generate`；未触及版本字段。
