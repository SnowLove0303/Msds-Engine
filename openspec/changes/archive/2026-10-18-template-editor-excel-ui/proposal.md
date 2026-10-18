# Proposal: 统一模板编辑器与识别模块 UI 布局并升级为 Excel 风格在线编辑 (template-editor-excel-ui)

## 1. 变更背景与用户需求

当前系统的“DOCX 识别”（Inspector）模块经过多轮迭代，已具备高度成熟、纯净的 Web UI：
- **三栏式标准布局**：左侧 16 节导航与实时检索、中间正文高保真结构化表格预览、右侧只读原版式 DOCX 渲染；
- **高保真 Excel/Word 表格呈现**：严格遵循源文档列宽（`colgroup`）、单元格边框、小四（12pt / 24 halfPoints）字号、源文档粗细忠实性、两级垂直对齐（父级顶格、子级 2.2rem 缩进）及空行防坍缩间隔（`.paragraph-spacer`）。

相比之下，现有的“模板编辑器”（Editor）模块存在明显视觉断层与噪点：
- 在表格左右强行插入了额外的 `.row-gutter`（“01 标题”）和 `.row-actions`（“＋ / ×”按钮）列，导致表格列宽与比例失真；
- 在单元格内部塞入了大面积灰框 `<textarea>`、底部“可编辑/锁定”角标及“⌗”查看按钮，使得界面更像粗糙的传统表单，完全缺乏如同 Excel / Google Sheets / Notion 般的现代电子表格质感。

**用户明确诉求**：
> “研究一下目前识别模块的web UI 已经比较完善了，我想复制到模板编辑器，采用同样的UI布局和excel 表格显示，并且支持在线编辑”

## 2. 变更目标

1. **统一 UI 布局（Unified UI Layout）**：
   - 将模板编辑器彻底重构为与识别模块完全一致的三栏式专业布局：
     - **左侧**：16 节导航树、实时搜索框、工作副本脏状态指示与统计；
     - **中间**：高保真 Excel 风格结构化表格（完全复用 `structured-table` 样式与比例）；
     - **右侧**：内嵌模板只读原版式 DOCX 预览 + 审计信息面板。
2. **复制 Excel 风格纯净表格显示（Excel-like Spreadsheet Display）**：
   - 彻底移除左右侵入式的行号列（`row-gutter`）与行操作列（`row-actions`），移除单元格底部噪音角标；
   - 还原纯净自然的 Excel/Word 原始网格线，继承完全相同的列宽、字体、字号、加粗与对齐层次。
3. **支持优雅的行内在线编辑（In-Place Inline Editing）**：
   - 单元格在常态下呈现纯净排版文本；
   - 点击或聚焦可编辑单元格时，呈现翡翠/青色聚焦光环（Excel 风格单元格选中高亮，无布局抖动），支持直接原地编辑文本；
   - `Tab` 键快速跳转到下一个可编辑单元格，`Enter` / `Shift+Enter` 支持多行文本编辑，失焦或回车自动同步数据模型（`writeCellValue` / `writeCellLabel`）；
   - 锁定单元格（如第 0 行标题、系统受保护单元格）保持只读与禁用光标，防止误触。
4. **轻量非侵入式行操作（Contextual Row Actions）**：
   - 通过行悬浮工具条（Hover Floating Toolbar）或表格操作栏，提供“在当前行后插入行”与“删除当前行”能力，既保留行增删，又绝不破坏表格本身的几何列宽。

## 3. 影响范围

- `web/src/main.js`：重构 `renderEditor`、`renderEditorTable`、`renderEditorCell` 及在线编辑事件监听；
- `web/src/render-utils.js`：提供统一的编辑器单元格内联渲染与格式支持；
- `web/src/styles.css`：新增 Excel 风格单元格编辑态高亮、悬浮行工具条样式，清理旧版冗余的 `.row-gutter`、`.row-actions`、`.editor-cell-foot` 样式；
- `web/tests/smoke.mjs`：补充模板编辑器 Excel 风格渲染、内联编辑数据绑定与只读保护断言。
