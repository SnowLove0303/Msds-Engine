# Design: MSDS-Engine 标准化识别系统、通用编辑器通道与 MCP 协议封装架构设计

## 1. 系统架构分层拓扑

系统解耦为五大独立内聚模块：

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      AI Agent (精编操作专家)                           │
│  方法论宪法：全局通用规范 (G-01~G-40) + 16 章节局部专属规范 (L-S1~L-S16) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 标准 MCP 协议 (JSON-RPC 2.0 over Stdio)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    MSDS-Engine MCP Server (服务端)                      │
│  提供 6 大标准工具，接收 Agent 调度，向底层分发原子任务                │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. 识别中枢       │ 2. 模板与编辑通道 │ 3. 前置审计与终审              │
│    (Recognition)  │    (Editor Core)  │    (Audit & ADD Engine)        │
└─────────┬─────────┴─────────┬─────────┴───────────────┬────────────────┘
          │                   │                         │
┌─────────▼─────────┐┌────────▼─────────┐      ┌────────▼────────────────┐
│ recognition-engine││ template-editor  │      │ audit-planner.js        │
│ • OOXML AST 解析  ││ • 模板格式检索   │      │ • 前置审计目标契约生成  │
│ • GHS/组分/理化/  ││ • writeCellValue │      │ audit_bipolar_bilayer   │
│   毒理无损抽取    ││ • deleteRow      │      │ • 物理级终审机械核销    │
│                   ││ • formatSection  │      │                         │
└───────────────────┘└────────┬─────────┘      └─────────────────────────┘
                              │
                     ┌────────▼─────────┐
                     │ pdf-converter.js │
                     │ • Windows COM    │
                     │   高清矢量转译   │
                     └──────────────────┘
```

---

## 2. 核心模块详细设计

### 2.1 标准化识别系统 (`web/src/recognition-engine.js`)
- **定位**：纯解析引擎，零硬编码假设，只从源文件 Word OOXML 抽取客观化学与工程事实。
- **核心接口**：
  * `parseSourceDocx(filePathOrBuffer)`: 解包 ZIP，解析 `word/document.xml`，提取 16 章节的原始段落树与表格网格；
  * `extractGhsClassification(section2Data)`: 从 Section 2 解析 GHS 危险类别、信号词、危险性说明（H代码与文本）、防范说明（预防/响应/储存/处置，P代码与文本）、其他危险；
  * `extractComponents(section3Data)`: 解析化学品中文名称、CAS号、浓度百分比/范围、分类；
  * `extractPhysicalProperties(section9Data)`: 解析全部理化特性标签与填写值，识别测定条件（如 pH 溶液浓度、粘度测定温度）；
  * `extractToxicologyEndpoints(section11Data)`: 提取经口、吸入、经皮 LD50/LC50，皮肤刺激、严重眼睛损伤、致敏、生殖毒性、特异性靶器官毒性及附加信息。
- **返回契约**：标准化的 `MSDS_Source_Facts` JSON 对象。

### 2.2 模板检索与通用编辑器操作通道 (`web/src/template-editor.js`)
- **定位**：文档构建与高精排版操作中枢，严格遵循母版签名与二元排版法则。
- **核心操作通道**：
  * `getTemplateSchema(templateKey)`: 检索 4 套官方基准母版（`CN_Guanzhi`, `CN_Guocai`, `EN_Guanzhi`, `EN_Guocai`）的表格拓扑、网格列数与行结构；
  * `createWorkSession(templateKey, workingDir)`: 安全克隆基准模板为工作副本，单向只读保护基准模板；
  * `clearTemplateValues(session, options)`: 清空未匹配的占位示例值，保留表格结构与标签签名；
  * `writeCellValue(session, { section, row, col, text, options })`: 向指定值格写入内容，严格约束为常规体（`bold: false`）、西文字体及纯左对齐，严禁粗体泄漏；
  * `writeFullWidthSection(session, { section, paragraphs })`: 支持单单元格通栏（Section 2 / Section 11），按段落注入加粗标签、块级缩进（如 `ind.left="960"`）、行距（`before="240"`）；
  * `deleteRow(session, { section, rowIdx })`: 结构安全删行；
  * `formatSection9LaserTabs(session, isEnglish)`: 注入 G-38 悬挂缩进与 `<w:tab/>`，确保 PDF 标签首字物理垂直对齐 $X_0 = 80.28\text{pt}$；
  * `saveDocument(session, outputPath)`: 保存修改，保证 OPC `[Content_Types].xml` 完备性 (G-39)。

### 2.3 前置审计目标规划引擎 (`web/src/audit-planner.js`)
- **定位**：实现 **Audit-Driven by Design (ADD)** 机制。在编辑动工前，根据源文件事实与规范，自动生成不可篡改的《终审审计指标清单 (Audit Target Contract)》。
- **契约内容**：
  * 包含必须达成的断言列表：
    - `G-01`: 交付目录正式文件严格等于 8（4 DOCX + 4 PDF），临时杂件严格等于 0；
    - `G-36`: 8 份文件物理修改时间差 $\le 5$ 分钟；
    - `G-37`: 英文版说明行渲染字号必须为 $9.50\text{pt}$；
    - `G-38`: Section 9 标签首字 $X_0 = 80.28\text{pt}$；
    - `G-39`: OPC 媒体类型合法声明；
    - `L-S2`: Section 2 危险品通栏拓扑、缩进 960、间距 240、其他危险标签加粗；
    - `L-S11`: Section 11 单组分 15 行同构、三端点必齐、值列加粗数 strictly 0、零叠词；
    - `L-S13`: 废弃处置标题加粗居中、内容纯左对齐。

### 2.4 原生 MCP 协议服务 (`web/src/mcp-server.js`)
- **协议基线**：标准 Stdio JSON-RPC 2.0，兼容 Claude / Gemini / Antigravity 原生 MCP Client。
- **注册 6 大标准工具**：
  1. `msds_recognize_source`: 解包源文件提取全量结构化化学事实；
  2. `msds_get_template_schema`: 检索模板拓扑结构与可用操作通道；
  3. `msds_plan_audit_targets`: 生成本次任务前置审计指标契约 (JSON)；
  4. `msds_execute_editor_ops`: 通过编辑器通道执行原子编辑（写入、删行、排版）；
  5. `msds_batch_export_eight`: 批量导出 4 份正式 DOCX 与 4 份高清 PDF；
  6. `msds_audit_deliverables`: 运行双极双层全景机械深度审计并出具报告。
