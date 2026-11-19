# Tasks: MSDS Content Fidelity & Dynamic Formatting Standards

- [ ] **Task 1: Recognition Engine & Training Folder Verification** `[id: T1-REC-VERIFY]`
  - 对照 `识别模块/识别模块训练夹` 内 PA-4840 与 PA-4902 golden markdown，核对 `recognition-engine.js`。
  - 确保 GHS 信号词、危害说明、散文防范措施、其他危害、成分附注、理化稀释比与毒理学数据 100% 提取。
  - 验证命令: `node web/scripts/deep_audit_4840_4902.mjs`

- [ ] **Task 2: Context Governance & Pipeline Fact Preservation** `[id: T2-GOV-FACTS]`
  - 修改 `web/src/context-governor.js` 与 `web/src/production-orchestrator.js`。
  - 废除当 `isHazardous: false` 时对 `signalWord`, `hazardStatements`, `precautionaryStatements` 的粗暴置空。
  - 保留 `componentsNotes`, `otherHazards`, `chemicalClassification` 并在中英文分支中完整流转。
  - 验证命令: `node web/scripts/test_context_governor.mjs`

- [ ] **Task 3: Universal Editor Dynamic Formatting & Content Restoration** `[id: T3-EDITOR-FORMAT]`
  - 修改 `web/src/editor-writer.js`。
  - 恢复 Section 2 散文防范措施四分类排版渲染，恢复信号词与危害说明。
  - 在 Section 3 保持或动态新增通栏附注行 (`gridSpan=3`)，完整呈现中和剂成盐等法规说明。
  - 实施新增内容格式防丢失机制：深克隆模板边框、内边距、居中对齐与 Design Tokens 字阶。
  - 验证命令: `node web/scripts/test_editor_writer_fidelity.mjs`

- [ ] **Task 4: Deliverables Full Matrix Regeneration & WPS 5-Page Enforcement** `[id: T4-DELIVERABLES-GEN]`
  - 执行 PA-4840 与 PA-4902 全矩阵 16 份交付物（8 DOCX + 8 PDF）的重新生成。
  - 调用 WPS 执行 PDF 高保真转换，严格校验 5 页物理版面约束。
  - 验证命令: `node web/scripts/produce_standard_deliverables.mjs --model=PA-4840` & `PA-4902`

- [ ] **Task 5: Tri-Party Intervention Audit & Master Audit Hard Gate** `[id: T5-AUDIT-HARD-GATE]`
  - 编写并执行法医级 `web/scripts/agent_intervention_audit.mjs`，执行源文件 $\to$ 识别事实 $\to$ 产出物三方闭环对账。
  - 运行全量六环主审计套件 `run_master_msds_audit.mjs`，确保零警告零错误（Exit Code 0）。
  - 验证命令: `node web/scripts/agent_intervention_audit.mjs` & `npm run lint`

- [ ] **Task 6: Git Staging & Push (Code & Engine Only, Exclude Deliverables)** `[id: T6-GIT-PUSH]`
  - 严格检查 `git status`，将核心代码、引擎、原语、测试与脚本暂存并提交。
  - 严格排除产出物文件夹，推送到远程仓库 `https://github.com/SnowLove0303/Msds-Engine.git`。
  - 验证命令: `git status` & `git push origin main`

- [ ] **Task 7: Final Retrospective & Comprehensive Audit Artifact** `[id: T7-FINAL-REPORT]`
  - 输出法医级介入审计终审核销报告，形成 1:1 双向对账凭据与 CHANGELOG 知识沉淀。
