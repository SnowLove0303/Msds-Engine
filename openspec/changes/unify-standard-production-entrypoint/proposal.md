# Proposal: 闭口清退非标准路径、立法唯一标准入口与回归验证

## 1. 背景与目标
为彻底消除因绕过标准生产入口（`produce_standard_deliverables.mjs` / `production-orchestrator.js`）导致的日志不一致、跳步与 LibreOffice 错转 PDF 问题，本次将：
1. 物理清退临时旁路脚本（`scratch/compile_models.py`、`scratch/convert_msds_pdf_official.mjs`）；
2. 将 `PA` 所用的 7 阶标准入口（`production-orchestrator.js` / `produce_standard_deliverables.mjs`）与本次底层通用性修复完全合流（接入 `applyTopologyTypographyLock` 与 `staged-mechanical-audit.js` 防复发门禁）；
3. 更新 `msds-studio/SKILL.md` 工作流规范，以最高红线立法禁止 Agent 绕过标准入口；
4. 通过统一后的标准入口执行 `HPU-7651` 回归验证（确认 7 阶标准日志、8 份产物、机械审计与 Agent 审计任务 1/2 全绿）。

## 2. 1:1 需求物理对账矩阵 (RTM)

| 需求编号 | 需求描述 | 对应变更与验证 |
| :--- | :--- | :--- |
| **RTM-01** | 闭口清退非标准生产路径（删除 `compile_models.py`、`convert_msds_pdf_official.mjs`）。 | 物理删除旁路脚本 |
| **RTM-02** | 立法禁止 Agent 违规绕过标准入口，所有非标准产出视为无效。 | `SKILL.md` 新增最高法定唯一入口与禁绕声明 |
| **RTM-03** | 统一采用 `PA` 所用工作流路径 + 最新底层架构（`production-orchestrator.js` + `editor-writer.js` 接入 `applyTopologyTypographyLock` 与 `staged-mechanical-audit.js`）。 | `editor-writer.js`、`production-orchestrator.js`、`produce_standard_deliverables.mjs` |
| **RTM-04** | 修改工作流包与构建 SKILL 严格声明。 | `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md` |
| **RTM-05** | 通过统一标准入口执行回归验证。 | `node web/scripts/produce_standard_deliverables.mjs` 实测 `HPU-7651` 全绿 |
