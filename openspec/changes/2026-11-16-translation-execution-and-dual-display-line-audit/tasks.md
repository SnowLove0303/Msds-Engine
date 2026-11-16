# Tasks: 翻译底层执行写入与机械审计逐行双重对照显示

- [x] **Task 1: 底层翻译写入逻辑与化学品词表强化 (REQ-01)**
  - 在 `web/src/pipeline-engine.js` 修复 Section 9.3 pH 稀释条件（支持 `1:10` 等比例与水溶液无损转译）
  - 在 `web/src/context-governor.js` 统一 `N,N-二甲基乙醇胺` 为 `N,N-Dimethylethanolamine`
  - 规范化 Section 8.2 法规编号为 `2006/121/EC`，优化 Section 5 消防气体确定性转译
  - 验证命令: `node web/tests/test_translation_and_dual_display_invariants.mjs`

- [x] **Task 2: 机械审计逐行双重对照显示模块研发与集成 (REQ-02)**
  - 研发 `web/scripts/audit_translation_dual_display.mjs`
  - 提取 Section 2 至 16 的逐行 `[CN Source]` 与 `[EN Deliverable]` 对齐对
  - 实现关键条件缺失报警 (`CONDITION_MISSING_ALARM`)
  - 集成至 `web/scripts/run_master_msds_audit.mjs`
  - 验证命令: `node web/scripts/audit_translation_dual_display.mjs --help`

- [x] **Task 3: 防回退单元测试与反例变异熔断验证 (REQ-04)**
  - 编写 `web/tests/test_translation_and_dual_display_invariants.mjs`
  - 覆盖稀释比例转译、规范化学名转译、双重显示格式化输出
  - 注入故意截断条件的变异样本，验证机械审计精准红灯熔断（变异反欺诈通过）
  - 验证命令: `node web/tests/test_translation_and_dual_display_invariants.mjs` (Exit code 0)

- [x] **Task 4: HPU-7660 端到端重新覆写与智能体逐行法医审计实测 (REQ-01, REQ-02, REQ-03)**
  - 调度统一流水线重新跑通 HPU-7660 覆写产出
  - 调度 `msdsauditor` 结合逐行双重显示引擎执行 Section 2~16 全要素逐行法医审计
  - 验证 9.3 稀释条件完整存在，无漏译，三大审计套件全绿
  - 验证命令: `node web/scripts/run_universal_msds_pipeline.mjs --source="...HPU-7660 msds_CN 冠志.docx"`

- [x] **Task 5: VS Code 原生 Diff 检阅、CHANGELOG 知识沉淀与归档 (REQ-03, REQ-04)**
  - 逐个文件通过 `review_diff_in_vscode` 提交检阅
  - 登记 `CHANGELOG.md` 知识沉淀
  - 合流 OpenSpec 并完成 Git 原子归档提交
