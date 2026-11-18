# Specification: 英文版全章节说明行 9.5pt 正文字号统一规范

## ADDED Requirements

### Requirement: G-35 英文表格说明行均一正文字号公理
在英文版 MSDS 文档中，除 Section 2 遵循特殊危险性分类引导外，所有章节内部的说明行、前言行、免责行（通栏或单列单元格）SHALL 统一采用英文表格正文基准字号 9.5pt（`w:sz="19"` 与 `w:szCs="19"`）。

#### Scenario: 英文说明行字号与表格值拉齐
- **WHEN**: 流水线装配英文版文档中除 Section 2 外的任何章节说明行（如 Section 11、12、13 等）时；
- **THEN**: 系统 SHALL 将其文本的 `<w:sz>` 与 `<w:szCs>` 统一设置为 `"19"`，字体为 Arial 常规体，消除与普通填报值之间的字号断层。

### Requirement: L-S11-EN Section 11 英文版说明行规格
Section 11 英文版前言行与免责行 SHALL 严格遵循 9.5pt 格式标准。

#### Scenario: Section 11 英文前两行排版验证
- **WHEN**: 导出或审计英文版 Section 11 时；
- **THEN**: Row 1 免责行与 Row 2 前言行内的文本字号属性 SHALL 严格等于 `"19"`，且严禁出现 `"24"`。
