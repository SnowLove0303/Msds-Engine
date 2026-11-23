# Tasks: 全流程分阶段机械审计与 Agent 内容审计双轨重构

- [x] **Task 1: 构建统一分阶段确定性机械审计引擎 (`web/src/staged-mechanical-audit.js` + `web/scripts/run_staged_mechanical_audit.mjs`)（REQ-MA-01, REQ-MA-P1~P6）**
  - 实现 Phase 1~6 全部纯形式/物理/数学/隔离确定性校验（零特定型号、零固定行数、零强制法规词硬编码）；
  - 输出标准化 `{ ok, stage, summary, findings }` JSON 结构，并提供独立 CLI 入口支持 `--stage=... --json`；
  - 验证命令：`npm run lint`（退出码 0）+ `node web/scripts/run_staged_mechanical_audit.mjs --stage=all` 对 `PA-4840` 实测全绿。

- [x] **Task 2: 增强 Agent 内容审计速查包 (`web/scripts/generate_agent_audit_brief.mjs`)（REQ-AA-01）**
  - 新增 Preset 覆盖槽位声明清单与 S2/S3/S14 跨章节危化逻辑摘要；
  - 验证命令：生成 `PA-4840_agent_audit_brief.md` 并核验新增章节内容完整准确。

- [x] **Task 3: 集成至标准流水线与执行数据库直出 (`run_standard_production.mjs`, `pack_workflow_kit.mjs`)（REQ-DB-DIRECT）**
  - 在 Phase 1、Phase 2~3、Phase 4、Phase 5~6 随动执行对应阶段机械审计前置拦截，并将结构化 `findings` 直接写入 `user_exec_logs.db`；
  - 执行 `PA-4840` 全流程跑批验证，核验 `query_exec_logs.mjs` 入库状态 `SUCCESS`，重打 ZIP 并推送至 `origin/main`。
