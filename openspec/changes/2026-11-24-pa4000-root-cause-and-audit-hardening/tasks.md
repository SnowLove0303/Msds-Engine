# Tasks: 单焦点执行清单（严格执行 `[-]` 单任务锁）

- [ ] **T1. 重构审计引擎并完成旧版 `PA-4000` 盲测红灯自证 (REQ-06, 提案 C)**
  - 在 `web/src/staged-mechanical-audit.js` 新增 S8 顺序、S2 相邻重复/丢标、`/°C` 单位守恒、`g/cm3` 与 `(e. g.,` 间距检查。
  - 验证命令：对当前未修复的 `PA-4000` 执行审计脚本，实测必须检出 S2、S8、S9.19/9.20、S9.11、S13 全部问题（`ok: false`）。
- [ ] **T2. 修复 Section 2 `GHS象形图：` 标签丢失 (REQ-01)**
  - 修复 `web/src/context-governor.js` 中 `!isHazardous` 裁剪规则，仅裁剪无源值的空占位行，保留带值 `GHS象形图：` 及其英文映射。
- [ ] **T3. 根治 Section 8 `8.1 暴露控制 / 8.2 控制参数` 颠倒与防复发 (REQ-02, REQ-04)**
  - 清理 `web/src/translation-memory.json` 反向条目；在 `context-governor.js` 与 `topology-matcher.js` 建立全场景（含无 OEL 多列表场景）`8.1 暴露控制` → `8.2 控制参数` 唯一规范结构。
- [ ] **T4. 优化翻译单位透传与排版间距管线 (REQ-05, 提案 B)**
  - 在 `context-governor.js` 与 `docx-engine.js` 实现源标签 `/℃` → `/°C` 通用保留；增强 `healEnSpacing` 的 `g/cm3` 间距与修复 `msds-db.js` `(e. g.,`。
- [ ] **T5. 编写黄金不变量与反例变异测试 + Lint 零告警 (REQ-04, 提案 A)**
  - 在 `tests/` 新增测试：正常通过，且人为反转 S8 或剥离 `GHS象形图：` 时必须红灯拦截；运行 `npm run lint`（`--max-warnings=0`）退出码 0。
- [ ] **T6. 仅重产 `PA-4000` 四份 MSDS DOCX + 四份 PDF 并执行两阶深度审计 (REQ-03, REQ-08)**
  - 仅对 `PA-4000` 执行重新标准化与导出；跑通新版 `staged-mechanical-audit.js` 全绿，并人工逐行转储核验（含 S2、S8、S9.19/9.20、S9.11、S13）。不审计 TDS。
- [ ] **T7. 将 TDS 观察项打回 `tds-specialist` Subagent (REQ-07, REQ-08)**
  - 通过 `send_message` 将 `PA-4000_审计报告.md` 中的 TDS 观察项（`Semi-transparent` vs `Translucent`、英文多出 `cool`；明确说明 `Limited Company` 正确保持不变）反馈给 `tds-specialist` 处理。
