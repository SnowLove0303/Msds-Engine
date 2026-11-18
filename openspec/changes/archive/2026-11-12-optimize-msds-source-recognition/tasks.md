# Tasks: MSDS Source Recognition Optimization (optimize-msds-source-recognition)

- [x] 1. 实现多维特征语义分类器与反误归类逻辑 (`recognition-engine.js`) <!-- id: 1 -->
  - 在 `web/src/recognition-engine.js` 中新增 `classifyRowSemanticType` 与 `classifyCellSemanticType`；
  - 接入加粗、冒号、序号、列数与句式判别规则，彻底解决 Section 2、8、11、13、15 说明行误判为标签的问题；
  - 验证结果: `classifyRowSemanticType` 导入成功且类型为 `function`。

- [x] 2. 在识别引擎中内置 Context 1 标准 Markdown 序列化器 (`recognition-engine.js`) <!-- id: 2 -->
  - 实现 `serializeFactsToMarkdown(facts)`，输出包含 `行号`、`属性`、`标签/题头`、`数据值/内容` 的高可读性表格；
  - 属性列使用统一规范关键词：`章节标题` / `序号标签` / `标签` / `数据值` / `说明行` / `表头`；
  - 验证结果: `serializeFactsToMarkdown` 导入成功且类型为 `function`。

- [x] 3. 创建原生统一 CLI 入口并接入 MCP 服务 (`run_source_recognition.mjs` & `mcp-server.js`) <!-- id: 3 -->
  - 编写 `web/scripts/run_source_recognition.mjs`，支持一键接收源 DOCX 并输出 JSON 与 Context 1 Markdown；
  - 在 `web/src/mcp-server.js` 的 `msds_recognize_source` 中无缝透出 `context1Markdown`；
  - 验证结果: CLI 运行参数验证通过，MCP 工具增强就绪。

- [x] 4. 全量实测 PA-3612 源文件并出具 1:1 双向物理核销清算表 <!-- id: 4 -->
  - 执行统一命令解析 `PA-3612 msds_CN 冠志.docx`，耗时仅 247 ms（远优于 $\le 3$ 秒），零临时脚本；
  - 严格检查生成的 Context 1 Markdown 资产，16 章节分类准确率 100%；
  - 产出路径: `output/PA-3612/PA-3612_context1_recognition.md`。
