# Tasks: 拓扑编辑器 Agent 原生 MCP 工具固化与 PA-3655 覆写产出测试

- [x] **Task 1: 拓扑编辑器 Agent 原生 MCP/ACI 工具封装与注册 (REQ-01)**
  - 在 `web/src/mcp-server.js` 注册 4 大 Agent 原生工具：
    - `msds_get_section_topology`（内省层）
    - `msds_morph_section_topology`（变形层）
    - `msds_apply_typography_ruler`（排版标尺层）
    - `msds_validate_topology_invariants`（事务审计层）
  - 在 `msds_execute_editor_ops` 扩充 `reshapeRows`、`morphToFullWidth`、`applyAdaptiveRuler`、`enforceFlushLeftValues`、`validateInvariants` 等操作类型
  - 验证命令: `node web/tests/test_mcp_universal_editor.mjs`

- [x] **Task 2: MCP 原生拓扑原语单元测试与变异反欺诈验证 (REQ-01)**
  - 编写或扩充 `web/tests/test_mcp_topological_primitives.mjs`
  - 覆盖内省、变形、自适应标尺与不变量校验的 MCP 级联调用
  - 验证命令: `node web/tests/test_mcp_topological_primitives.mjs` (Exit code 0)

- [x] **Task 3: 调度执行 Agent 运行通用流水线覆写生产 PA-3655 (REQ-02, REQ-03)**
  - 调度执行 Agent 使用物理源文件 `算法训练材料\源文件材料\2-1 单组份水性丙烯酸乳液 PA\PA-3655\PA-3655 msds_CN 冠志.docx`
  - 调用统一固定入口 `run_universal_msds_pipeline.mjs`
  - 产出标准 8 格式交付物至 `算法训练材料\TDS MSDS 重写版\02-1 单组份水性丙烯酸乳液 PA\PA-3655\`
  - 验证命令: `node web/scripts/run_universal_msds_pipeline.mjs --source="算法训练材料\源文件材料\2-1 单组份水性丙烯酸乳液 PA\PA-3655\PA-3655 msds_CN 冠志.docx"`

- [x] **Task 4: 法医级三大审计套件与逐行双重对照核销 (REQ-04)**
  - 执行排版几何不变量测试套件
  - 执行集中式中央主审计套件（173 项宏观物理与局部契约断言）
  - 执行机械审计逐行双重对照中枢（确认 `alarms === 0`，关键条件无遗漏，中文零残留）
  - 出具 1:1 双向物理核销清算表
  - 验证命令: `node web/scripts/run_master_msds_audit.mjs --target="算法训练材料\TDS MSDS 重写版\02-1 单组份水性丙烯酸乳液 PA\PA-3655"`

- [x] **Task 5: VS Code 原生 Diff 检阅、CHANGELOG 知识沉淀与归档 (REQ-01~04)**
  - 通过 `review_diff_in_vscode` 检阅变更代码
  - 登记 `CHANGELOG.md` 知识沉淀
  - 合流 OpenSpec 并完成 Git 原子归档提交
