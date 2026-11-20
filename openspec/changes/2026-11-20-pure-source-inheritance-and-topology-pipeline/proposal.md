# Proposal: 纯源内容继承与拓扑匹配驱动七流程生产重构

## 目标
彻底根除旧流水线 Phase 4~5“先入为主”的话术覆盖与外生数据库补全问题：
1. **REQ-01**：在 `web/src/topology-matcher.js` 中将**内容映射（A→B 替换）**与**基准数据库补齐（`msds-db.js`）**统一收口为可选开关 `enableContentMapping`（默认 `false`），平时只做**纯拓扑匹配**（100% 继承 Context 2 原文）。
2. **REQ-02**：将七流程 `run_standard_production.mjs` 的 Phase 4~6 切换为直接基于 `Context 2 + compileTopologyOps + 编辑器原语 + WPS COM PDF 转换` 生成 8 份交付物（CN/EN × 冠志/国彩 × DOCX/PDF）。
3. **REQ-03**：以 `PA-4840` 重新产出 8 份文件并通过双轨审计（机械审计 + Agent 介入审计），验证 S2/S13/S14 等 100% 继承源文。
