# Proposal: MSDS-Engine 标准化识别系统、通用编辑器通道与 MCP 协议封装体系

## 1. 业务意图与原始需求逐字留存 (100% Verbatim Ingestion)

```text
开发MSDS-Engine 的核心目的是 做一套标准化的识别系统和编辑器（支持自动检索模板格式并形成对应的操作通道：编辑：输入、删除、排版调整等），识别用于帮助识别word文件获取待归类调整的全部信息，编辑器用于对应模板化的标准格式输出（如表格格式、文本格式、标签和值的定义等），然后再把这套系统封装成MCP给到Agent去执行自动化MSDS 识别、编辑和导出操作，这个编辑是需要依靠Agent去执行对应操作编辑的，因此编辑的方法论就是全局与局部规范和约束，并且需要对导出结果进行审计，但是在编辑的时候就需要制定好最终的审计目标了，懂我意思？
```

### 核心指导思想
- **拒绝角色错位**：Agent 的职责不是修改 `MSDS-Engine` 的业务源代码来迎合特定样例，而是作为专业精编操作员，利用 Engine 提供的标准原子操作通道执行编辑。
- **引擎定位 (Infrastructure)**：`MSDS-Engine` 是一套具备“模板格式自感知”、“未分类事实全量识别”与“底层 OOXML 原子操作通道”的通用文档系统。
- **协议桥梁 (MCP)**：将识别引擎与编辑器操作通道封装为标准 Model Context Protocol (MCP) Tools，赋予 Agent 结构化交互能力。
- **方法论驱动 (Spec-Driven)**：Agent 依据全局通用规范（G-01~G-40）与 16 章节局部专属规范（L-S1~L-S16）制定编辑决策。
- **审计目标前置 (Audit-Driven by Design / ADD)**：在发起编辑之前，根据识别到的产品特征提前制定并锁定终审审计指标，以终为始，倒逼编辑动作精准合规。

---

## 2. 1:1 需求物理对账矩阵 (Requirements Traceability Matrix - RTM)

| 需求条目编号 | 原始需求语义切片 | 架构定位与承重墙 | 详细功能契约 (Functional Contract) | 独立物理验收指标 (RTM Verification) |
| :---: | :--- | :--- | :--- | :--- |
| **REQ-01** | **标准化识别系统**：用于帮助识别 Word 文件获取待归类调整的全部信息 | 事实提取与感知中枢 (`recognition-engine.js`) | 无损解包输入 Word 文档，提取 16 章节全部未分类的原始段落、表格、GHS 分类、H/P 声明、CAS 组分列表、理化测试值及毒理学试验数据，生成标准化事实树。 | 输入任意测试 DOCX，能完整提取 16 章节全部存在字段，零静默丢弃，退出码 0 [Measured] |
| **REQ-02** | **模板检索与编辑器操作通道**：支持自动检索模板格式并形成对应的操作通道（编辑：输入、删除、排版调整等） | 模板感知与原子编辑通道 (`template-editor.js`) | 1. 自动检索基准母版（中/英 × 冠志/国彩），输出表格拓扑、网格列宽、样式元数据；<br>2. 暴露原子操作通道：`create_work_copy`、`clear_template`、`set_cell_value`、`delete_row`、`apply_typography`、`format_section`。 | 能够自动感知模板表格行数与单元格列宽，精准执行单元格写入、删行与格式化，保持 XML 结构合法 [Measured] |
| **REQ-03** | **模板化标准格式输出定义**：对应模板化的标准格式输出（如表格格式、文本格式、标签和值的定义等） | 格式立法与二元契约 (`docx-engine.js` / Schema) | 严格锁定：<br>1. 表格格式：通栏单单元格 `gridSpan`、标准分列 15 行、生殖毒性垂直合并；<br>2. 文本格式：中文宋体 12pt、英文 Arial 9.5pt 说明行、西文罗马体；<br>3. 标签与值二元对立：标签加粗，数值严格常规体且纯左对齐，首部零标签叠词。 | 产出文档通过二元格式校验：加粗仅出现在标签列/子标签，数值列粗体数严格等于 0，退出码 0 [Measured] |
| **REQ-04** | **MCP 协议服务封装**：把这套系统封装成 MCP 给到 Agent 去执行自动化 MSDS 识别、编辑和导出操作 | Agent 标准工具协议 (`mcp-server.js`) | 实现标准 MCP Server（stdio JSON-RPC 2.0），发布 6 大标准工具：`msds_recognize_source`、`msds_get_template_schema`、`msds_plan_audit_targets`、`msds_execute_editor_ops`、`msds_batch_export_eight`、`msds_audit_deliverables`。并在 Antigravity 中完成配置注册。 | Agent 能通过标准 MCP Tool 协议驱动全流程，无需编写 ad-hoc 脚本，退出码 0 [Measured] |
| **REQ-05** | **Agent 编辑方法论**：编辑依靠 Agent 执行对应操作编辑，方法论就是全局与局部规范和约束 | 认知决策与规范宪法 (`MSDS_SPECIFICATIONS_COMPLETE_GUIDE.md`) | Agent 将全局通用规范（G-01~G-40）与 16 章节局部专属规范（L-S1~L-S16）作为指导其调用编辑器操作通道（通栏决策、缩进参数、字体匹配、间距注入）的唯一依据。 | 交付物 100% 吻合规范要求，所有版式决策均能追溯至规范具体条款 [Measured] |
| **REQ-06** | **审计目标编辑前置**：需要对导出结果进行审计，但是在编辑的时候就需要制定好最终的审计目标 | 逆向目标驱动闭环 (`audit-planner.js`) | 在编辑操作动工前，根据识别到的事实特征自动推演出该产品的《终审审计目标清单 (Audit Target Contract)》；编辑操作以该目标为靶向；导出后自动运行该清单执行机械终审。 | 终审审计指标在编辑前生成为 JSON 契约；导出后由审计套件验证，Failures: 0，退出码 0 [Measured] |

---

## 3. 产出物清单 (Deliverables)

1. `web/src/recognition-engine.js`：标准 Word MSDS 全量识别解包引擎；
2. `web/src/template-editor.js`：标准模板检索与通用原子编辑操作通道引擎；
3. `web/src/audit-planner.js`：前置审计目标制定与契约规划引擎；
4. `web/src/mcp-server.js`：基于标准 stdio JSON-RPC 的 MSDS-Engine 原生 MCP 服务端；
5. `C:\Users\Administrator\.gemini\antigravity\mcp_config.json`：注册 `msds-engine-mcp` 服务；
6. `C:\Users\Administrator\.gemini\antigravity\mcp\msds-engine-mcp\*.json`：向 Antigravity 注册 6 大 MCP 工具的输入输出规范 Schema；
7. 完整的端到端自动化验证套件：覆盖“识别 $\rightarrow$ 模板感知 $\rightarrow$ 审计前置 $\rightarrow$ 编辑 $\rightarrow$ 导出 $\rightarrow$ 终审”全流程。
