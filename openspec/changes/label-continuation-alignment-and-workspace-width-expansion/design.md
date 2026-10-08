# Design

## Context
依据《MSDS Studio 识别页与智能匹配页可用空白及标签列宽度审计报告》，当前界面存在两大核心技术瓶颈：
1. **CSS 特异性覆盖导致网格失效**：
   `styles.css` 中 `.structured-table td:first-child .label-parent-row` 声明了 `display: block !important`，其特异性高于 `.label-line-grid`，导致本应为 Grid 容器的标签行被强制渲染为普通 Block 流。当文本在窄列下折行时，第二行文字脱离正文槽起始线，直接回退至单元格最左边缘，产生约 44.79px 的严重错位；
2. **全局容器宽度锁死与三屏模式挤压**：
   `main.page-shell` 固定 `max-width: 1920px`，导致在 2304px 等宽屏下两侧闲置约 380px 空间；智能匹配页 `.matching-col-scroll` 存在每表 20px 横向内边距；三屏模式下原始表仅 427px、标准表仅 502px，标签列实际仅有 140~172px。

## Goals / Non-Goals

**Goals:**
1. **解决续行垂直共线**：排除特异性覆盖，确保 `.label-line-grid` 始终为 `display: grid !important`，正文槽始终为 `grid-column: 2; display: block;`，折行第二行首字与第一行中文首字 100% 垂直共线（误差 <= 1px）。
2. **释放宽屏空白**：放宽 `main.page-shell` 宽屏上限至 `min(calc(100vw - 32px), 2400px)`，回收两侧 180px 级可用空间。
3. **优化识别页三列网格**：侧栏保持 140px，结构化表提升至 `minmax(0, 1.25fr)`，原版式预览保持稳定最低宽度 `minmax(820px, 1fr)`。
4. **优化匹配页三种模式与内边距**：回收 `.matching-col-scroll` 横向内边距至 `4px`；三屏模式提高原始表与标准表宽度分配。
5. **纯二列表格自适应保底**：为纯二列标签-值表提供充足标签列宽，杜绝长标签逐字伪竖排。
6. **结构与导出安全**：绝不改动 Section 3 三列成分表，绝不改动单列正文，绝不将网页显示列宽回写到 DOCX 模型的 `gridWidthsTwips` 或导出文件。

**Non-Goals:**
- 不改变 DOCX 识别层非标文本提取逻辑。
- 不修改匹配核心引擎 `runSmartMatching` 或 `applyMatchResultToEditor` 的插槽映射规则。

## Decisions

### 1. 修复 `.label-line-grid` 的 CSS 特异性与槽位绑定
在 `web/src/styles.css` 中：
```css
/* 排除 label-line-grid，普通块级标签才使用 block */
.structured-table td:first-child .label-parent-row:not(.label-line-grid),
.structured-table td:first-child .label-child-row:not(.label-line-grid),
.structured-table td:first-child .label-title-row:not(.label-line-grid),
.label-parent-row:not(.label-line-grid),
.label-child-row:not(.label-line-grid),
.label-title-row:not(.label-line-grid) {
  display: block !important;
}

/* 坚决保证 label-line-grid 为网格容器 */
.structured-table td:first-child .label-line-grid,
.label-line-grid {
  display: grid !important;
  grid-template-columns: var(--sequence-width, 2.8rem) minmax(0, 1fr) !important;
  column-gap: 0.35rem !important;
  align-items: baseline !important;
}

/* 确保正文槽为独立块级单元，折行在第二槽内自然垂直对齐 */
.structured-table td:first-child .label-line-grid .label-text-slot,
.label-line-grid .label-text-slot {
  display: block !important;
  grid-column: 2 !important;
  min-width: 0 !important;
  word-break: break-word !important;
}
```

### 2. 宽屏外层自适应策略
```css
.page-shell {
  max-width: min(calc(100vw - 32px), 2400px);
  width: 100%;
  margin: 0 auto;
  padding: 18px 16px 28px;
}
```
当屏幕视口从 1920px 扩展至 2304px 时，工作区增加约 384px 预算，消除左右大面积灰白空白。

### 3. 识别页网格比例重构
```css
.inspector-layout {
  grid-template-columns: 140px minmax(0, 1.25fr) minmax(820px, 1fr);
  gap: 16px;
}
```
结构化识别表面板获得约 1050px 宽度，标签列自然增长至 360px 以上，同时原版式预览保持 820px 以上保证 DOCX 格式可读。

### 4. 匹配页模式重构与内边距回收
- `.matching-col-scroll`：内边距调整为 `padding: 8px 4px;`。
- 三屏模式网格分配：提升原始表与标准表权重，确保原始表达到 >= 520px，标准表达到 >= 620px。

## Risks / Trade-offs

- **[Risk]** 在较窄屏幕（< 1280px）下，预览列设置 `820px` 可能会导致布局换行或溢出。
  - **Mitigation**: 严格保留 `@media (max-width: 1280px)` 与 `@media (max-width: 820px)` 断点，小屏下自动折叠为单列堆叠或两列切换。
- **[Risk]** 纯二列表格加宽标签列是否会波及 Section 3 三列表格。
  - **Mitigation**: 规则仅针对纯二列（`colCount === 2`）生效，Section 3 三列成分表以及 Section 2/11/13/15/16 单列正文严格排除。
