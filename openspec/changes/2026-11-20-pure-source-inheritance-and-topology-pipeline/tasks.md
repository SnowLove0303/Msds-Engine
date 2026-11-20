# Tasks: 纯源内容继承与拓扑匹配驱动七流程生产重构

- [x] **Task 1: 在 `web/src/topology-matcher.js` 集成可选开关 `enableContentMapping`（默认 `false`）与统一映射/数据库补齐入口（REQ-01）**
  - 默认纯拓扑匹配（零内容替换、零数据库补齐）；显式开启 `enableContentMapping: true` 时才执行统一映射/补齐；
  - 验证命令：`npm run lint`（退出码 0）。

- [x] **Task 2: 将 `run_standard_production.mjs` Phase 4~6 切换为 `Context 2 + compileTopologyOps + 编辑器原语 + WPS PDF`（REQ-02）**
  - 4 套模板直接由 Context 2 编译写入 DOCX 并通过 WPS COM 导出 4 份 PDF；支持 `--enableContentMapping`（默认关闭）；
  - 验证命令：`npm run lint`（退出码 0）。

- [x] **Task 3: `PA-4840` 全流程重产 + 双轨终审 + 重打 `.zip` 并推送（REQ-03）**
  - 重新生成 `PA-4840` 8 份文件并执行机械审计 + Agent 介入审计对比确认 S2/S13/S14 100% 继承源文；
  - 重打 `MSDS_Studio_7Phase_Workflow_Kit.zip` 并推送代码与 OpenSpec 至 `origin/main`。
