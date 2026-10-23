# Tasks

## 1. 规格立项与审查
- [x] 1.1 建立 OpenSpec 变更提案 `strict-template-formatting-fidelity` 并执行 `openspec validate` 验证通过。
- [x] 1.2 编写与重构 `web/src/docx-engine.js` 中的 `applySemanticCellFormat` 与 `formatSection9LabelCell`，严格采用母版参数（420 dxa 悬挂，300 dxa 行距，无制表位，Arial 12pt Bold 标签）。
- [x] 1.3 审查并加固 `web/src/smart-matching.js` 与 `web/src/pipeline-engine.js`，确保中英文流水线全局应用语义分类格式，保留标签加粗与值常规排版。
- [x] 1.4 所有代码改动通过 `review_diff_in_vscode` 检阅合入。

## 2. Skill 强约束规范同步
- [x] 2.1 更新本地 `.agents/skills/msds-studio/SKILL.md`，增加“格式基于模板、仅允许分类、严禁篡改”法定不变量。
- [x] 2.2 更新全局 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`，保持双端一致。

## 3. 生成验证与归档闭环
- [x] 3.1 重启 MSDS Studio API 服务。
- [x] 3.2 重新生成 `PU-202A` 八格式交付物，验证底层 XML 确凿数据（420 dxa 悬挂、Arial 字体、无制表位、中英文标签加粗保真）。
- [x] 3.3 记录 `CHANGELOG.md` 并执行 `openspec archive` 归档主规格。
