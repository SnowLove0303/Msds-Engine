# Tasks: 通用性 MCP 工作流五大关键拼图施工清单

- [x] Task 1: 最高法定宪章立法与防私改禁令确立 <!-- id: 1 -->
  - 更新 `PROJECT_CONSTITUTION.md`，明文载入用户今日确立的四大法定维护支柱；
  - 增加“非用户明确允许，严禁直接为了单一目的改造工具”最高禁令；
  - 同步更新 `AGENTS.md`，绑定四大维护支柱与一票否决门禁；
  - 验证命令: 静态扫描机检四大法定支柱与最高防私改禁令存在且字字守恒 (已实测，退出码: 0 [Measured])

- [x] Task 2: 增强 MCP 事务生命周期保护与正向行动诊断器 <!-- id: 2 -->
  - 在 `web/src/mcp-server.js` 中重塑 `msds_execute_editor_ops`：执行前自动创建检查点，抛出异常时自动回滚并销毁半成品文件；
  - 增强 `msds_compare_source_with_output`：新增 `actionableGaps` 数组输出，逐节检查关键字段遗漏并提供修复操作指引；
  - 验证命令: `node web/tests/test_mcp_universal_editor.mjs` (已实测，10/10 PASS，退出码: 0 [Measured])

- [x] Task 3: 完善 SOP 决策树与三大经典手术配方库 <!-- id: 3 -->
  - 在 `docs/MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.md` 中增加第二章与第三章：
    - 几何形态判定决策树（2列、3列非标、通栏说明、激光垂线）；
    - 三大经典手术配方库（Recipe A 三列消除、Recipe B 动态组分增减行、Recipe C Run级化学式富文本）；
  - 完善事务回滚与 Gap 对账核销 SOP 规程；
  - 验证命令: 校验文档完整性与 Mermaid 图表合规性 (已实测，通过 [Measured])

- [x] Task 4: 编写并实测端到端五大拼图集成测试套件 <!-- id: 4 -->
  - 编写 `web/tests/test_five_puzzles_workflow.mjs`，包含：
    - 测试点 1: 故意传入越界操作，验证事务自动回滚自愈，无残留半成品文件；
    - 测试点 2: 验证 Recipe A（三列转两列消除第二列）；
    - 测试点 3: 验证 Recipe B（动态增行克隆）；
    - 测试点 4: 验证 Recipe C（Run 级化学式下标）；
    - 测试点 5: 验证对账工具输出 `actionableGaps`；
  - 验证命令: `node web/tests/test_five_puzzles_workflow.mjs` (已实测，6/6 步骤全部满分通过，退出码: 0 [Measured])

- [x] Task 5: OpenSpec 严格校验、CHANGELOG 知识沉淀与合流 <!-- id: 5 -->
  - 更新 `CHANGELOG.md`；
  - 运行 `npx openspec validate msds-universal-mcp-workflow-five-puzzles --strict`；
  - 呈报用户终审成果。
