# Tasks: Context 2 至编辑器拓扑匹配编译器

- [x] **Task 1: 实现 `web/src/topology-matcher.js`（REQ-01, REQ-02）**
  - 实现 `compileTopologyOps` 与 `formatTopologyPlanMarkdown`；
  - 覆盖 16 章节 `2_COL_KV`、`1_COL_MERGED`、`3_COL_TABLE`、`MULTI_COL_TABLE` 匹配与倒序删行、S9 激光对齐及异常硬阻断；
  - 验证命令：`npm run lint`（退出码 0）。

- [x] **Task 2: 注册 MCP 工具 `msds_compile_topology_ops` 并更新网关与工作流规范（REQ-03）**
  - 在 `web/src/mcp-server.js` 注册 `msds_compile_topology_ops`（支持输出计划或直接联动 `msds_execute_editor_ops` 试写）；
  - 在 `web/scripts/msds_mcp_gateway.mjs` 支持 `--template=<key>` 与 `--format=md` 输出《拓扑对齐编译计划》；
  - 验证命令：对 `PA-4840` 分别以 `CN_Guanzhi` 与 `EN_Guanzhi` 模板执行拓扑编译并检验生成的 DOCX。

- [x] **Task 3: 回归测试、重打 `MSDS_Studio_7Phase_Workflow_Kit.zip` 并推送至 `origin/main`**
