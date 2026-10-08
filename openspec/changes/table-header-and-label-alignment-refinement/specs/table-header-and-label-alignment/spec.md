# 规范契约：全 16 Section 标签序号对齐与表头样式规约 (Specification)

## 1. Section 3 表头三列格式与角色一致性契约

### Requirement: Section 3 Table Header Style Uniformity
Section 3 的表头行（`化学品名称 | CAS编号 | 含量%（w/w）`）在 Web 界面渲染与 DOCX 导出中，必须具备完全一致的字体角色、加粗属性与下划线。
- **Scenario**: 渲染 Section 3 表头行
  - **Given** 处于识别表格、标准匹配表格或模板编辑器工作区
  - **When** 渲染包含 `化学品名称`、`CAS编号`、`含量%（w/w）` 的表头行
  - **Then** 所有三列单元格的内部文本均必须呈现为加粗（`font-weight: 700`）
  - **And** 所有三列单元格均保留下划线（`text-decoration: underline`）
  - **And** 消除第 0 列的 `label-child-row`（2.2rem 缩进），三列垂直内边距与基线完全对齐
  - **And** 导出的 DOCX 底层 OpenXML 中三列表头 run 均显式包含 `<w:b/>` 节点。

---

## 2. 序号与标签文本固定双槽位网格契约

### Requirement: Fixed Double-Slot Baseline Alignment
所有带有前缀序号的标签行，必须采用固定宽度的双槽位 Grid 渲染，确保 16 个章节的所有标签首字共用同一水平起始线。
- **Scenario**: 渲染不同位数的序号标签行（例如 `1.1 产品名称`、`10.1 化学稳定性`、`11.10 附加信息`）
  - **Given** 渲染包含序号的标签段落
  - **When** 输出段落 HTML
  - **Then** 必须输出具备 `.label-line-grid` 容器的结构
  - **And** 序号文本位于 `.sequence-slot` 中，宽度固定为统一的 `--sequence-width`（默认 2.8rem）
  - **And** 标签正文位于 `.label-text-slot` 中，首字 X 坐标在全 16 个章节中保持严格垂直共线
  - **And** 禁止序号位数长度推挤标签首字产生水平位置偏移。

---

## 3. 多行长标签悬挂缩进契约

### Requirement: Multi-Line Label Hanging Indent
当标签文本超出单行宽度发生折行时，续行必须保持在标签正文槽内换行，严禁跌回序号下方或单元格左边缘。
- **Scenario**: 渲染 Section 11.8 特异性靶器官毒性等长标签
  - **Given** 标签正文在当前容器宽度下发生折行
  - **When** 浏览器进行文本排版
  - **Then** 第二行及后续换行文本的左边缘必须与第一行标签首字精确垂向对齐
  - **And** 换行文本不得回弹至单元格最左侧（保留由 `--sequence-width` 形成的悬挂空白）。

---

## 4. 标签格垂直居中契约

### Requirement: Label Cell Vertical Centering
结构化表格的标签单元格必须恢复垂直居中对齐，禁止全局强制置顶。
- **Scenario**: 渲染包含多行值的复杂表格行
  - **Given** 右侧值单元格因多行文本导致整行高度增加
  - **When** 渲染左侧标签单元格
  - **Then** 标签单元格的 computed `vertical-align` 必须为 `middle`（章节 Row 0 大标题除外）
  - **And** 严禁任何 CSS `!important` 将其强行覆盖为 `top`。

---

## 5. 窄标签列防伪竖排与横向可读性契约

### Requirement: Horizontal Text Flow in Narrow Columns
Section 8 与 Section 11 等窄标签列必须保障横向可读性，杜绝单字纵向竖排。
- **Scenario**: 渲染 Section 8 或 Section 11 的窄标签列
  - **Given** 标签列列宽较窄（如 <= 160px）
  - **When** 计算单元格样式与文本折行
  - **Then** 标签列设置不低于 110px 的最小安全宽度
  - **And** 汉字按语义词组换行，严禁逐字单字向下断裂
  - **And** 英文单词、浓度单位及成对括号（如 `（w/w）`）保持横向完整，不得被暴力横向劈开。

---

## 6. 单列说明行语义解耦契约

### Requirement: Value-Only Row Semantics
Section 13 废弃处置法规、Section 15 法规清单、Section 16 免责声明等单列大文本行，必须作为独立值容器呈现。
- **Scenario**: 渲染无冒号标签的单列独立大文本
  - **Given** 单元格跨全列且文本长度较大无标签前缀
  - **When** 渲染该行
  - **Then** 赋予 `role = 'value-only'` 与 `fontRole = 'value'`
  - **And** 渲染为 `.value-only-row`，采用正文字体与常规字重（`font-weight: normal`）
  - **And** 禁止包裹为 `label-parent-row` 或强行注入标签加粗与缩进。
