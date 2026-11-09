# Proposal: PU-303A 通过 MSDS-Engine 系统受控 API 通道实现解包、编排与 8 格式闭环导出

## 1. 业务意图与背景
根据用户法定指令，对 `F:\App Location\Guanzhi Tong\Skill\MSDS Skill\TDS MSDS 预处理\1-1 单组份水性聚氨酯树脂 PU\PU-303A\PU-303A msds_CN 冠志.docx` 源文件，通过 MSDS-Engine 官方导入识别器进行结构化解包，提取 16 章节技术事实（含危化品分类与 DMAC 特征组分）；按照全局规范与局部专属规范进行中英双语编排与数据装配；通过系统受控 API 通道（`POST /api/msds/pipeline/generate-eight`）驱动全生命周期生产，将 Section 2 组装为跨两列通栏拓扑（`gridSpan="2"`, 9795 dxa），并派生中英双语（CN/EN）与双企业主体（冠志/国彩）共计 8 格式标准交付物（4 DOCX + 4 PDF），物理落盘至 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-303A`。

**最高法定原则**：本项任务重点是验证 Agent 通过系统受控 API 通道按系统标准使用系统功能产出 MSDS，严禁任何 Agent 绕过 MSDS-Engine 系统私自编写 ad-hoc 脚本直接读写交付物。

## 2. 需求物理对账矩阵 (Spec-Kit RTM) 1:1 守恒注入

| 需求条目 | 原始意图 | 场景故事 | 详细功能契约 | 独立验收指标 |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | 源文件解包识别 | 作为合规分析系统，需从源 DOCX 提取精确技术事实 | 通过 MSDS-Engine 原生受控解析接口（`loadDocx` / `POST /api/msds/import`）解包源 DOCX，抽取 16 章节完整结构化事实树（Section 1~16、组分表、理化特性等） | 源文件存在且提取数据完整，退出码 0 [Measured] |
| **REQ-02** | 规范编排与装配 | 作为文档工程师，需按法定排版不变量组装文档 | 严格执行《MSDS 全景统一规范》全局通用规范（G-01~G-32）与 16 章节局部专属规范（L-S1~L-S16），通过系统编排器完成数据清洗、中英转换与排版注入 | 触发双极双层全景深度审计脚本 `audit_bipolar_bilayer.mjs`，断言全部 PASS [Measured] |
| **REQ-03** | 专有目录交付 | 交付管理者要求产出物准确存储并留存源文件母本 | 导出前严格执行源文件安全防覆盖留存 `preserveOriginalFileBackup`；将 8 格式标准交付物物理落盘至 `算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-303A` | 目标目录下 8 份正式文件完整生成且 0 临时杂件残留 [Measured] |
| **REQ-04** | Section 2 通栏呈现 | 审核专家要求危险性概述呈现为单格通栏拓扑 | 系统底模引擎与流水线（`buildFullWidthSection2`）将 Section 2 组装为跨两列单单元格通栏行（`gridSpan="2"`, 9795 dxa），规范呈现危化要素与 DMAC 透皮吸收危害 | OOXML AST 检查 Section 2 表格仅 2 行且 Row 1 包含 `w:gridSpan w:val="2"` [Measured] |
| **REQ-05** | 系统受控 API 通道唯一性 | 架构治理要求绝对禁止绕过 MSDS-Engine 系统直改文件 | 唯一启动并调用 MSDS-Engine 官方无头服务（`POST /api/msds/pipeline/generate-eight`）驱动全生命周期生产，触发 8 大质量门禁断言 | 记录真实的 HTTP 200 请求/响应日志与服务监听凭证 [Measured] |
