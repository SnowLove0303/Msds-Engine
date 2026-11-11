# Tasks: 底层统一语义槽位归属与全篇表格标签/值纯左对齐立法

> **核心纪律**：落实单任务专注锁（`[-]` 单焦点锁），必须通过 `vscode-review` 检阅通道，测试必须真实退出码 0，机检零告警零错误。

- [x] **Task 1: 底层语义槽位归属与清洗纠偏 (smart-matching.js & pipeline-engine.js)**
  - 目标：将“不要吸进烟尘”归属纠偏为 `special_hazards`（5.3），废除抹除逻辑；装配英文 5.3 事实链，纯净化 5.4。
  - 验证命令：`node -e "import('./web/src/smart-matching.js').then(m => console.log('Import OK'))"`
  - 检阅方式：通过 `vscode-review` MCP 提交检阅并确认。

- [x] **Task 2: 底层几何排版纯左对齐机制 (docx-engine.js)**
  - 目标：升级 `applyStandardHangingIndent`、`formatSection11LabelCell`、`formatSection14LabelCell` 强制段落 `w:jc w:val="left"`；修正 `enforceSection13DoubleCenter` 水平左对齐。
  - 验证命令：`node -e "import('./web/src/docx-engine.js').then(m => console.log('DocxEngine OK'))"`
  - 检阅方式：通过 `vscode-review` MCP 提交检阅并确认。

- [x] **Task 3: 全局巡检遍历扩展与 Gate 6 标签纯左对齐硬阻断升级 (pipeline-engine.js)**
  - 目标：Step 12 拓扑巡检覆盖全篇所有表格第一列（`c === 0`）标签强制 `w:jc w:val="left"`；Gate 6 质检门禁增加全篇表格标签单元格非左对齐阻断断言。
  - 验证命令：`npm test` 或编译脚本
  - 检阅方式：通过 `vscode-review` MCP 提交检阅并确认。

- [x] **Task 4: BL-8129A 八格式交付物重新生成、两阶全量物理审计与业务目录同步**
  - 目标：重新执行官方流水线，生成 BL-8129A 的 4 份 DOCX 与 4 份 PDF；运行全量 165 项主审计器确保 165/165 全部通过（退出码 0）；同步至 `E:\冠志\TDS MSDS (2)\待处理文件\BL-8129A\`。
  - 验证命令：`node web/scripts/run_master_msds_audit.mjs`
  - 交付物：双向物理核销清算表与 CHANGELOG 知识沉淀。
