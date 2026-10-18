# 任务清单：全 16 Section 标签序号双槽对齐与 Section 3 表头格式统一重构 (Tasks)

## 1. Section 3 表头三列 CAS/含量格式统一 (Focus P0)

- [x] 1.1 在 `web/src/render-utils.js` 中重构表头渲染逻辑：当 `cell.role === 'table-header'` 或 `cell.fontRole === 'label-header'` 时，统一强制输出 `font-weight: 700`、统一下划线，并赋予 `.table-header-row` 统一类名，消除第 0 列由 `label-child-row` 带来的 2.2rem 偏位缩进；
- [x] 1.2 在 `web/src/docx-engine.js` 中固化母版表头样式：确保 Section 3 表头三列（化学品名称、CAS编号、含量%（w/w））在 DOCX 导出时底层 XML run 均具备显式 `<w:b/>` 节点，保障所见即所得。

## 2. 全局垂直居中与防伪竖排宽度锁定

- [x] 2.1 在 `web/src/styles.css` 中移除 `.structured-table td:first-child { vertical-align: top !important; }` 的硬性置顶覆盖；
- [x] 2.2 在 `web/src/render-utils.js` 的 `sourceCellStyle` 中，将标签单元格的垂直对齐默认设为 `middle`（除 Row 0 章节大标题外），恢复母版原生垂直居中；
- [x] 2.3 在 `web/src/render-utils.js` 与 `web/src/styles.css` 中为窄标签列增加最小可读宽度（`min-width: 110px`），并将断行规则由 `anywhere; break-word;` 调整为 `break-word; normal;`，彻底杜绝 Section 8 与 Section 11 汉字逐字垂直断行。

## 3. 序号与标签首字双槽位 (Double-Slot) 与多行悬挂缩进

- [x] 3.1 在 `web/src/styles.css` 中定义 `.label-line-grid`、`.sequence-slot`、`.label-text-slot`，确立统一的 CSS 变量 `--sequence-width: 2.8rem;`；
- [x] 3.2 在 `web/src/render-utils.js` 的 `renderParagraph` 中重构序号输出：存在前缀序号时输出 `.label-line-grid` 双槽位结构，使全 16 章节所有标签首字在视觉上强制对齐于同一条垂直线；
- [x] 3.3 验证 Section 11.8 等多行长标签：确保换行文本完全包裹在 `.label-text-slot` 内，续行与首行标签文字垂直对齐，杜绝回弹至单元格最左边缘。

## 4. 单列说明行语义解耦与跨工作区统一

- [x] 4.1 在 `web/src/docx-engine.js` 与 `web/src/render-utils.js` 中完善 `value-only` / `source-note` 单列说明行判定，针对 Section 13、15、16 单列文本剥离标签类名与缩进，渲染为独立正文容器；
- [x] 4.2 统一识别工作区、智能匹配三列对照与模板编辑器对新角色与双槽位的样式消费，确保三大工作区显示 100% 连贯一致。

## 5. 自动化测试套件与全量回归闭环

- [x] 5.1 编写专用自动化测试套件 `web/tests/test_ui_alignment_and_table_headers.mjs`，针对 Section 3 表头三列加粗下划线、双槽位结构、垂直居中与无竖排断行进行全面断言；
- [x] 5.2 运行冒烟测试 (`npm run test:smoke`) 与全量问题回归套件 (`node tests/test_full_problem_inventory.mjs`)，确保 0 退化全绿通过；
- [x] 5.3 执行 `npm run build` 确保前端生产打包成功无报错。
