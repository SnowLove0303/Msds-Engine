# Spec: 拓扑编辑器 Agent 原生 MCP/ACI 工具封装与 PA-3655 覆写产出

## ADDED Requirements

### Requirement: 拓扑编辑器 Agent 原生 MCP 工具封装与注册 (REQ-01)
系统 SHALL 在 `mcp-server.js` 中向 Agent 注册原生四层拓扑原语工具接口，支持模型直接调度。

#### Scenario: 拓扑内省工具调用 (msds_get_section_topology)
- **WHEN** Agent 调用 `msds_get_section_topology` 并传入模板标识或文档路径及章节编号
- **THEN** 系统 SHALL 返回该章节表格的详细拓扑指纹（包含总行数、列数、布局形态、每行类型与单元格文字快照）。

#### Scenario: 拓扑变形工具调用 (msds_morph_section_topology)
- **WHEN** Agent 调用 `msds_morph_section_topology` 执行 `reshapeRows`、`morphToFullWidth`、`insertRowAfter`、`deleteRow` 或 `mergeCells`
- **THEN** 系统 SHALL 安全执行底层 DOM 形变，保全外实内虚边框不变量，并保存更新后的文档或会话。

#### Scenario: 几何排版与标尺投影工具调用 (msds_apply_typography_ruler)
- **WHEN** Agent 调用 `msds_apply_typography_ruler` 指定规则（`adaptiveRuler`、`laserTabsSection9`、`flushLeftValues`）
- **THEN** 系统 SHALL 自动投影 80.28pt 黄金基准激光制表位，或根据最大序号位数应用 Tier A/B 自适应标尺。

#### Scenario: 事务安全与不变量校验工具调用 (msds_validate_topology_invariants)
- **WHEN** Agent 调用 `msds_validate_topology_invariants`
- **THEN** 系统 SHALL 校验边框外实内虚、零 `<w:numPr>` 污染与零页脚缩进畸变，返回结构化合规审计判定。

### Requirement: PA-3655 通用流水线全自动覆写产出 (REQ-02)
执行 Agent SHALL 通过统一固定入口 `run_universal_msds_pipeline.mjs` 调度最新改进的通用产出流水线与拓扑编辑器，覆写源文档 `PA-3655 msds_CN 冠志.docx`。

#### Scenario: 零临时脚本全自动闭环
- **WHEN** 执行 Agent 接收物理源文件 `PA-3655 msds_CN 冠志.docx`
- **THEN** 系统 SHALL 通过单一入口一键完成识别、治理、覆写与级联审计，严禁创建临时生产脚本。

### Requirement: PA-3655 标准 8 格式全矩阵交付物释放 (REQ-03)
系统 SHALL 在交付目录中生成符合双主体、双语言规范的 8 格式标准成果。

#### Scenario: 8 格式交付矩阵释放
- **WHEN** 覆写生产完成
- **THEN** 系统 SHALL 在 `算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3655/` 释放 4 DOCX + 4 PDF，每个文件大小 > 20KB，全批次时间戳同步差 < 5 分钟。

### Requirement: 法医级全景深度审计与逐行双重对照全绿核销 (REQ-04)
审计智能体 SHALL 对 PA-3655 交付物执行三大法医级审计套件与逐行双重对照核查。

#### Scenario: 逐行双重对照零报警
- **WHEN** 运行机械审计逐行双重对照中枢
- **THEN** 系统 SHALL 输出 Section 2 至 16 并列对照，且 `alarms === 0`，关键限定条件无丢失、中文零残留。

#### Scenario: 集中式中央主审计全绿
- **WHEN** 运行中央主审计套件
- **THEN** 170 项宏观物理不变量与微观契约断言必须 100% 通过（🏆 AUDIT_PASSED，Exit code 0）。
