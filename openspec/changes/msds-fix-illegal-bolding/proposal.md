# Proposal: Fix Illegal / Non-Standard Bolding (忠实保留源文档加粗状态，根除错误非法加粗)

## Background & Problem Statement
在当前的 DOCX 渲染流程中，为了统一标签列的样式，在 `renderParagraph` 中对第 0 列单元格（`isFirstColumn`）无条件赋予了标签角色样式（`effectiveRoleStyles.label`，包含 `bold: true`）。此外，`sourceRunStyle` 使用了 `roleStyle` 覆盖原 run 的 `bold` 属性。
这直接导致源文档中原本为**常规未加粗字体（normal weight）**的大量内容被前端非法强制加粗，包括：
1. **Section 16**：免责声明正文（“就我们所掌握的知识信息…”）整段被错误加粗；
2. **Section 11**：毒理学研究说明段落整段被错误加粗；
3. **Section 8**：限值与规格说明单列行（如“根据EC指令2006/121/EG,无可用的接触限值信息”、“氟化橡胶 –FKM:厚度≧0.4mm；穿透时间≧480min.”）被错误加粗；
4. **Section 3**：组分表格中位于首列的物质名称值（如“聚氨酯聚合物”、“水”、“三乙胺”）被错误加粗；
5. **Section 2**：GHS 危险性说明正文（如“根据GHS不属于危害化学品”）被错误加粗。

## Proposed Changes
1. **源文档加粗真实性第一原则（Source Fidelity）**：
   每个文本 run 的加粗权重必须严格以 OOXML 中实际的 `run.bold` 为基准。如果源 Word 文档中该 run 未加粗（`run.bold === false`），**前端绝对严禁擅自赋予 `font-weight: 700` 或强制加粗**。
2. **解耦字号规范与加粗权重**：
   标签单元格的字号可规范为小四（12pt / 24 halfPoints），但加粗权重 `font-weight` 绝不应盲目覆盖 `run.bold`。
3. **精准保护说明行与数据值行**：
   对于单列说明段落（Section 16、Section 11、Section 8 注记等）以及子表格数据值行（Section 3 成分行），严禁作为标签角色赋予粗体，忠实按正文呈现。
4. **保留合法加粗项**：
   源文档中原本就加粗的标签项（如“1.1 产品名称：”、“3.1 产品类型：”、“建议：”、“其它的规定：”）以及显式提取的前缀序号（如“1.1  ”、“3.1  ”）维持 `font-weight: 700`。

## Scope
- 修改范围：`web/src/main.js`、`web/tests/smoke.mjs`。
- 绝不改动已解决的表头透传、标签两级对齐、Section 14 拆行以及空行剔除逻辑。
