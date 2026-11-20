# Tasks: Context 2 全量逐句英译与标准化表格结构调整

- [x] **Task 1: 升级 `web/src/context-governor.js` 标准化表格拆行合并与零中文残留门禁（REQ-01, REQ-02）**
  - Section 3 多组分 `\n` 单元格拆分为独立 `COMPONENT_ROW`（1 行 1 组分，3 列分格）；
  - 全 16 章节标注项注入 `placement`（`gridType`, `colSpan`, `targetCols`），修复 `OEL_ROW` 缺失分支；
  - 升级 `serializeContext2ToMarkdown` 按标准化表格形态（通栏合并 / 双列 KV / 多行多列）渲染；
  - 新增 `translations` 注入支持与 `untranslatedCount === 0` 强校验门禁；
  - 验证命令：`npm run lint`（退出码 0）。

- [x] **Task 2: 打通 MCP 网关与七流程 Runner 的 `--translations` 闭环并更新文档（REQ-01, REQ-02）**
  - 更新 `web/scripts/msds_mcp_gateway.mjs`、`web/src/mcp-server.js` 与 `标准化流程/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs` 支持 `--translations=<json>`；
  - 更新 `标准化流程/MSDS_Studio_Agent_Test_Kit/skill/SKILL.md` 与 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`，明确 Agent 强制逐句全量英译与标准化表格规程；
  - 验证命令：对 `PA-4840` 实测未补译拦截与补译全绿（`untranslatedCount === 0`, `isValid === true`）。

- [x] **Task 3: 回归测试、重新打包七流程 `.zip` 与仓库同步**
  - 运行 `test_context1_to_context2_multisample.mjs` 与 `npm run lint`；
  - 重新生成 `MSDS_Studio_7Phase_Workflow_Kit.zip` 并推送代码与 OpenSpec 至 `origin/main`。
