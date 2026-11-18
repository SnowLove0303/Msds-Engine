# Specification: 通用性 MCP 工作流五大关键拼图规范

## ADDED Requirements

### Requirement: 事务生命周期与自动自愈规范
系统 SHALL 在执行 `msds_execute_editor_ops` 时，于应用任何原子操作之前强制建立事务检查点。当执行任何原子操作（删列、合并、增行、写富文本）抛出异常时，系统 SHALL 自动调用 `rollbackSession` 恢复原始母版状态。系统 SHALL 向客户端透传结构化错误信息，且严禁在目标输出路径留存未完成或损坏的半成品文件。

#### Scenario: 操作异常时自动回滚母版
- **GIVEN** 已注册的有效模板工作会话
- **WHEN** 客户端提交包含越界列索引（如 `colIndex=99`）的非法操作序列
- **THEN** MCP 服务端应捕获异常，自动执行 `rollbackSession`，并返回包含清晰原因的 JSON-RPC 错误，磁盘上不得产生损坏文件。

---

### Requirement: 正向行动诊断规范 (Actionable Gap Analyzer)
`msds_compare_source_with_output` 工具除输出字符保全比外，SHALL 输出 `actionableGaps` 结构化数组。每个 Gap 对象 SHALL 包含 `sectionNumber`（章节编号）、`type`（缺失类型）、`detail`（详细描述）与 `suggestedAction`（建议采取的原子操作指令）。当且仅当所有必需章节事实完整呈现且无结构形变时，`actionableGaps` 的长度 SHALL 为 0。

#### Scenario: 1:1 对账检出漏填字段并输出正向行动指引
- **GIVEN** 包含 Section 2 GHS 象形图与防范说明的源文件
- **WHEN** 目标生成文件中 Section 2 未填入象形图与防范说明
- **THEN** `msds_compare_source_with_output` 应在 `actionableGaps` 中列出对应的缺损项，并明确建议客户端调用 `writeFullWidth` 或 `writeRichText` 进行修复。

---

### Requirement: 最高宪法与反特判工程红线
系统宪法 `PROJECT_CONSTITUTION.md` 与 `AGENTS.md` SHALL 显式声明四大法定维护支柱。代码库 SHALL 严禁包含任何针对特定化学品型号（如 `model === 'PA-3223'` 等）的写死分支。严禁任何未经用户明确授权直接针对单一目的改造通用底层工具的行为。

#### Scenario: 静态机检查验反特判与宪法守恒
- **GIVEN** `PROJECT_CONSTITUTION.md` 与 `AGENTS.md`
- **WHEN** 运行自动化扫描脚本检测工程代码
- **THEN** 四大维护支柱条文必须 100% 存在，且全库硬编码特判检测结果必须为 0。
