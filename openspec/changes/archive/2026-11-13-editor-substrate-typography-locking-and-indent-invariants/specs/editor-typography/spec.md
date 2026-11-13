# editor-typography Delta Specification

## ADDED Requirements

### Requirement: 排版公理与几何标尺系统规范沉淀 (REQ-SPECS-RECORD-01)
系统 SHALL 将“序号与标签间隔”、“标签对齐与多行折行”、“值的缩进与多列/通栏对齐”的全部讨论内容，作为法定排版架构规范持久化沉淀记录，确立为全系统排版渲染的单一真理源。

#### Scenario: 核心排版公理持久化
- **WHEN** 引擎执行排版或生成交付物时
- **THEN** 系统 SHALL 遵循多列表格值纯净左对齐与通栏单列树状层级缩进两大核心公理
- **AND** 几何标尺（Tier A 420 dxa / Tier B 560 dxa）SHALL 成为全章节自适应执行的硬性约束。

### Requirement: 编辑器底层序号与标签间隔机制固化 (REQ-SEQ-LABEL-SPACING-02)
编辑器底层原语 SHALL 在序号与标签之间使用单个 `<w:tab/>` 节点，严禁插入多余空格；并依据章节内实际最大序号数字位数（$D_{max}$）动态自适应选择标尺，彻底杜绝 Word 制表位跳步。

#### Scenario: 制表锚点纯净装配
- **WHEN** 编辑器构建带序号的标签段落时
- **THEN** 序号 Run 节点与标签 Run 节点之间 SHALL 仅且只能包含一个 `<w:tab/>` 元素
- **AND** 序号文字后 SHALL NOT 包含多余的空格字符。

#### Scenario: 动态标尺自适应切换
- **WHEN** 章节内最大序号数字位数 $\le 3$ 时
- **THEN** 系统 SHALL 自动采用 420 dxa 标尺，段落悬挂缩进设置为 `w:left="420"` 与 `w:hanging="420"`
- **WHEN** 章节内最大序号数字位数 $\ge 4$ 时
- **THEN** 系统 SHALL 自动升级为 560 dxa 标尺，段落悬挂缩进设置为 `w:left="560"` 与 `w:hanging="560"`。

### Requirement: 编辑器底层标签对齐与多行折行机制固化 (REQ-LABEL-CONTINUATION-ALIGN-03)
编辑器底层原语 SHALL 确保带序号标签在折行时第二行及后续行首字与第一行标签文字首字在 420 dxa（或 560 dxa）垂线实现 100% 垂直悬挂对齐（偏差 $\le 1\text{px}$）；未编号标签注入相同基线 `w:left="420"`，并物理级清除 `w:firstLine`、`leftChars` 及 `w:numPr` 污染。

#### Scenario: 折行垂直悬挂锁定
- **WHEN** 标签文本长度超过单元格宽度而发生多行折行时
- **THEN** 折行后的第二行文字首字 SHALL 精确缩进至 420 dxa（或 Tier B 560 dxa）基准线
- **AND** 第二行首字 SHALL NOT 回缩到序号正下方。

#### Scenario: 未编号标签与带编号标签基线对齐
- **WHEN** 表格中存在未编号的子标签（如防护说明、特定子项）时
- **THEN** 段落属性 SHALL 注入 `w:left="420"`，使其首字起始位置与带编号标签在制表符后的首字在同一垂线上对齐
- **AND** 段落中的 `w:firstLine`、`w:leftChars`、`w:numPr` 属性 SHALL 被彻底清除。

### Requirement: 编辑器底层多列顶格/通栏层级缩进二分机制固化 (REQ-VALUE-INDENT-ALIGN-04)
编辑器底层原语 SHALL 固化多列表格纯净顶格左对齐与单列通栏大纲树状层级缩进的二分架构，保证未来所有产出物全自动标准输出。

#### Scenario: 多列表格值单元格纯净顶格左对齐
- **WHEN** 表格行包含多个物理列（`cells.length > 1`）时
- **THEN** 第 1 列及后续值单元格内所有段落的左缩进 `w:left` SHALL 归零或无 `w:ind`
- **AND** 文本 SHALL 紧贴单元格左内边距（Flush Left），严禁注入多余缩进。

#### Scenario: 通栏单列表格树状层级缩进
- **WHEN** 表格行为通栏单列结构（`cells.length === 1` 或 `gridSpan > 1`，如 Section 2）时
- **THEN** 分类标签段落 SHALL 保持基础缩进
- **AND** 具体的防范说明/措施条款段落 SHALL 强制向右层级缩进（240 dxa / 420 dxa），形成清晰的大纲树状层次。
