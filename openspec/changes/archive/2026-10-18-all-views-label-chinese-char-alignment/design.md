# 技术设计方案：全视图表格标签中文首字绝对垂向对齐 (All Views Label Alignment Design)

## 1. 架构与布局模型：双槽位网格（Double-Slot Grid）全局统一化

### 1.1 核心思想
所有表格数据行（Row > 0）的标签单元格第一列均由双槽位网格定义：
```text
┌──────────────────────────────────────────────────────────────┐
│ 标签单元格 (Label Cell, Col 0)                                │
│ ┌───────────────────────┬──────────────────────────────────┐ │
│ │ 序号槽位 (Sequence)   │ 标签正文槽位 (Label Text Slot)   │ │
│ │ width: 2.8rem (固定)  │ flex/grid: 1fr (统一水平起点 X)   │ │
│ ├───────────────────────┼──────────────────────────────────┤ │
│ │ 1.1                   │ [产]品名称：                     │ │
│ │ (empty slot 2.8rem)   │ [中]文名称：                     │ │
│ │ (empty slot 2.8rem)   │ [化]学品分类：                   │ │
│ │ 1.2                   │ [产]品推荐及限制用途：           │ │
│ │ (empty slot 2.8rem)   │ [建]议用途：                     │ │
│ │ 1.3                   │ [安]全技术说明书供应商信息：     │ │
│ │ (empty slot 2.8rem)   │ [供]应商名称：                   │ │
│ │ 10.1                  │ [化]学稳定性：                   │ │
│ └───────────────────────┴──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                         ▲
                         │
                 首字垂向绝对共线 (X = 3.15rem)
```

### 1.2 几何计算公式
- 序号槽位宽度：`--sequence-width: 2.8rem;`
- 列间距：`column-gap: 0.35rem;`
- 标签正文首字起始坐标：`X_start = Padding_left(Cell) + 2.8rem + 0.35rem`
- 无论是否存在序号、无论序号是 1 位（`1.1`）还是 2 位（`10.1`）还是无序号（`中文名称：`），正文槽左边缘严格处于同一坐标。

---

## 2. 模块技术改造

### 2.1 `web/src/render-utils.js` 重构
1. **`renderParagraph` 改造**：
   - 当单元格位于首列（`isFirstColumn`）且为数据行（`row.index > 0`），排除标题行（Row 0）、Section 3 表头（`isTableHeader`）和纯单列说明行（`isValueOnly`）：
   - 如果段落具备有效序号 `sequence`：
     输出 `<div class="label-line-grid ..."><span class="sequence-run sequence-slot" style="${sequenceStyle}">${escapeHtml(sequence.text)}</span><span class="label-text-slot">${runMarkup}</span></div>`；
   - 如果段落**无前缀序号**（如 `中文名称：`、`供应商名称：`、`建议：`）：
     同样输出 `.label-line-grid`，但序号槽为占位节点：
     `<div class="label-line-grid ..."><span class="sequence-run sequence-slot empty-slot" aria-hidden="true">&nbsp;</span><span class="label-text-slot">${runMarkup}</span></div>`；
   - 彻底废除 `.label-child-row` 的硬编码 `padding-left: 2.2rem`，使无序号行不再偏移。

2. **`renderEditorCell` 改造**：
   - 在模板编辑器中，提取并清洗 `cell.labelText`：
   - 调用工具函数 `splitLabelSequence(cell.labelText)`，识别出前缀序号（如 `1.1`、`10.1`）与标签正文（如 `产品名称：`、`化学稳定性：`）；
   - 在锁定状态（`allowLabelEdit === false`）与编辑状态（`allowLabelEdit === true`）均渲染双槽位 `.label-line-grid`：
     - 第一槽：`<span class="sequence-slot ${seq ? '' : 'empty-slot'}">${seq ? escapeHtml(seq) : '&nbsp;'}</span>`；
     - 第二槽：锁定状态渲染 `<span class="locked-label">${escapeHtml(cleanLabel)}</span>`；编辑状态渲染带有 `excel-cell-editor is-editable-label` 的编辑框；
   - 彻底解决模板编辑器内标签首字脱离网格基线的问题。

### 2.2 `web/src/styles.css` 统一规则
- `.label-line-grid`：`display: grid !important; grid-template-columns: var(--sequence-width, 2.8rem) minmax(0, 1fr) !important; column-gap: 0.35rem !important; align-items: baseline !important; width: 100% !important;`
- `.sequence-slot.empty-slot`：`display: inline-block !important; width: var(--sequence-width, 2.8rem) !important; visibility: hidden !important; user-select: none !important;`
- 消除任何 `.label-child-row:not(.label-line-grid) { padding-left: 2.2rem }` 产生的偏差，统一下标与内缩基线为 0。

---

## 3. 三大视图同步验证方案
- **01 DOCX 识别**：核验 PU-2341E 等真实文档解析后，Section 1-16 所有数据行标签首字 X 坐标差值为 0；
- **02 智能匹配工作台**：核验左侧“原始提取表”与中间“标准模板表”，所有数据行标签首字 X 坐标差值为 0；
- **03 模板编辑器**：核验编辑器中 Section 1-16 在锁定与编辑模式下，标签首字 X 坐标差值为 0。
