# Proposal: 修复三列结构及跨行合并单元格（Rowspan/Colspan）表格线条丢失问题 (table-border-rendering-fix)

## 1. 变更背景与问题定位

在 MSDS 系统（包括“DOCX 识别 Inspector”与“模板编辑器 Editor”）中，部分三列结构的复杂表格在页面中渲染时出现了网格线条直接丢失的问题。

### 🔍 问题现场与根本原因诊断（Root Cause Analysis）

通过对源文档（`正式模板_MSDS_CN_冠志(1).docx`、`正式模板_MSDS_EN_冠志(1).docx`）以及解析渲染链路的深度排查与自动化诊断，已精准定位到线条丢失的物理机理：

1. **Section 11（毒理学信息）三列子表垂直边框丢失**：
   - Row 3 Col 0（`11.1 急性毒性：`）设置了 `rowspan="4"`，横跨 Row 3~6；
   - 随后的 Row 4（`吸入：`）、Row 5（`经皮：`）、Row 6（`根据现有数据...`）在 DOM 的 `<tr>` 中直接从 Col 1 开始，成为该行的第一个子元素（`:first-child`）；
   - Row 12 Col 0（`11.7 生殖毒性：`）设置了 `rowspan="3"`，随后的 Row 13（`致畸形`）、Row 14（`体外遗传毒性`）同理在 DOM 中为 `:first-child`；
2. **Section 2（危险性概述）多行健康危害垂直边框丢失**：
   - Row 9 Col 0（`2.8 健康危害`）设置了 `rowspan="5"`；随后的 Row 10（`食入：`）、Row 11（`皮肤：`）、Row 12（`眼睛：`）、Row 13（`症状和体征：`）在 DOM 中同样为 `:first-child`；
3. **旧版 CSS 选择器机制缺陷**：
   - 在 `web/src/styles.css` 中，单元格边框被过度依赖同级选择器渲染：
     ```css
     .structured-table td, .editor-table td { border: 0 !important; }
     .structured-table td + td { border-left: 1px solid #6f6f6f !important; }
     .structured-table tr + tr > td { border-top: 1px solid #6f6f6f !important; }
     ```
   - 当遇到带有 `rowspan` 的多行多列结构时，后续各行的第 1 个物理单元格为 `:first-child`，根本无法匹配 `td + td`！导致其左边框为 0；
   - 与此同时，跨行单元格（Col 0）本身又被 `border: 0 !important` 强行清除了右边框，导致两者之间的垂直分割线彻底消失、大面积留白；
4. **`render-utils.js` 内联样式冲突**：
   - `sourceCellStyle` 函数中硬编码了 `styles = ['border:0']`，给每个单元格打上了内联清除标记，破坏了标准的表格边框折叠模型。

---

## 2. 变更目标

1. **确立健壮的 CSS Table Box Model 边框折叠体系**：
   - 表格采用标准的 `border-collapse: collapse !important; border: 1px solid #6f6f6f !important;`；
   - 所有表格单元格（`.structured-table td`, `.structured-table th`, `.editor-excel-table td`, `.editor-excel-table th`）统一赋予防伪、无缝折叠的 `border: 1px solid #6f6f6f !important;`；
   - 彻底废除脆弱的 `td + td` 兄弟节点选择器，利用 CSS 标准边框折叠（Border Collapsing）机制，由浏览器引擎自动将相邻单元格及跨行/跨列单元格边缘自然融合成一条清晰锋利的 1px 细线，不产生双线，也不漏掉任何一处边框。
2. **清理内联样式污染**：
   - 在 `web/src/render-utils.js` 的 `sourceCellStyle` 中，移除默认硬编码的 `border:0`，确保单元格边框能由全局设计系统统一规范。
3. **全量覆盖并验证多列复杂表**：
   - 保证 Section 11（急性毒性/生殖毒性 3 列结构）、Section 2（健康危害 3 列多行结构）、Section 3（成分组成 3 列结构）在“DOCX 识别”和“模板编辑器”下横平竖直、线条完整，无缝契合 Excel/Word 原文网格。

---

## 3. 影响范围

- `web/src/styles.css`：优化 `.structured-table` 与 `.editor-excel-table` 边框折叠样式，移除 `td + td` / `tr + tr > td` 边框伪造逻辑；
- `web/src/render-utils.js`：清理 `sourceCellStyle` 中多余的 `border:0` 内联样式；
- `web/tests/smoke.mjs`：增加复杂跨行跨列（Section 2、Section 3、Section 11）单元格边框完整性断言。
