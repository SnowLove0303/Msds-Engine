# Tasks: 审计模块双轨优化

- [x] **Task 1: 实现 `web/scripts/audit_topology_roles.mjs` 强化六类角色与页眉页脚/字体/脏数据拓扑机械审计（REQ-02）**
  - 逐节检查标题、序号、标签、值、说明行、页眉页脚与字体字号；
  - 验证命令：对 `PA-4840` 测试目录运行，退出码 `0`。

- [x] **Task 2: 实现 `web/scripts/generate_agent_audit_brief.mjs` 生成免读 Pipeline 的 Agent 介入审计速查包（REQ-03）**
  - 提炼 Pipeline + 全局/局部规范核心审计要点，并自动提取 16 章节源文档 vs CN/EN 产出对照快照；
  - 验证命令：为 `PA-4840` 生成 `PA-4840_agent_audit_brief.md`，退出码 `0`。

- [x] **Task 3: 在 `run_standard_production.mjs` 与 `SKILL.md` 接入 `--stopAfter=produce` 与 `--phase=audit` 双轨同步流，回归、重打 `.zip` 并推送（REQ-01）**
  - 验证命令：`--phase=audit` 跑通 `PA-4840`、`npm run lint` 退出码 `0`、重打 `MSDS_Studio_7Phase_Workflow_Kit.zip` 并推送 `origin/main`。
