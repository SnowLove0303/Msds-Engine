# Tasks: 重构最终工作流审计流程（Agent 审计任务 1 / 合并版 Context 3）

- [x] **T-01**: 编写受控脚本 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\generate_context3_report.mjs`，复用 `web/src/recognition-engine.js`，支持将主预设 CN 与 EN 产出物识别结果及 16 章节三方对照表合并写入单一 `<MODEL>_context3.md`。
  - *验证命令*: `node --check "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\generate_context3_report.mjs"`（退出码 0）
- [x] **T-02**: 使用 `HPU-7651` 实测 `generate_context3_report.mjs`，生成单文件合并版 `HPU-7651_context3.md`，核验文件内同时包含三方对照表、CN Context 3（16/16 无损）与 EN Context 3（16/16 无损），且正确标注 Section 8 硬规顺序（`8.1 暴露控制 -> 8.2 控制参数`）。
  - *验证命令*: `node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\generate_context3_report.mjs" ...`（退出码 0，且核查产出 `.md` 内容）
- [x] **T-03**: 更新 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md` 的 Phase 10 与阶段 6，正式编入 **Agent 审计任务 1（内容审计）**、主预设合并 Context 3 规范、次预设隔离核验、底层硬规白名单（含 `8.2 控制参数`），并预留后续 Agent 审计任务槽位（任务 2/3）。
  - *验证命令*: 已核对 `SKILL.md` 变更（Phase 10 与阶段 6）。
- [x] **T-04**: 完成 OpenSpec 规格与实测核销交付。
