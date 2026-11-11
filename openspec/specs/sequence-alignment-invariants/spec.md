# sequence-alignment-invariants Specification

## Purpose
TBD - created by archiving change adaptive-dynamic-sequence-alignment-governance. Update Purpose after archive.

## Requirements

### Requirement: REQ-DYNAMIC-ALIGN-01 自适应序号对齐几何标尺
系统在渲染与投影任意章节（Section）的表格时，SHALL 依据该章节内实际出现的最大序号数字位数（$D_{max}$）动态选择对齐标尺，严禁依据章节编号（如 Section 11）进行硬编码强制覆盖。

#### Scenario: 三位数序号自适应采用 420 dxa 黄金基准
- **WHEN** 章节内最大序号数字位数 $\le 3$（例如包含 `9.1`、`11.1` ~ `11.9`、`8.2.1` 等）
- **THEN** 该章节所有带序号标签的段落悬挂缩进 SHALL 设置为 `w:left="420"` 与 `w:hanging="420"`
- **AND** 序号与标签文本之间 SHALL 挂载 `<w:tab/>` 制表锚点

#### Scenario: 四位数及以上序号自适应升级为 560 dxa 宽幅标尺
- **WHEN** 章节内最大序号数字位数 $\ge 4$（例如包含 `11.10`、`11.11`、`11.1.1`、`8.2.2.1`、`14.1.1.1` 等）
- **THEN** 该章节所有带序号标签的段落悬挂缩进 SHALL 设置为 `w:left="560"` 与 `w:hanging="560"`
- **AND** 序号与标签文本之间 SHALL 挂载 `<w:tab/>` 制表锚点

#### Scenario: 彻底消除 Section 11 特判硬编码
- **WHEN** 渲染 Section 11 且其实际仅包含 `11.1` ~ `11.8`（如 OS-8970 8 行毒理拓扑）
- **THEN** 系统 SHALL 自动判定最大数字位数为 3 位，并采用 420 dxa 标尺
- **AND** 严禁出现历史遗留的 `|| (sectionNumber === 11)` 导致的 560 dxa 强加行为
