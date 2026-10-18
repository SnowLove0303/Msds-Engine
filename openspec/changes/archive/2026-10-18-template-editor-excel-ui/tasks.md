# Tasks

## 1. 统一模板编辑器三栏布局（对齐识别模块）

- [x] 1.1 在 `web/src/main.js` 的 `renderEditor` 中，调整结构完全对齐 `renderInspector`：左侧 Section 01~16 导航面板、中间主控结构化表格容器、右侧只读预览（`docx-preview`）与紧凑型审计面板。
- [x] 1.2 保持 Ribbon 中模板切换（CN 冠志 / EN 冠志）及“特殊情况：允许修改标签文本”开关，确保状态指示清晰无杂音。

## 2. 重构模板编辑器为纯净 Excel 风格表格显示

- [x] 2.1 重构 `renderEditorTable` 与 `renderEditorCell`，彻底剔除旧版侵入式的 `<th class="row-gutter">`（行号列）与 `<td class="row-actions">`（操作列），采用统一高保真 `<colgroup>`。
- [x] 2.2 彻底剔除单元格内部笨重的大面积 `<textarea>`、底部“可编辑/锁定”小字及“⌗”查看按钮，继承与识别模块完全一致的小四（12pt / 24 halfPoints）字号、规范行高、忠实加粗与对齐层次。
- [x] 2.3 在 `web/src/styles.css` 中重构表格样式，清理旧版冗余样式，确立 Excel 风格网格线与单元格交互基调。

## 3. 实现原地内联在线编辑交互（In-Place Inline Editing）

- [x] 3.1 为可编辑值单元格（以及允许修改标签时的标签单元格）配置 `contenteditable="plaintext-only"`（或无边框内联编辑容器），常态下为纯净排版文本，聚焦时呈现翡翠高光聚焦环（`box-shadow: inset 0 0 0 2px var(--cyan)`）。
- [x] 3.2 绑定 `input` 事件实时调用 `writeCellValue` / `writeCellLabel` 同步 DOCX 数据模型，并刷新工作副本脏状态。
- [x] 3.3 支持键盘导航（`Tab` 切换至下一可编辑格，`Shift+Tab` 切换至上一格，`Enter` 多行换行，`Escape` 失焦）。
- [x] 3.4 保持锁定单元格（Row 0 表头标题、未开启允许修改时的标签）的严格只读保护，光标为默认只读。

## 4. 实现轻量悬浮行操作工具条（Floating Row Actions）

- [x] 4.1 在数据行（Row > 0）悬浮时展示微型悬浮操作胶囊（`.row-floating-actions`），支持“＋ 在此行后新增行”与“× 删除此行”，绝不侵占表格列宽。
- [x] 4.2 保持对 Row 0 表头行的绝对保护，禁止删除表头行。

## 5. 自动化测试与生产构建回归

- [x] 5.1 在 `web/tests/smoke.mjs` 中补充断言：验证模板编辑器表格无多余行号列与操作列、可编辑单元格具备内联编辑标记、数据同步正常且 Row 0 受保护。
- [x] 5.2 执行 `npm run test:smoke` 与 `npm run build` 确保全套测试与生产打包通过。
