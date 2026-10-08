# Design: 表格边框高保真折叠与线条完整性架构设计

## 1. 核心技术原理与 CSS 标准模型重构

根据 W3C CSS 2.1 / CSS 3 Table Box Model 规范，表格在 `border-collapse: collapse` 模式下的解析规则如下：
1. **边框折叠算法（Collapsing Border Model）**：
   - 相邻单元格共享边界，浏览器会根据边框冲突解决优先级（Border Conflict Resolution）选取样式，折叠为单一物理边界；
   - 当每一个单元格的四周均明确具备 `border: 1px solid #6f6f6f` 时：
     - 单元格内部的水平与垂直交界线自动折叠为一条 1px 细线（绝不会出现 2px 双线）；
     - 包含 `rowspan="N"` 的单元格，其右侧物理边框将纵贯所跨越的全部 N 行，与这 N 行对应列单元格的左侧边框无缝缝合；
     - 无论是首个子元素还是后续子元素，无论是否存在复杂 `colspan` 或 `rowspan`，全表任意单元格的上下左右四边皆有保障，彻底消灭线条断裂与丢失现象。

## 2. 样式重构与旧版脆弱规则废除

### 2.1 废除 `td + td` / `tr + tr > td` 假象边框
旧版样式采用了类似文本列表分割线的技巧：
```css
/* 废除该脆弱机制 */
.structured-table td { border: 0 !important; }
.structured-table td + td { border-left: 1px solid #6f6f6f !important; }
.structured-table tr + tr > td { border-top: 1px solid #6f6f6f !important; }
```
该机制在平铺单列或无跨行表格上看似正常，但在遇到任意 `rowspan` 时，后续行的第 1 个单元格在 HTML 语法中是 `:first-child`，无法触发 `+ td` 选择器，直接导致垂直分割线缺失。

### 2.2 确立标准统一定义
在 `web/src/styles.css` 中升级为：
```css
.structured-table, .editor-excel-table, .editor-table {
  min-width: 590px;
  background: #fff;
  border-collapse: collapse !important;
  border: 1px solid #6f6f6f !important;
  border-spacing: 0;
}

.structured-table td, .structured-table th,
.editor-excel-table td, .editor-excel-table th,
.editor-table td, .editor-table th {
  border: 1px solid #6f6f6f !important;
  color: #202a33;
  background: #fff;
}
```

## 3. 清理代码生成层的内联样式干扰

在 `web/src/render-utils.js` 中：
- `sourceCellStyle(cell, tableWidthTwips = null, fallbackGrid = false)`：
  - 将原本硬编码的 `const styles = ['border:0'];` 改为 `const styles = [];`；
  - 避免在 HTML 属性 `style="border:0;..."` 中写入对 CSS 规则产生干扰的硬编码声明，使表格边框样式完全受控于统一 CSS 设计体系。

## 4. 重点场景覆盖与验证矩阵

| 场景 | 特征 | 涉及文档与 Section | 预期效果 |
| :--- | :--- | :--- | :--- |
| **Section 11 毒理学** | Row 3 `rowspan="4"`（急性毒性：吸入/经皮/二乙二醇...）<br>Row 12 `rowspan="3"`（生殖毒性：致畸形/体外遗传...） | CN 冠志、EN 冠志、PU-2341E 等 | 3 列子表各行左右垂直线完整，与 Col 0 跨行单元格无缝贴合 |
| **Section 2 危险性** | Row 9 `rowspan="5"`（健康危害：食入/皮肤/眼睛/体征...） | CN 冠志、EN 冠志 | Col 0 与 Col 1 之间的纵向边框线贯穿 5 行，清晰连续无截断 |
| **Section 3 成分组成** | Row 1 包含 `colspan="2"`，后续行 3 列平铺并含空单元格 | CN 冠志、EN 冠志 | 3 列结构网格完好，每个成分、CAS 号与百分比单元格边框分明 |
