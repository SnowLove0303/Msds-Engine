# Tasks: 闭口清退非标准路径与统一标准入口回归

- [ ] **T-01**: 物理清退 `scratch/compile_models.py` 与 `scratch/convert_msds_pdf_official.mjs`。
- [ ] **T-02**: 更新 `web/src/editor-writer.js` 接入 `applyTopologyTypographyLock(session)`；更新 `web/src/production-orchestrator.js` 与 `web/scripts/produce_standard_deliverables.mjs` 支持 `--wordDir`/`--pdfDir` 并接入 `staged-mechanical-audit.js`。
- [ ] **T-03**: 更新 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`，加入“唯一法定生产入口与严禁绕过标准入口”最高红线声明。
- [ ] **T-04**: 通过统一后的 `produce_standard_deliverables.mjs` 执行 `HPU-7651` 回归验证，核验 7 阶标准日志、机械审计退出码 0 及 Agent 审计任务 1/2 全绿。
