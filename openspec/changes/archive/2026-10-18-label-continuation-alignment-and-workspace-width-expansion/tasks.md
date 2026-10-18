# Tasks

## 1. 恢复 `.label-line-grid` 真实 Grid 布局与续行首字垂直对齐

- [x] 1.1 在 `web/src/styles.css` 中重构 `.label-parent-row` 与 `.label-line-grid` 样式规则：使用 `:not(.label-line-grid)` 排除网格容器被 `display: block` 覆盖，并强制声明 `.label-line-grid` 为 `display: grid !important` 且 `.label-text-slot` 为 `grid-column: 2; display: block;`；验证运行时 `computedStyle.display === 'grid'`。
- [x] 1.2 编写端到端续行垂直对齐断言逻辑：针对发生换行的标签（如 Section 5 `5.1 合适的灭火剂：`），断言第一行首字与第二行首字水平坐标一致（偏差 <= 1px），杜绝第二行回退到最左侧（44.79px 偏差）。

## 2. 释放外层工作区可用空白与面板比例重构

- [x] 2.1 放宽 `main.page-shell` 宽屏宽度限制：将 `max-width: 1920px` 重构为 `max-width: min(calc(100vw - 32px), 2560px)`，在 >= 1920px 视口下释放左右闲置空白；保留 1280px 以下响应式断点。
- [x] 2.2 优化识别页与匹配页面板分配：在 `web/src/styles.css` 中优化 `.inspector-layout`（`minmax(0, 1.25fr) minmax(820px, 1fr)`）以及三屏模式网格分配；回收 `.matching-col-scroll` 横向装饰内边距（调整为 `8px 4px`）。
- [x] 2.3 纯二列表格自适应标签列宽保障：为纯两列标签-值表格设置稳固的标签列保底宽度（`min-width: 175px`），大幅减少不必要折行；严格排除 Section 3 三列表格与单列正文。

## 3. 全套回归测试与真实浏览器布局断言

- [x] 3.1 编写 `web/tests/test_label_continuation_and_workspace_width.mjs` 测试套件，深度覆盖：Grid 容器特异性校验、换行第二行首字共线断言、外层工作区宽度利用率断言、Section 3 三列表头保护断言；运行并通过测试。
- [x] 3.2 运行系统全量回归套件（`test_section1_and_label_value_separation.mjs`、`test_all_views_chinese_first_char_alignment.mjs`、`test_ui_alignment_and_table_headers.mjs`、`test_full_problem_inventory.mjs`、`smoke.mjs`、`npm run build`），确保 100% 通过。
