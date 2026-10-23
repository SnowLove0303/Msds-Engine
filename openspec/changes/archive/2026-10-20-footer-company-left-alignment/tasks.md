# Tasks: 页尾公司名称左对齐规范任务清单

- [x] **任务 1：升级 docx-engine.js 页脚对齐与写入机制** <!-- id: 0 -->
  - 在 `writeCompanyToFooterCell` 中显式注入 `<w:jc w:val="left"/>` 并剔除任何残留缩进；
  - 在 `updateHeaderFooterData` 中对所有 `footer*.xml` 的公司单元格统一应用左对齐逻辑；
  - 通过 `vscode-review` MCP 进行比对并应用审核。
- [x] **任务 2：重新构建 EP-1702 交付物并进行底层 XML 与 PDF 检验** <!-- id: 1 -->
  - 执行 `rebuild_ep1702.mjs` 重新产出 4 份 DOCX + 4 份 PDF；
  - 检查全部 4 份 DOCX 的 `footer1.xml`，断言 `Row 0 Cell 0` 具有 `jc=left`；
  - 检验中英文版本折行及左对齐排版。
- [x] **任务 3：规格校验与归档** <!-- id: 2 -->
  - 运行 `openspec validate footer-company-left-alignment --strict`；
  - 归档变更并同步更新 SKILL.md。
