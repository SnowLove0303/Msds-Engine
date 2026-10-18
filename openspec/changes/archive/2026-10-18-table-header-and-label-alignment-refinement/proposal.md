# 提案：全 16 Section 标签序号双槽对齐、垂直居中与 Section 3 表头 CAS/含量格式统一重构 (Proposal)

## 1. 变更背景 (Context)

在《MSDS Studio 全 16 Section 标签、序号对齐与 UI 格式专项审计报告》中，通过源代码、CSS 样式表与实际浏览器 DOM 测算，揭示了当前 Web 工作台与模板编辑器存在的一系列视觉与排版缺陷：
1. **Section 3 表头格式严重割裂**：同一表头行中，`化学品名称`（第 0 列）为加粗下划线且带 2.2rem 缩进，而 `CAS编号` 与 `含量%（w/w）`（第 1、2 列）被渲染引擎误降级为常规体（`font-weight: normal`）且无缩进，三代表头单元格字体粗细、内边距与基线脱节；
2. **标签格强制顶部对齐**：`styles.css` 中暴力硬编码了 `.structured-table td:first-child { vertical-align: top !important; }`，导致所有标签单元格被强制置顶，破坏了模板原生的垂直居中；
3. **序号与标签首字未对齐**：序号采用可变宽度的内联文本流，不同位数的序号（如 `1.1` vs `10.1` vs `11.10`）导致后续标签首字 X 坐标参差不齐；
4. **多行长标签续行回弹**：长标签换行时（如 `11.8 特异性靶器官系统毒性...`），续行直接跌回单元格最左边缘，缺乏悬挂缩进；
5. **窄列汉字伪竖排**：Section 8、Section 11 极窄标签列允许逐字断行，导致汉字纵向单字折行，视觉如同竖版排布；
6. **第一列非标签内容误套样式**：Section 13 废弃处置、Section 15 法规说明、Section 16 免责声明等单列独立文本被误包装为标签容器。

虽然昨晚的 42 项修复已彻底解决了数据抽取、In-Place 写入逻辑与后端门禁，但上述 UI 渲染层与样式排版层的问题必须通过专门的细致规约进行系统性根治。

---

## 2. 变更目标 (Objectives)

全面落实以下四大维度的细致重构与修复：

1. **核心突破：Section 3 表头三列格式彻底统一**
   - 废除仅靠 `isFirstColumn` 判定角色的粗暴逻辑，全面消费 `cell.role === 'table-header'` 与 `cell.fontRole === 'label-header'`；
   - 确保 `化学品名称`、`CAS编号`、`含量%（w/w）` 三个单元格统一呈现为**加粗（font-weight: 700）**、统一下划线、统一表头内边距与基线，并在 DOCX 导出中同步固化；
2. **全局居中与视效治理：移除暴力置顶覆盖**
   - 彻底清除 CSS 中第一列 `vertical-align: top !important;` 覆盖，恢复单元格原生 `middle` 垂直居中；
   - 建立标签列最小可读宽度与防折断机制，杜绝 Section 8 / 11 汉字纵向逐字折行伪竖排；
3. **高精排版：序号与标签固定双槽位（Double-Slot）与悬挂缩进**
   - 将标签行重构为 Grid 双槽位：`.sequence-slot`（固定宽度槽） + `.label-text-slot`（标签文本槽）；
   - 16 个章节的所有标签首字在视觉上强制归一至同一垂直线上；
   - 多行长标签续行严格锁定在 `.label-text-slot` 内换行，首字与第一行标签首字精确垂向对齐；
4. **单列语义解耦与跨工作区统一**
   - 为 Section 13、15、16 单列说明赋予 `value-only` / `source-note` 独立容器，使用常规值字体与自然文本折行；
   - 确保“01 DOCX识别”、“02 智能匹配三列对照”与“03 模板编辑器”三大工作区共享完全统一的渲染与角色逻辑。

---

## 3. 影响范围 (Scope)

- **前端渲染器**：[`web/src/render-utils.js`](file:///f:/Skill/MSDS/web/src/render-utils.js)
- **全局样式表**：[`web/src/styles.css`](file:///f:/Skill/MSDS/web/src/styles.css)
- **底层拓扑与母版模型**：[`web/src/docx-engine.js`](file:///f:/Skill/MSDS/web/src/docx-engine.js)
- **工作台交互入口**：[`web/src/main.js`](file:///f:/Skill/MSDS/web/src/main.js)
- **自动化测试**：新增专用测试 [`web/tests/test_ui_alignment_and_table_headers.mjs`](file:///f:/Skill/MSDS/web/tests/test_ui_alignment_and_table_headers.mjs)，并确保全量回归通过。
