# Specification: HPU 系列水性羟基聚氨酯树脂批量识别与审计契约

## ADDED Requirements

### Requirement: 目标源文件锁定与排他契约
The system SHALL accurately lock 6 HPU MSDS source files and SHALL NOT include TDS files.

#### Scenario: 扫描 6 个目标型号 MSDS 源文件
- **WHEN**: 协调器扫描目录 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\1-2 水性羟基聚氨酯树脂 HPU`
- **THEN**: 系统 SHALL 纳选且仅纳选以下 6 个型号的中文 MSDS 源文件：
  1. `HPU-7651/HPU-7651 msds_CN 冠志.docx`
  2. `HPU-7660/HPU-7660 msds_CN 冠志.docx`
  3. `HPU-7700/HPU-7700 msds_CN 冠志.docx`
  4. `HPU-7710/HPU-7710 msds_CN 冠志.docx`
  5. `HPU-7711A/HPU-7711A msds_CN 冠志.docx`
  6. `HPU-7790/HPU-7790 msds_CN 冠志.docx`
- **AND**: 系统 SHALL NOT 纳选任何包含 `tds` 命名的技术说明书文件。

### Requirement: Swarm 并发调度与任务隔离契约
The orchestrator SHALL dispatch isolated execution streams for all 6 target models concurrently.

#### Scenario: 并行解析 6 个型号
- **WHEN**: 批量识别任务启动
- **THEN**: 调度器 SHALL 为 6 个型号分别派发独立的执行流或 Subagent 实例
- **AND**: 每个执行流 SHALL 独立调用官方受控执行通路 `web/scripts/run_source_recognition.mjs`
- **AND**: 各执行流之间 SHALL NOT 共享内存上下文或临时状态。

### Requirement: 统一交付成果规范契约
The extraction pipeline SHALL deliver normalized Markdown artifacts to the designated directory.

#### Scenario: 成果集中交付至训练夹
- **WHEN**: 任何一个型号完成识别抽取
- **THEN**: 系统 SHALL 将结果持久化至目录 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\识别模块\识别模块训练夹`
- **AND**: 输出文件名 SHALL 为 `<MODEL>_context1_recognition.md`
- **AND**: 内容 SHALL 严格遵循 4 列 Markdown 表格结构，且所有单元格内的管道符号 `|` SHALL 被安全转义为 `\|`。

### Requirement: 独立反向机械审计硬阻断门禁契约
The auditor SHALL execute independent adversarial verification on every output Markdown artifact.

#### Scenario: 机械审计探针全绿准入
- **WHEN**: 交付目录下的 Markdown 文件就绪
- **THEN**: 系统 SHALL 调用 `web/scripts/audit_context1_mechanical.mjs --target="<MD_PATH>" --strict` 执行 P1~P4 及 M-01~M-08 探针全覆盖检测
- **AND**: 审计程序进程退出码 SHALL 严格为 0
- **AND**: 违规项 Violations 与警告项 Warnings SHALL 严格为 0。
