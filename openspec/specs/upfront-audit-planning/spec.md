# upfront-audit-planning Specification

## Purpose
TBD - created by archiving change msds-engine-standardized-recognition-editor-mcp. Update Purpose after archive.

## Requirements

### Requirement: 审计目标编辑前置确立 (Audit-Driven by Design)
系统 SHALL 支持在编辑执行前，根据源文件事实与全局/局部规范自动生成《前置审计目标契约 (AuditTargetContract)》，并在导出后以此契约作为机械终审唯一法定依据。

#### Scenario: 动态推演审计契约并终审闭环
- GIVEN Agent 获取了源文件的 GHS 分类与理化指标特征
- WHEN Agent 调用 `planAuditTargets`
- THEN 系统 SHALL 生成包含 G-01 纯度、G-36 时间戳、G-37 PDF字号、G-38 激光对齐、L-S2 通栏及 L-S11 15 行同构等全部断言的 JSON 契约，供导出后由 `audit_deliverables` 一键核销。
