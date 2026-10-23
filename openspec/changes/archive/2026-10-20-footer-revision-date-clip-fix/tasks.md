# Tasks: 页尾修订日期首字防截断任务清单

- [x] **任务 1：升级 docx-engine.js 与 pipeline-engine.js 逻辑** <!-- id: 0 -->
  - 在 `writeDateToFooterCell` 中剔除 `w:ind` 缩进；
  - 在 `updateHeaderFooterData` 中统一调用 `writeDateToFooterCell`；
  - 在 `deriveEntityPresets` 中传递 `activeDate` 给英文派生流水线；
  - 通过 `vscode-review` MCP 进行比对并应用审核。
- [x] **任务 2：重新构建 EP-1702 交付物并进行 PDF/DOCX 文本提取检验** <!-- id: 1 -->
  - 执行 `rebuild_ep1702.mjs` 重新产出标准 8 格式；
  - 检查 DOCX `footer1.xml`，断言 `w:ind` 已被移除；
  - 检查 PDF 每一页文本，断言 `Revision Date` 完整无截断，绝无 `evision Date`。
- [x] **任务 3：规格校验与归档** <!-- id: 2 -->
  - 运行 `openspec validate footer-revision-date-clip-fix --strict`；
  - 归档变更并同步更新 SKILL.md。
