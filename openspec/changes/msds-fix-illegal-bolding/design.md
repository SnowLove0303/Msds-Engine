# Design: Font Weight Fidelity & Targeted Bolding Control

## Technical Architecture

### 1. `sourceRunStyle` 加粗判定重构
原实现：
```javascript
const format = { ...(run?.format || {}), ...(roleStyle || {}) };
...
if (format.bold) styles.push('font-weight:700');
```
问题根因：
当 `roleStyle` 传入 `{ bold: true }` 时，直接覆盖了 `run.format.bold`，导致无论源文档是否加粗，输出均为 `font-weight:700`。

新设计：
1. `sourceRunStyle` 的加粗判断必须优先以 `run.bold`（源文档 OOXML `<w:b>` 标记）为准。
2. 只有当 `run.bold` 为 true 时才添加 `font-weight:700`；若未加粗，则输出 `font-weight:normal` 或不添加粗体样式。
3. 页眉页脚环境继续维持 `font-weight:normal` 强约束。

### 2. 区分标签列（Column 0）中的“真正标签”与“正文/数值”
在结构化表格第 0 列中，存在以下几种情况：
- **真正的标签项**（如 `1.1 产品名称：`、`3.1 产品类型：`、`中文名称：`、`建议：`、Section 15 规定项等）：
  字号应用小四（12pt / 24 halfPoints）。加粗状态遵循源文档 run.bold。
- **序号前缀**（`sequence.text` 如 `1.1  `、`3.1  `）：
  明确具备 `font-weight: 700` 与 12pt 字号。
- **说明性或事实值行**：
  - Section 16 独占行（免责声明）：全段未加粗，使用正文字号与常规粗细。
  - Section 11 毒理学独占行：正文段落未加粗，使用正文字号与常规粗细。
  - Section 8 第 2 行限值声明、第 7-9 行规格说明：未加粗，使用常规粗细。
  - Section 3 第 4 行（聚氨酯聚合物、水、三乙胺等成分数据行）：纯粹的组分数据值（`cell.kind === 'value-only'` 或无 labelText），严禁作为标签角色处理，保留正文字号与常规粗细。
  - Section 2 内部的正文说明项（如“根据GHS不属于危害化学品”）：未加粗段落使用常规粗细。

### 3. 兼容性与不变量守恒
- **Row 0（Section 表头）**：继续 100% 原始透传，绝对不改动。
- **两级垂直对齐**：继续保持 `.label-parent-row`（0 缩进）与 `.label-child-row`（2.2rem 缩进）的严格垂直对齐，不受文字粗细调整的影响。
- **Section 14 拆行与空行剔除**：维持现有拆行与过滤逻辑不变。
