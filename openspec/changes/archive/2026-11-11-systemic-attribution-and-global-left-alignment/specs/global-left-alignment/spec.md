# Spec: 全局表格标签与数值纯左对齐立法 (Global Left Alignment)

## REQ-LABEL-ALIGN-02: 表格标签与数值对齐与版面纯净契约

### 2.1 全篇表格第 1 列标签绝对纯左对齐 (Label Alignment Invariant)
- **SHALL**: 全篇所有表格（Table 1 至 Table 16）的第一列（Column 0）所有标签段落，其段落属性 SHALL 显式包含 `<w:jc w:val="left"/>`。
- **SHALL NOT**: 第一列标签单元格中的段落 SHALL NOT 包含 `<w:jc w:val="both"/>`、`<w:jc w:val="distribute"/>` 或 `<w:jc w:val="center"/>`。
- **WHEN**: 存在长英文标签（如 `11.4 Respiratory or skin sensitization:`）自然折行或包含 `<w:tab/>` 时，
  - **THEN**: 系统 SHALL 保证段落采用纯左对齐（`w:jc val="left"`），使单词间距保持单空格标准字距，严禁任何两端分散拉伸。

### 2.2 几何基准与悬挂缩进保持现状 (Geometric Preservation)
- **SHALL**: 标签单元格在修正对齐方式为纯左对齐时，SHALL 100% 完整保留现行母版及规范定义的固定悬挂缩进标尺：
  - Section 11 四位数层级专属标尺：`560` dxa 悬挂缩进（`w:left="560" w:hanging="560"`）及序号后 `<w:tab/>` 垂直对齐线；
  - Section 9 / 14 等三位数层级黄金标尺：`420` dxa 悬挂缩进（`w:left="420" w:hanging="420"`）；
  - 无序号子标签：`420` dxa 左缩进（`w:left="420"`）。
- **SHALL NOT**: 纯左对齐整改 SHALL NOT 导致序号与文本之间的距离发生缩水、位移或制表位丢失。

### 2.3 Section 13 标签水平居中剔除与值对齐收敛
- **SHALL**: Section 13 标签单元格（处理方法 / Disposal methods:）在保持垂直居中（`w:vAlign val="center"`）的同时，水平文字对齐 SHALL 规范为纯左对齐（`w:jc val="left"`）。
- **SHALL NOT**: Section 13 标签单元格 SHALL NOT 具有水平居中（`w:jc val="center"`）。

### 2.4 出厂硬门禁拦截 (Gate 6 Quality Assertion)
- **SHALL**: 流水线出厂质检（Gate 6）SHALL 对全篇所有表格所有第 1 列（Col 0）单元格进行断言校验，若发现任何非 `left` 的 `both`、`distribute`、`center`，SHALL 立即抛出阻断异常并熔断交付。
