# Tasks

## 1. 规格立项与审查
- [x] 1.1 建立 OpenSpec 变更提案 `table-geometry-and-vmerge-normalization` 并执行 `openspec validate` 验证通过。
- [ ] 1.2 在 `web/src/docx-engine.js` 中开发通用的 `normalizeRowGeometry` 工具函数（包含 vMerge 剥除、gridSpan 补齐、宽度自愈）。
- [ ] 1.3 在 `web/src/smart-matching.js` 与 `web/src/pipeline-engine.js` 中挂载 `normalizeRowGeometry`，彻底自愈 Section 11 及各类删列收敛行。
- [ ] 1.4 所有代码改动通过 `review_diff_in_vscode` 检阅合入。

## 2. Skill 规范同步
- [ ] 2.1 更新本地 `.agents/skills/msds-studio/SKILL.md`，增加“表格几何网格守恒与纵向合并闭环”法定不变量。
- [ ] 2.2 更新全局 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`，保持双端一致。

## 3. 生成验证与归档闭环
- [ ] 3.1 重启 MSDS Studio API 服务。
- [ ] 3.2 重新生成 `PU-202A` 八格式交付物，验证底层 XML 确凿数据（11.7 行宽度 `6262 dxa`、`gridSpan="3"`、无 `vMerge`）。
- [x] 3.3 记录 `CHANGELOG.md` 并执行 `openspec archive` 归档主规格。
