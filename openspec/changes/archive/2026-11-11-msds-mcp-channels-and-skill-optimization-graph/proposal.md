# Proposal: 构建识别模块与编辑模块的 MCP 通道与 Skill 优化全景图谱

## 一、 用户原始需求 100% 逐字留存 (Raw Directives)
> `/goal 构建识别模块与编辑模块的MCP通道，使用/graph 去详细规划MCP通道可能会涉及的功能和内容，为重新做Skill优化工作流做准备`

---

## 二、 1:1 需求物理对账矩阵 (RTM)

| 需求编号 | 原始指示条目 | 场景故事 (User Story) | 详细功能契约 (RFC 2119 / Invariant) | 独立验收指标 (Measured Criteria) |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | **识别模块 MCP 通道构建与细粒度抽取**<br>“构建识别模块的MCP通道” | 作为智能体 Agent，我需要能通过标准 MCP 协议对源 Word 文件进行全量无损事实识别，并支持细粒度章节事实下钻与源文件对账。 | 1. `msds_recognize_source` SHALL 抽取 16 章节全部事实、GHS 分类、CAS 组分列表、23 项理化与毒理数据；<br>2. `msds_extract_section_facts` SHALL 支持对指定章节（如 Section 2 GHS、Section 9 理化）进行独立细粒度提取与结构分类；<br>3. `msds_compare_source_with_output` SHALL 支持源文件与生成结果的 1:1 事实物理对账。 | 1. MCP stdio 报文解析成功；<br>2. 识别提取准确率 100%。 |
| **REQ-02** | **编辑模块万能 MCP 通道构建与几何重构**<br>“构建编辑模块的MCP通道” | 作为智能体 Agent，我需要拥有万能的“手脚执行通道”，能够上传新模板、感知网格结构、执行删列、删格、合并通栏、克隆增行、写富文本与事务回滚。 | 1. `msds_register_template` SHALL 支持任意外部 DOCX 模板注册并反射网格 Schema；<br>2. `msds_execute_editor_ops` SHALL 完整支持 `deleteColumn`、`mergeCells`、`insertRow`、`deleteRow`、`writeCell`、`writeRichText` 等几何与排版操作；<br>3. `msds_peek_cell_or_row` SHALL 提供触觉透视快照；<br>4. 引擎 SHALL 保证每次几何操作后 `<w:tblGrid>` 物理自愈。 | 1. 成功在三列表格中执行 `deleteColumn` 转换为两列；<br>2. 成功执行 `mergeCells` 转换为通栏；<br>3. 导出的 DOCX 在 Word/PDF 中无网格断裂。 |
| **REQ-03** | **全景 Graph 规划与建模**<br>“使用/graph 去详细规划MCP通道可能会涉及的功能和内容” | 作为系统架构师，我需要使用 Mermaid Diagrams 全景可视化呈现识别通道、编辑通道、前置规划与终审核销的数据流、状态机与调用时序。 | 1. 绘制 MCP 通道矩阵功能全景图 (`flowchart TD`)；<br>2. 绘制 Agent 驱动的 7 阶段全流程时序图 (`sequenceDiagram`)；<br>3. 绘制多态表格网格几何演化状态机 (`stateDiagram-v2`)。 | 1. Mermaid 语法 100% 合规渲染；<br>2. 覆盖所有 MCP 通道与数据流转分支。 |
| **REQ-04** | **Skill 优化工作流全景设计与规范准备**<br>“为重新做Skill优化工作流做准备” | 作为平台开发者，我需要一份详细的 Skill 优化工作流规范，指导 Agent 如何在真实生产中组合调用这套 MCP 通道完成端到端任务。 | 1. 编写《新一代 MCP 驱动的 MSDS Studio Skill 优化工作流白皮书与 SOP 规范》；<br>2. 明确定义输入规范、前置准备、7 阶段执行流、异常自愈与门禁断言。 | 1. 形成高强制性、可直接执行的 Skill 资产文档。 |

---

## 三、 影响范围与风险防范
- **影响代码**：`web/src/mcp-server.js`、`web/src/recognition-engine.js`、`web/src/template-editor.js`；
- **平台配置**：`C:\Users\Administrator\.gemini\antigravity\mcp_config.json` 与 Schema JSON 目录；
- **文档沉淀**：`PROJECT_CONSTITUTION.md`、`CHANGELOG.md` 与 Skill 规范。
