# 任务清单：全视图表格标签中文首字绝对垂向对齐实施清单 (Tasks)

## 1. 槽位解析与模型基础设施
- [x] 1.1 在 `web/src/docx-engine.js` / `web/src/render-utils.js` 中构建统一的标签序号与文本切分器（`splitLabelSequence`），支持将带序号标签（如 `1.1 产品名称：`、`10.1 化学稳定性：`）与无序号标签（如 `中文名称：`、`供应商名称：`）标准化拆解为序号槽内容与标签正文槽内容。

## 2. 识别与匹配视图首字对齐重构 (DOCX 识别 & 智能匹配)
- [x] 2.1 重构 `web/src/render-utils.js` 中的 `renderParagraph`：
  - 首列数据行（`isFirstColumn` 且非表头 `isTableHeader` 且非单列说明行 `isValueOnly`）无前缀序号时，强制输出带占位序号槽 `<span class="sequence-run empty-slot" aria-hidden="true">&nbsp;</span>` 的 `.label-line-grid` 双槽位容器；
  - 废除 `.label-child-row` 遗留的硬编码 `padding-left: 2.2rem`，使无序号行中文首字与带序号行中文首字完全垂直对齐。
- [x] 2.2 验证 `01 DOCX 识别` 与 `02 智能匹配`（原始提取表与匹配标准模板表）中的带号标签与无号标签中文首字 100% 垂直共线。

## 3. 模板编辑器双槽位网格重构 (模板编辑器)
- [x] 3.1 重构 `web/src/render-utils.js` 中的 `renderEditorCell`：
  - 针对带有 `cell.labelText` 的单元格，全面接入 `.label-line-grid` 双槽位容器；
  - 锁定标签状态（`allowLabelEdit === false`）下，渲染固定序号槽位与正文标签槽位；
  - 可编辑标签状态（`allowLabelEdit === true`）下，将内联编辑控件约束于正文标签槽位中，确保编辑态与锁定态基线完全一致。
- [x] 3.2 验证 `03 模板编辑器` 中带号标签（`1.1`、`10.1`）与无号标签（`中文名称：`、`供应商名称：`）的中文首字与前两个视图完全同基线。

## 4. CSS 样式规范与几何约束加固
- [x] 4.1 在 `web/src/styles.css` 中补齐 `.sequence-slot.empty-slot` 样式：固定宽度 `var(--sequence-width, 2.8rem)`、不可见占位、不可选中；
- [x] 4.2 清除 `.label-child-row:not(.label-line-grid)` 的硬编码缩进，统一使用网格槽位控制垂向对齐；
- [x] 4.3 确保多行长标签（如 11.8 特异性靶器官系统毒性）的悬挂缩进稳定生效，续行严格与首行中文首字垂直对齐。

## 5. 跨三大视图对齐自动化验证与全量回归
- [x] 5.1 编写 `web/tests/test_all_views_chinese_first_char_alignment.mjs`，分别抽取 DOCX 识别、智能匹配（原始+标准）与模板编辑器三大模块渲染结果，对带序号行、无序号行、多位数序号行的首字起始位置进行严格断言；
- [x] 5.2 运行既有自动化测试 `test_ui_alignment_and_table_headers.mjs`、`smoke.mjs`、`test_full_problem_inventory.mjs`、`test_agent_api.mjs` 以及 `npm run build`，确保 100% 通过且无回归缺陷。
