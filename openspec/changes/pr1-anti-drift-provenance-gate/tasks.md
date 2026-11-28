# Tasks: PR-1 入口收敛与执行血缘门禁

- [x] 1. 新增 `web/src/provenance-ledger.js` 实现 `.run_manifest.json` 签发、阶段记录、交付物哈希登记与校验逻辑
- [x] 2. 在 `web/src/staged-mechanical-audit.js` 中新增 `auditPhase0Provenance`（`P0_PROVENANCE_CHAIN` 与 `P0_NO_ADHOC_SCRIPTS`）
- [x] 3. 在 `标准化流程/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs` 中接入血缘凭证签发与 Phase 7 前置门禁
- [x] 4. 修复 `web/scripts/lint_code_invariants.mjs` 硬编码绝对路径问题
- [x] 5. 收敛 `AGENTS.md`、`.agents/skills/msds-studio/SKILL.md` 与 `README_FOR_AGENT.md` 中的唯一法定入口描述
- [x] 6. 编写并运行 `web/tests/test_provenance_gate.mjs` 及 `npm run lint --prefix web`，验证全绿通过
