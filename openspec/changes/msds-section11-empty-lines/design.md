# Design: Section 11 空段落防坍缩与视觉空行还原

## 1. 架构与机制设计

### 1.1 空段落检测机制
在 `renderParagraph(paragraph, cell, record, roleStyles = null, isFirstParagraph = false, row = null)` 中：
- 判断当前段落是否为空白段落：
  ```javascript
  const isEmptyParagraph = !(paragraph.text || paragraph.rawText || '').trim() && (!paragraph.runs?.length || paragraph.runs.every((r) => !r.text?.trim() && !r.images?.length));
  ```
- 若单元格内存在实质文本或图像（`Boolean(cell.text?.trim() || cell.images?.length)`）：
  - 说明该空段落属于内容中间的“段落空行间隔”；
  - 渲染为具有确定行高的防坍缩元素：
    ```javascript
    if (isEmptyParagraph) {
      return `<div class="paragraph-spacer" style="${sourceParagraphStyle(paragraph, isFirstColumn)};min-height:1.2em;line-height:1.2em" aria-hidden="true">&nbsp;</div>`;
    }
    ```
- 若整个单元格无任何实质文本与图片（真·空白单元格）：
  - `renderCellContent` 将正常回退为 `<span class="muted">空白单元格</span>`。

### 1.2 样式规范
在 `web/src/styles.css` 中增加类名：
```css
.paragraph-spacer {
  display: block !important;
  min-height: 1.2em !important;
  line-height: 1.2em !important;
  user-select: none;
}
```
确保即便在复杂的表格内边距与字体缩放下，空行始终稳定占据 1 行正文字体高度（约 14px~18px）。

### 1.3 边界情况与特殊要求保护
- **Section 14 空表格行删除**：`logicalTableRows` 中的 `isEmptyRow` 针对的是 `<tr>`，不受单元格内空段落渲染的影响；
- **Row 0 表头保护**：表头第 0 行不受影响；
- **加粗规范性**：`.paragraph-spacer` 只填充 `&nbsp;`，绝不引入非法加粗。
