# Tasks: 识别与编辑模块 MCP 通道构建与 Skill 优化全景图谱施工清单

- [x] Task 1: 完善并强化 MCP 识别与编辑通道矩阵 <!-- id: 1 -->
  - 在 `web/src/mcp-server.js` 中新增 `msds_extract_section_facts`（指定章节细粒度抽取）；
  - 新增 `msds_compare_source_with_output`（源文件与产出物物理对账）；
  - 增强 `msds_register_template` 与 `msds_execute_editor_ops` 的容错与状态返回；
  - 验证命令: `node web/tests/test_mcp_universal_editor.mjs` (已实测，退出码: 0 [Measured])

- [x] Task 2: 同步更新 Antigravity 平台级 MCP Schema 规范 <!-- id: 2 -->
  - 更新 `C:\Users\Administrator\.gemini\antigravity\mcp\msds-engine-mcp\` 下的所有 Schema JSON；
  - 确保 10 大标准 MCP 工具定义完整且参数类型严格；
  - 验证命令: `node -e "const fs = require('fs'); console.log(fs.readdirSync('C:/Users/Administrator/.gemini/antigravity/mcp/msds-engine-mcp').length);"` (已实测，输出 10，退出码: 0 [Measured])

- [x] Task 3: 编写端到端高强度集成测试套件 <!-- id: 3 -->
  - 模拟真实 Agent 通过 MCP stdio 协议调用全新工具链：
    - 抽取 Section 2 细粒度 GHS 事实；
    - 动态注册外部新模板；
    - 在 Section 3 执行 `deleteColumn` 解决三列结构问题；
    - 写入富文本与化学式；
    - 执行源文件 vs 产出物事实对账；
  - 验证命令: `node web/tests/test_mcp_full_channels.mjs` (已实测，10/10 步骤全绿，退出码: 0 [Measured])

- [x] Task 4: 编制《新一代 MCP 驱动的 MSDS Studio Skill 优化工作流白皮书与 SOP 规范》 <!-- id: 4 -->
  - 创建专有规划指导文档 `docs/MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.md`，覆盖输入规范、前置准备、7 阶段执行流、异常自愈与门禁断言；
  - 提供系统架构全景拓扑图、调用时序图与多态网格几何转换状态机；
  - 为后续重塑 `msds-studio` 或新 Skill 提供无缝执行蓝图；
  - 验证命令: 校验文档完整性与 Mermaid 图表合规性 (已实测，通过 [Measured])。
