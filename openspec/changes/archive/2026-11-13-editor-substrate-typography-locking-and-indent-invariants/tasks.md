# Tasks: 编辑器底层排版几何固化与多列顶格/通栏层级缩进执行计划

- [x] 1. 编辑器底层固定序号与标签间隔机制 (REQ-SEQ-LABEL-SPACING-02)
  - [x] 1.1 在 `web/src/universal-editor-primitives.js` 的 `applyGlobalTypographyProjection` 中，固化单个 `<w:tab/>` 节点装配，消除多余空格
  - [x] 1.2 固化章节内最大序号数字位数动态检测逻辑（Tier A 420 dxa / Tier B 560 dxa），消除 Section 11 特判硬编码
  - [x] 1.3 编写测试用例 `web/tests/test_editor_indent_and_alignment_invariants.mjs`，验证带序号标签的制表符纯净度与动态标尺自适应性
  - *验证命令*: `node web/tests/test_editor_indent_and_alignment_invariants.mjs --suite=spacing` (退出码 0)

- [x] 2. 编辑器底层固定标签对齐与多行折行机制 (REQ-LABEL-CONTINUATION-ALIGN-03)
  - [x] 2.1 固化悬挂缩进锁死机制（`<w:ind w:left="420" w:hanging="420"/>`），确保折行第二行首字在 420 dxa 垂线上垂直对齐
  - [x] 2.2 固化未编号标签 `w:left="420"` 段落缩进注入，使其首字起始位置与带编号标签保持一致，消除锯齿
  - [x] 2.3 固化清除 `w:firstLine`、`leftChars` 及 `w:numPr` 污染原语
  - *验证命令*: `node web/tests/test_editor_indent_and_alignment_invariants.mjs --suite=label-alignment` (退出码 0)

- [x] 3. 编辑器底层固定多列顶格/通栏层级缩进二分机制 (REQ-VALUE-INDENT-ALIGN-04)
  - [x] 3.1 固化多列表格（`cells.length > 1`）值单元格纯净顶格左对齐原语（清空段落 `w:ind` 或置零 `w:left="0"`）
  - [x] 3.2 固化单列通栏表格（如 Section 2）子项措施段落向右层级缩进原语（`s2SubValueIndent` 240 / 420 dxa）
  - [x] 3.3 重新导出 HPU-7651 交付物并进行全量排版对齐核销
  - *验证命令*: `node web/tests/test_editor_indent_and_alignment_invariants.mjs --suite=value-alignment && node web/scripts/export_hpu7651_deliverables.mjs` (退出码 0)

- [x] 4. 1:1 双向物理核销与 OpenSpec 规范合流归档 (REQ-SPECS-RECORD-01 ~ REQ-VALUE-INDENT-ALIGN-04)
  - [x] 4.1 汇总结算实测证据与事实指纹
  - [x] 4.2 运行 `openspec validate 2026-11-13-editor-substrate-typography-locking-and-indent-invariants --strict` 确保零错误零警告
  - [x] 4.3 呈现 VS Code 原生两栏 Diff 检阅通道，呈报最终交付报告
