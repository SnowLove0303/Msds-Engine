# Tasks: MSDS-Engine 标准化识别系统、通用编辑器通道与 MCP 协议封装施工清单

- [x] Task 1: 研发标准化识别系统 (`web/src/recognition-engine.js`) <!-- id: 1 -->
  - 实现从 Word DOCX 文件解包并提取 16 章节原始段落与表格
  - 抽取 Section 2 GHS 危险类别、信号词、H代码、P防范说明及其他危险
  - 抽取 Section 3 CAS 组分列表与浓度范围
  - 抽取 Section 9 23 项理化特性与测试条件
  - 抽取 Section 11 毒理试验数据与端点
  - 验证命令: `node web/tests/test_recognition_engine.mjs`

- [x] Task 2: 研发模板检索与通用编辑器操作通道 (`web/src/template-editor.js`) <!-- id: 2 -->
  - 检索 4 套官方基准母版（中/英 × 冠志/国彩）拓扑与样式元数据
  - 建立安全工作副本会话管理 (`createWorkSession`) 与模板清空防污染通道
  - 提供原子写入通道 (`writeCellValue`)，严格锁定数值常规体与纯左对齐
  - 提供单单元格通栏注入通道 (`writeFullWidthSection`)，支持缩进与空行间隔
  - 提供激光制表符注入通道 (`formatSection9LaserTabs`)，实现 80.28pt 垂直对齐
  - 验证命令: `node web/tests/test_template_editor.mjs`

- [x] Task 3: 研发前置审计目标规划引擎 (`web/src/audit-planner.js`) <!-- id: 3 -->
  - 依照全局通用规范（G-01~G-40）与局部专属规范（L-S1~L-S16），根据源文件事实自动生成前置审计目标清单 (AuditTargetContract)
  - 覆盖文件纯度、时间戳、PDF 字号、激光对齐、OPC 声明、Section 2/9/11/13 格式断言
  - 验证命令: `node web/tests/test_audit_planner.mjs`

- [x] Task 4: 研发原生 MCP 协议服务 (`web/src/mcp-server.js`) 并注册至 Antigravity <!-- id: 4 -->
  - 基于 stdio JSON-RPC 2.0 协议实现 MCP 服务端
  - 暴露 6 大标准工具：`msds_recognize_source`、`msds_get_template_schema`、`msds_plan_audit_targets`、`msds_execute_editor_ops`、`msds_batch_export_eight`、`msds_audit_deliverables`
  - 在 `C:\Users\Administrator\.gemini\antigravity\mcp_config.json` 中注册 `msds-engine-mcp`
  - 在 `C:\Users\Administrator\.gemini\antigravity\mcp\msds-engine-mcp\` 下生成 6 个工具 schema JSON
  - 验证命令: `node web/tests/test_mcp_server.mjs`

- [x] Task 5: 端到端全流程集成实测与 1:1 双向物理核销 <!-- id: 5 -->
  - 模拟 Agent 通过调用 MCP 工具完成识别、模板感知、审计目标前置锁定、原子编辑与 8 格式导出
  - 导出后直接运行前置审计指标，断言 100% 满分通过 (Failures: 0, Exit Code 0)
  - 验证命令: `node web/tests/test_end_to_end_mcp_pipeline.mjs`
