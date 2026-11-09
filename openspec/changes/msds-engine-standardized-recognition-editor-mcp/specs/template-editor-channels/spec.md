# Spec: 模板检索与通用编辑器操作通道规格

## ADDED Requirements

### Requirement: 模板格式自感知与标准操作通道
系统 SHALL 支持自动检索 4 套基准母版（中/英 × 冠志/国彩）的表格拓扑与样式元数据，并提供安全工作副本管理与原子化编辑通道。

#### Scenario: 单元格常规体写入与左对齐约束
- GIVEN Agent 选定基准模板并创建了工作副本会话
- WHEN Agent 调用 `writeCellValue` 向值格写入文本
- THEN 引擎 SHALL 强制将文字渲染为常规体（`bold: false`）、西文字体及纯左对齐，严禁粗体泄漏到数值区。

#### Scenario: 激光制表符垂直对齐注入
- GIVEN Agent 编辑 Section 9 理化特性
- WHEN Agent 调用 `formatSection9LaserTabs`
- THEN 引擎 SHALL 注入原生悬挂缩进与 `<w:tab/>`，确保 PDF 标签首字物理垂直绝对对齐至 $X_0 = 80.28\text{pt}$。
