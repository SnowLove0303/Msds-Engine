# editor-typography Specification

## Purpose
TBD - created by archiving change editor-level-typography-and-section8-invariants. Update Purpose after archive.

## Requirements

### Requirement: 英文版带序号标签与未编号标签制表位对齐 (REQ-01)
The system SHALL ensure that in English MSDS documents, numbered labels (e.g., `1.3  Supplier information:`) and unnumbered labels (e.g., `Name of supplier:`) strictly align on the 420 twips (or 565 twips for Section 11) horizontal baseline, with no oversized gap.

#### Scenario: 英文版第一列标签在 Word 中垂直严格对齐
- **WHEN** the engine processes English label cells in table column 0
- **THEN** it SHALL inject matching `<w:tabs><w:tab w:val="left" w:pos="420"/></w:tabs>` (or 565 for Section 11) and `<w:ind w:left="420" w:hanging="420"/>` into `w:pPr`
- **AND** the numbered run SHALL contain only `seqStr` followed immediately by `<w:tab/>` without extra trailing spaces
- **AND** unnumbered labels SHALL have `<w:ind w:left="420"/>` so their text begins at the identical 420 twips baseline.

### Requirement: Section 8 题头格式保护与 PPE 子标签缩进一致性 (REQ-02)
The system SHALL preserve Section 8.1 and 8.2 as bold section subheadings, prevent them from degrading to 9.5pt normal text, maintain consistent 420 twips indentation across all PPE items including `Recommendation:`, and normalize all corrupted dashes.

#### Scenario: Section 8.1 与 8.2 题头格式保持
- **WHEN** processing Section 8 rows with subheadings such as `8.1 Exposure controls:` or `8.2 Engineering controls:`
- **THEN** it SHALL keep them left-aligned without hanging indentation, styled with 10.5pt Bold / 12pt Bold Arial/Times New Roman
- **AND** it SHALL NOT delegate them to single-cell body row formatting or reduce font size to 9.5pt.

#### Scenario: Section 8 PPE 子标签缩进与乱码清洗
- **WHEN** formatting PPE sub-labels under Section 8
- **THEN** `Recommendation:` SHALL receive the standard 420 twips left indentation matching all other PPE labels
- **AND** all corrupted dash characters in labels like `Fluororubber C FKM:` SHALL be normalized to `Fluororubber - FKM:`.

### Requirement: 底层防篡改源码封印与主审计硬门禁 (REQ-03)
The system SHALL lock down typography logic with code invariant locks and enforce exit code 0 automated assertions in the master audit script.

#### Scenario: 自动化主审计一票否决
- **WHEN** running `node web/scripts/run_master_msds_audit.mjs`
- **THEN** it SHALL assert that numbered labels have valid 420 twips tabs, unnumbered labels have 420 twips indents, Section 8.1 is bold subheading without hanging indent, `Recommendation:` is indented 420 twips, and no dash mojibake exists
- **AND** any assertion failure SHALL immediately exit with non-zero code.

### Requirement: 模板页眉页脚原生样式继承与基座保护 (REQ-TOPO-HF-INHERIT-01)
系统 SHALL 在装载并处理任意 DOCX 模板时，将模板自带的页眉与页脚视为只读排版基座，严禁外部全局样式投影逻辑对其强行重置或字号降级，确保模板原生的 22pt 加粗大标题、型号底纹框及页脚字阶排版完整呈现。

#### Scenario: 任意模板页眉页脚原生样式继承
- **WHEN** 拓扑层装载中文、英文或定制母版并注入动态元数据时
- **THEN** 系统 SHALL 仅在占位节点上更新产品型号、公司名称、修订日期等纯文本内容
- **AND** 系统 SHALL 保留模板原生的字体、字号（如 22pt 标题、18pt 型号框、10.5pt 公司名、10pt 修订日期）、加粗、居中对齐与底纹
- **AND** 外部 `applyGlobalTypographyProjection` SHALL NOT 对 `word/header*.xml` 和 `word/footer*.xml` 执行字号与粗体剥离。

#### Scenario: 页脚动态页码域完整求值
- **WHEN** 导出包含原生页脚的 DOCX 并转换为 PDF 时
- **THEN** 页脚中的动态页码域（`PAGE` 与 `NUMPAGES`）SHALL 100% 保持完整并在 PDF 中正确呈现为计算后的数字。

### Requirement: 全16章节五大语义要素 Design Tokens 统一投影 (REQ-TYPO-UNIFIED-TOKENS-02)
系统 SHALL 将全篇 16 个章节的所有文本内容精准划分为大标题、小标题、序号、标签、说明行、值五大语义要素，并通过中英文双轨 `MSDS_DESIGN_TOKENS` 集中驱动排版投影，彻底消除模板历史单元格的残留样式，实现拓扑一键调控。

#### Scenario: 中文版五大语义要素统一标准化
- **WHEN** 针对中文版 (CN) 实施全 16 章节排版投影时
- **THEN** 大标题 SHALL 统一为宋体/Times New Roman 12pt (`sz="24"`) 加粗
- **AND** 序号 SHALL 统一为 Times New Roman 10.5pt (`sz="21"`) 或 Tier B 9.5pt (`sz="19"`) 加粗
- **AND** 标签格 SHALL 统一为宋体/Times New Roman 12pt (`sz="24"`) 加粗
- **AND** 说明行与值格 SHALL 统一为宋体/Times New Roman 12pt (`sz="24"`) 常规体
- **AND** 零未经定义的非标字体残留。

#### Scenario: 英文版五大语义要素统一标准化
- **WHEN** 针对英文版 (EN) 实施全 16 章节排版投影时
- **THEN** 大标题 SHALL 统一为 Arial 11pt (`sz="22"`) 加粗
- **AND** 序号、小标题与标签格 SHALL 统一为 Arial 9.5pt (`sz="19"`) 加粗
- **AND** 说明行与值格 SHALL 统一为 Arial 9.5pt (`sz="19"`) 常规体。

### Requirement: 既有全局规范与 Pipeline 核心版式细节全量继承 (REQ-PIPELINE-INVARIANTS-PRESERVE-03)
系统 SHALL 严格捍卫既有功能与业务规范不可否定公理，将过去在 Pipeline 中沉淀的高精度排版细节与业务规则 100% 无损继承至新执行机制中。

#### Scenario: 核心章节排版与结构细节继承
- **WHEN** 写入并渲染各个特定章节时
- **THEN** Section 2 无危害产品 SHALL 严格遵循两行通栏收敛并清除多余空行
- **AND** Section 3 成分表头 SHALL 强制加粗居中，组分行保持常规体
- **AND** Section 8 暴露限值表及手部防护分类题头 SHALL 保持加粗
- **AND** Section 9 理化特性表格 SHALL 保持激光垂线制表位对齐豁免
- **AND** Section 13 英文版内容 SHALL 强制左对齐
- **AND** Section 14 危险货物合规文本 SHALL 完整合规呈现。

#### Scenario: 微观排版与标点清洗继承
- **WHEN** 格式化各章节段落与文本时
- **THEN** 标签与引导说明行 SHALL 严格应用标准悬挂缩进（中文 420 dxa / 英文 560 dxa）
- **AND** 标点符号规范化清洗逻辑 SHALL 自动消除多重句号与中英文标点错乱。
