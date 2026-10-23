# Tasks

## 1. 规格立项与审查
- [x] 1.1 建立 OpenSpec 变更提案 `engine-systemic-optimization-and-gates` 并执行 `openspec validate` 验证通过。
- [x] 1.2 在 `web/src/docx-engine.js` 中构建全局表格拓扑守卫 `healAllTableTopologies` 与样式指纹强校验器。
- [x] 1.3 在 `web/src/smart-matching.js` 与 `web/src/pipeline-engine.js` 中构建自适应 Section 12 说明行装配中枢（支持 0/1/2 行双语自动识别与翻译）。
- [x] 1.4 在 `web/src/pipeline-engine.js` 中构建交付前 5 大硬性门禁（Gate 1~5）断言套件。
- [x] 1.5 所有代码改动通过 `review_diff_in_vscode` 检阅合入。

## 2. Skill 规范升级与治理
- [x] 2.1 升级本地 `.agents/skills/msds-studio/SKILL.md`，固化全套架构级自愈机制与断言门禁规范。
- [x] 2.2 升级全局 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`，保持双端一致。

## 3. 全量门禁校验、交付验证与归档闭环
- [x] 3.1 重启 MSDS Studio API 服务。
- [x] 3.2 运行 API 端到端生成 `PU-202A` 八格式，触发并通过全部 5 大硬性门禁。
- [x] 3.3 检验产出文件真实 XML 数据（S12 完整 2 行、S11 拓扑 100% 守恒、S9 格式 100% 对齐、页脚时间自适应真实）。
- [x] 3.4 记录 `CHANGELOG.md` 并执行 `openspec archive` 归档主规格。
