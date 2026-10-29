# Tasks: 英文版说明行 9.5pt 正文字号统一

- [x] **TASK-01**: 规范文档立法更新：写入 G-35 英文表格说明行均一正文字号公理并更新 L-S11
  - *验证命令*: `git diff docs/MSDS_SPECIFICATIONS_COMPLETE_GUIDE.md` 确认规范已写入。
- [x] **TASK-02**: 机械审计套件升级 (`audit_bipolar_bilayer.mjs`)：下沉英文版说明行 9.5pt（`sz="19"`）物理硬断言并执行 TDD 红灯实测
  - *验证命令*: 执行 `node web/scripts/run_audit_pu202a.mjs`，实测拦截红灯（当前文件仍为 24，必须 FAIL）。
- [x] **TASK-03**: 引擎中枢重构 (`docx-engine.js` & `pipeline-engine.js`)：落实英文版全章节说明行 9.5pt（除 Section 2 外）
  - *验证命令*: 代码通过 `review_diff_in_vscode` 检阅。
- [x] **TASK-04**: 执行流水线重新生成 PU-202A 8 格式交付物并通过全景深度终审
  - *验证命令*: `node web/scripts/generate_pu202a_deliverables.mjs` 实测退出码 0。
- [x] **TASK-05**: 物理对账、更新 CHANGELOG 并执行 Git 原子提交
  - *验证命令*: `git commit` 并调用 `open_in_vscode` 统览。
