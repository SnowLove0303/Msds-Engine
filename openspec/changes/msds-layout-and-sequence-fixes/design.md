# Design: MSDS Layout & Sequence Refinements

## Architecture & Technical Solutions

### 1. Section 1、3、7、9 序号恢复机制

- **问题分析**：
  - Word 文档存在两种编号机制：
    1. 纯文本编号：存储在 `w:r/w:t` 中（如 `1.1  产品名称：`）；
    2. 字段自动编号：存储在 `w:pPr/w:numPr` 中，并通过 `word/numbering.xml` 映射得到（如 `PU-1107` 和 `正式模板` 的 `3.1`、`7.1`、`9.1` 等）。
  - `docx-engine.js` 中的 `cellRole` 在计算 `labelText` 时，只汇总了 `run.bold` 的文本，未包含 `paragraph.numberingText`，导致编辑器（使用 `cell.labelText`）和某些视图丢失序号。
- **解决方案**：
  - 优化 `cellRole(cell)`：
    ```javascript
    const labelRuns = cell.paragraphs.flatMap((paragraph) => {
      const boldText = paragraph.runs.filter((run) => run.bold).map((run) => run.text).join('').trim();
      if (!boldText) return [];
      const num = paragraph.numberingText?.trim();
      return num ? [`${num}  ${boldText}`] : [boldText];
    });
    const labelText = labelRuns.join(' ').trim();
    ```
  - 增强 `normalizedSequence(paragraph, cell)`：
    若 `paragraph.numberingText` 存在，或段落文本开头匹配单级/多级数字，提取标准 `cleanedSeq`，并格式化等宽前缀；同时在多段落单元格中，支持每段独立检测序号，确保多段标签序号不丢失。

---

### 2. Section 14 多标签分行算法 ("一行一标签")

- **问题分析**：
  - 源文档可能在同一物理行内塞入多个标签。例如 PU-2341E Section 14 第 2 行：
    - Cell 0 包含 3 个段落：`14.2海上运输：`、`14.3空运`、`14.4用户特殊注意事项：`；
    - Cell 1 包含 3 个对应段落：`非危险品海运方式...`、`非危险品运输方式...`、`非危险货物...`。
  - 用户明确规范：“一般一行只有一个标签”。
- **解决方案**：
  - 在 `web/src/main.js` 的 `logicalTableRows(record)` 中增加多标签行拆分逻辑：
    - 检查当前行：若 `cells[0]` 包含多个段落（$\ge 2$），且其中至少有 2 个段落包含有效标签/序号（`cellHasLabel` 或 `normalizedSequence`），且该行不是标题行（`row.index > 0`）：
    - 将该行裂变为 $N$ 个独立的逻辑行；
    - 每个逻辑行包含单个标签段落及对应的数值段落（若数值单元格段落数少于标签数，则后续行数值补空；若数值段落数与标签数一致，则一一对应绑定）。
    - 拆分后的逻辑行均拥有唯一的虚拟 `row.index` 和独立样式。

---

### 3. 空行自动检测与删除机制

- **问题分析**：
  - 源文档存在无意义的空行（所有单元格均无文本或仅为空白换行符），如 PU-2341E Section 14 第 3 行。
- **解决方案**：
  - 在 `logicalTableRows(record)` 遍历过滤层，增加空行检测规则：
    ```javascript
    function isEmptyRow(row) {
      if (row.index === 0) return false; // 严禁误判章节标题行
      return row.cells.every((cell) => {
        const text = cell.text?.trim() || '';
        const hasImages = cell.images?.length > 0;
        return text.length === 0 && !hasImages;
      });
    }
    ```
  - 遇到 `isEmptyRow(row) === true` 时，直接略过该行，不加入渲染与逻辑数据流中。

---

### 4. Section 15 说明性标签左对齐规范

- **问题分析**：
  - Section 15 中的加粗项（如“物质或混合物的相关安全...”、“其它的规定：”、“符合下列法规要求：”）是法规说明项，不能归属于带有 2.2rem 缩进的 `child`，更不能分配自动序号。
- **解决方案**：
  - 在 `docx-engine.js` 的 `classifyLabelTier` 中增加 Section 15 专属规则：
    ```javascript
    if (record?.sectionNumber === 15) {
      // 说明性标签禁止作为 child 缩进，强制顶格左对齐
      return 'parent'; 
    }
    ```
  - 在 `normalizedSequence` 中，若所属为 Section 15 且无明确章节数字编号，坚决返回 `null`，严禁赋号。
  - 在 CSS 中确保 `.label-parent-row` 具有 `padding-left: 0; text-align: left;`，实现绝对顶格左对齐。

---

### 5. 页眉页尾原始格式还原与严禁加粗

- **问题分析**：
  - 用户反馈“页眉页尾的文本需要恢复到最初格式禁止加粗”。
  - 此前因应用了统一角色样式，且部分页眉段落带有加粗标记，导致页眉页尾呈现大字加粗效果。
- **解决方案**：
  - 在 `web/src/main.js` 的 `renderParagraph` 与 `sourceRunStyle` 中：
    - 判定当前记录是否属于页眉或页脚（`record.part !== 'word/document.xml'` 或 `record.section.includes('页眉')`）；
    - 若属于页眉页脚，**彻底禁用**正文表格的 `roleStyles`；
    - 强制应用 `font-weight: normal !important;` 并在 CSS 中追加 `.header-footer-view span { font-weight: normal !important; }`，彻底禁止加粗，还原 OOXML 原始字号与字体族。
