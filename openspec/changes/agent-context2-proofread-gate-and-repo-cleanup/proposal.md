# OpenSpec Proposal: Agent Context 2 Proofread Gate, HPU-7790 Translation Fix & Repo Cleanup

## 1. 变更目的
1. 在 `Context 2` 与编辑器写入（Stage 4/5）之间建立**强制两段式 Agent 语义校对与批准门禁**：物理禁止机械脚本未经 Agent 逐行校对翻译即直通产出；
2. 修复 `HPU-7790` 暴露的 `context-governor.js` 短词截胡漏译缺陷（`多元醇分散体`、`含聚碳酸酯结构的多元醇聚合物`）并优化高价值 P2 英文术语；
3. 同步更新 `SKILL.md` / `README_FOR_AGENT.md`，并按新流程在 `HPU-7790` 实测闭环；
4. 整理 `MSDS-Engine` 根目录与 `web/src/` 零散调试脚本至 `scratch/legacy_debug/`，更新 `.gitignore` 排除产出物与 `msds_repo.db*`，推送完整代码库至 GitHub。

## 2. 1:1 需求守恒矩阵 (RTM)
- **R1**：强制两段式 Agent-in-the-Loop 生产门禁（`--prepareOnly` + Agent 校对 + `--approveContext2 --translations=...`；无 `--approveContext2` 硬阻断） + 提案 A（译文校对哈希存证）+ 提案 B（高风险模糊匹配高亮）；
- **R2**：修复 `HPU-7790` 3 处 P1 漏译及全系列 P2 英文专业术语优化；
- **R3**：同步更新 `SKILL.md` 与 `README_FOR_AGENT.md`；
- **R4**：`MSDS-Engine` 目录整洁化与 Git 推送（绝不推送 MSDS/TDS 产出物及用户数据 `msds_repo.db`）。

## 3. 法定双清单
### 3.1 拟变范围清单
1. `[Gate & Orchestrator]` [production-orchestrator.js](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/web/src/production-orchestrator.js) & [run_standard_production.mjs](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/体系交接文档/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs)：新增 `prepareOnly` / `approveContext2` / `translations` 门禁参数与 `<MODEL>_context2_review.md` + `<MODEL>_context2_translations.json` 导出，未批准时阻断 Stage 4/5；
2. `[Translation & IR]` [context-governor.js](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/web/src/context-governor.js)：修复 `多元醇分散体`、`含聚碳酸酯结构的多元醇聚合物` 及 `S6.1`/`S13` 专业英译，在 `serializeContext2ToMarkdown` 标注 `[需重点校对]`；
3. `[Governance Docs]` [全局 SKILL.md](file:///C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md)、[交接 SKILL.md](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/体系交接文档/MSDS_Studio_Agent_Test_Kit/skill/SKILL.md)、[README_FOR_AGENT.md](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/体系交接文档/MSDS_Studio_Agent_Test_Kit/README_FOR_AGENT.md)；
4. `[Repo Hygiene & Git]` [.gitignore](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/.gitignore) 与根目录 / `web/src/` 零散一次性调试文件归档至 `scratch/legacy_debug/`。

### 3.2 保持现状承诺清单
- 全部 `@ANTIGRAVITY_INVARIANT_LOCK` 业务封印、Template Auto-Profiler、Hybrid Context 2 事实指纹锁、三任务独立 4 `.md` 审计规范与已通过的 `HPU-7651`~`HPU-7711A` 交付物。
