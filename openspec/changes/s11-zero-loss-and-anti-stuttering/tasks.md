# Tasks: Section 11 端点完备性、叠词清洗与硬审计闭环

- [x] **TASK-01**: 规范文档立法更新：区分补充写入全局通用规范 (G-33, G-34) 与 Section 11 局部规范 (L-S11)
  - *验证命令*: `git diff docs/MSDS_SPECIFICATIONS_COMPLETE_GUIDE.md` 确认规范已写入。
- [x] **TASK-02**: 机械审计套件升级 (`audit_bipolar_bilayer.mjs`)：下沉经皮数据、零叠词、11.2 标签术语物理硬断言
  - *验证命令*: 执行 `node web/scripts/run_audit_pu202a.mjs`，在修改代码前**必须实测红灯拦截**！ (已实测红灯拦截 12 项违章)
- [x] **TASK-03**: 匹配与流水线引擎重构 (`smart-matching.js` & `pipeline-engine.js`)：补齐经皮行、清洗前缀叠词、对齐 11.2 标签
  - *验证命令*: 代码通过 `review_diff_in_vscode` 检阅。
- [x] **TASK-04**: 执行流水线重新生成 PU-202A 8 格式交付物并通过全景深度终审
  - *验证命令*: `node web/scripts/generate_pu202a_deliverables.mjs` 实测退出码 0。
- [x] **TASK-05**: 物理对账、更新 CHANGELOG 并执行 Git 原子提交
  - *验证命令*: `git commit` 并调用 `open_in_vscode` 统览。
