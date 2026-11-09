# Spec: MCP 协议工具服务规格

## ADDED Requirements

### Requirement: 原生 MCP 服务与 6 大标准工具发布
系统 SHALL 封装标准 stdio JSON-RPC 2.0 MCP 服务端，向外部 AI Agent 发布 6 大标准工具以驱动 MSDS 自动化生命周期。

#### Scenario: Agent 检索并调用 MCP 工具
- GIVEN Agent 接入系统 MCP 服务
- WHEN Agent 发送 `tools/list` 请求
- THEN 服务 SHALL 返回 `msds_recognize_source`、`msds_get_template_schema`、`msds_plan_audit_targets`、`msds_execute_editor_ops`、`msds_batch_export_eight` 及 `msds_audit_deliverables` 6 大工具定义。
