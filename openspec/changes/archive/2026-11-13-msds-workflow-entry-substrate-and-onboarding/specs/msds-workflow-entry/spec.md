# Specification: MSDS 工作流开篇三部曲与新 Agent 上手执行契约

## ADDED Requirements

### Requirement: Context 1 识别提取与分类准确性边界契约
The system SHALL establish Context 1 as an objective extraction layer dedicated to fact grounding and label/value/explanation classification, and SHALL defer all content modifications to Context 2.

#### Scenario: 划定 Context 1 与 Context 2 职责红线
- **WHEN**: 任何 Agent 启动文档处理工作流
- **THEN**: 系统 SHALL 约束 Context 1 仅聚焦于“源文件事实提取完整性”与“语义类型分类准确性（标签/值/说明行）”
- **AND**: 系统 SHALL NOT 允许在 Context 1 阶段执行任何中英文本润色、单位推导、合规重写或预设填充
- **AND**: 所有业务层面对源文件内容的治理、翻译与重写动作 SHALL 严格推迟至 Context 2 阶段执行。

### Requirement: 工作流开篇三部曲强时序执行契约
The workflow engine SHALL enforce the sequential execution of Step 1, Step 2, and Step 3 before permitting downstream progression.

#### Scenario: 顺序执行开篇三部曲
- **WHEN**: 接收到指定产品型号的 MSDS 处理任务
- **THEN**: Agent SHALL 执行步骤 1：在源文件库中精准检索并物理锁定对应的 `.docx` 源文件，排除 TDS 等无关文件
- **AND**: Agent SHALL 执行步骤 2：通过官方受控通路 `run_source_recognition.mjs` 调用识别器执行多维语义解析
- **AND**: Agent SHALL 执行步骤 3：获取生成的标准 4 列 Context 1 Markdown 资产，并立即调用 `audit_context1_mechanical.mjs` 执行反向机械审计
- **AND**: 仅当步骤 3 审计退出码为 0 且 0 违规、0 警告时，系统 SHALL 准许推进至 Context 2。

### Requirement: 执行承载固化与新 Agent 极速上手契约
The system SHALL provide a unified, zero-ambiguity execution carrier and onboarding quick-start card for any newly instantiated agent.

#### Scenario: 新 Agent 零歧义上手工作流
- **WHEN**: 任何全新 Agent（Coordinator、Subagent 或开发智能体）接入 MSDS 处理工作流
- **THEN**: 系统规范 SHALL 向该 Agent 暴露标准的极速上手卡片（包含标准输入路径、受控执行命令模板、标准输出路径及审计验证准则）
- **AND**: Agent SHALL 100% 依循标准命令模板运行，严禁编写任何 ad-hoc 临时脚本
- **AND**: 若机械审计报告违规，Agent SHALL 触发安全停机并如实上报，严禁私自绕过或篡改审计规则。

### Requirement: Context 2 事实底座数据交接契约
The Context 1 deliverable SHALL serve as an immutable, fully verified factual foundation for Context 2 consumption.

#### Scenario: Context 1 成果平滑输入 Context 2
- **WHEN**: 步骤 3 机械审计 100% 满分通过
- **THEN**: 产出的 Markdown 事实资产 SHALL 持久化至指定交付路径并保持物理只读状态
- **AND**: 资产 SHALL 完整包含 16 大章节表格网格映射与语义类型标记，作为 Context 2 内容治理的唯一合法输入。
