# Proposal: 全量底层通用性修复与防复发加固（ISSUE-01 ~ ISSUE-11）

## 1. 背景与目标
针对 `HPU-7651` 全量审计（任务 1 ∪ 任务 2）暴露的 `ISSUE-01` ~ `ISSUE-11`，从底层识别、Context 2 语义治理、编辑器富文本与排版锁定、PDF 受控转换、机械审计与 Agent 审计全链路实施**通用性根治与防复发防线下沉**，并依法对 **Section 1 中英文差异** 与 **Section 8 `8.1 暴露控制 -> 8.2 控制参数`** 局部强制规范加装 `@ANTIGRAVITY_INVARIANT_LOCK` 源码级防篡改封印。

## 2. 1:1 需求物理对账矩阵 (RTM)

| 需求编号 | 对应问题 | 核心修复与防复发内容 |
| :--- | :--- | :--- |
| **RTM-01** | `ISSUE-02`, `ISSUE-06` | **Section 11 通用双范式与语义分类**：废除 `cells.length === 1 && /LD50/` 脆性正则；统计每个测试条件涉及的物质数——单物质（或无物质子项）端点拆为标准 **2 列分列**，仅同一测试条件涉及 ≥2 种物质说明时使用通栏。 |
| **RTM-02** | `ISSUE-01` | **官方 PDF 转换通道唯一化**：全部 PDF 转换强制调用 `web/src/pdf-converter.js`（`Windows COM / WPS/Word`）；机械审计新增 `P6_PDF_NO_LIBREOFFICE` 断言（严禁 `producer` 为 LibreOffice）。 |
| **RTM-03** | `ISSUE-03` | **全交付物居中零缩进验证**：解除 `HPU-7651 msds_CN 冠志.docx` 锁后全量重编译，确保 4 份 DOCX 全部通过 `P5_S3_ZERO_INDENT` 与 `P5_S8_OEL_ALIGNMENT`。 |
| **RTM-04** | `ISSUE-04`, `ISSUE-05` | **双语化学式下标通用渲染 + 制表符规范**：在 `template-editor.js` 全局排版锁定中通用识别化学式（`CO2`、`H2O`、`NO2`、`SO2`、`cm3` 等）自动注入 `w:vertAlign="subscript"/"superscript"`，彻底消除 EN 版下标丢失；明确 `cells.length === 1` 通栏说明行允许空格分隔，2 列标签 `spaceAfterNumParas === 0`。 |
| **RTM-05** | `ISSUE-07`, `ISSUE-08`, `ISSUE-09` | **S1/S2/S9 源文继承与局部规范封印**：<br/>1) **S2**：保留源文 `2.2 标签要素`（`2.2 Label elements`）标题（方案 A1），非危品不虚增象形图/信号词；<br/>2) **S1**：用 `@ANTIGRAVITY_INVARIANT_LOCK` 锁定 CN（`1.1 产品名称`+`中文名称` 2 行，不向中文名称拼接型号）与 EN（`1.1 Product name` 合并英文品名+型号 1 行）局部规范差异；<br/>3) **S9**：清除英文版 `9.3 pH:` 括号末尾多余句号 `.`。 |
| **RTM-06** | `ISSUE-10`, `ISSUE-11` | **识别引擎元数据与 EN 视图修复**：扩展 `recognition-engine.js` `isNegationCategory` 识别“根据GHS不属于危害化学品 / Not a hazardous substance...”等非危否定句，修正头部元数据误标；修复 Context 3 EN 视图标签冒号与 Section 3 元数据表英文显示。 |
| **RTM-07** | 防复发与全系验收 | 将 `ISSUE-01`~`ISSUE-10` 固化至 `staged-mechanical-audit.js` + `SKILL.md`；完成 `HPU-7651` 与 `1-2` 全部 6 个型号（48 份交付物）全量重产、机械审计与 Agent 任务 1/2 核销。 |
