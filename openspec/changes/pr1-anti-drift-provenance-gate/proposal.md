# Proposal: PR-1 入口收敛与执行血缘门禁 (Anti-Drift & Provenance Gate)

## 背景与问题
当前仓库在 `AGENTS.md`、`.agents/skills/msds-studio/SKILL.md` 与 `README_FOR_AGENT.md` 中同时存在多套“唯一法定入口”描述，且终审审计仅校验最终 DOCX/PDF 内容，不校验产物是否经由标准受控流水线产出。Agent 在多轮任务后容易发生流程漂移，绕过标准流程自建临时脚本。

## 目标
1. 收敛唯一法定 Agent 生产入口为 `标准化流程/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs`（`msds_mcp_gateway.mjs` 定位为底层原子工具网关），在文档中废止或降级冲突入口。
2. 新增 `web/src/provenance-ledger.js`，在标准流水线执行各阶段签发 `.run_manifest.json` 阶段与交付物 SHA-256 血缘凭证。
3. 在 `web/src/staged-mechanical-audit.js` 中增加 `auditPhase0Provenance` 硬门禁（`P0_PROVENANCE_CHAIN` 与 `P0_NO_ADHOC_SCRIPTS`），未走标准流程或存在临时偷跑脚本直接 Exit Code 1 阻断。
4. 修复 `web/scripts/lint_code_invariants.mjs` 中写死的本机绝对路径，使其基于相对路径真实扫描仓库源码。

## 影响范围
- 新增：`web/src/provenance-ledger.js`、`web/tests/test_provenance_gate.mjs`
- 修改：`web/src/staged-mechanical-audit.js`、`标准化流程/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs`、`web/scripts/lint_code_invariants.mjs`、`AGENTS.md`、`.agents/skills/msds-studio/SKILL.md`、`标准化流程/MSDS_Studio_Agent_Test_Kit/README_FOR_AGENT.md`
