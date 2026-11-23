# Proposal: Build Ps-openspec Maintenance & Architecture Governance System

## 1. 原始需求与 1:1 RTM 对账矩阵

- **RTM-01（系统架构确定与模块权责映射）**：在 `ARCHITECTURE.md` 中确立全体系 8 大模块（识别、内容治理、拓扑匹配、底层原语/编辑器、机械审计、全局/局部规范、Agent 执行层、静态 Lint）的单一权责边界与单向依赖流向。
- **RTM-02（通用性维护指南构建）**：新建 `MAINTENANCE_GUIDE.md`，提供“现象 → 唯一责任模块”路由决策树、通用性准入铁律与**角色驱动单一排版真源**维护准则。
- **RTM-03（防复发与防覆盖锁定）**：建立“缺陷修复 → 下沉为 `staged-mechanical-audit.js` / `lint_code_invariants.mjs` 机械门禁 → 关键不变量加注 `@ANTIGRAVITY_INVARIANT_LOCK` 封印”的双重防复发防覆盖闭环。
- **RTM-04（每次修改显式标识规范）**：确立源码修改标识格式（`// @FIX_TAG(<日期>/<模块>/<FIX-ID>): <根因与通用性说明>`）与 `CHANGELOG.md` 双向台账联动。
- **提案 A（机械化校验）**：在 `web/scripts/lint_code_invariants.mjs` 中新增 `LINT-LOCK-01`（`@ANTIGRAVITY_INVARIANT_LOCK_START/END` 成对完整性校验）。
- **提案 B（排障速查卡与 OpenSpec 模板）**：在 `MAINTENANCE_GUIDE.md` 附带“30 秒排障路由速查表”与“单次缺陷修复 OpenSpec 最小归档模板”。

## 2. 变更动机与范围声明
- **拟变范围**：`openspec/changes/build-ps-openspec-maintenance-system/*`、`ARCHITECTURE.md`、`MAINTENANCE_GUIDE.md`、`AGENTS.md`、`CHANGELOG.md`、`web/scripts/lint_code_invariants.mjs`。
- **保持现状承诺**：核心生产与审计引擎代码（`39ce540`）、母版 `web/public/templates/` 及用户数据库 `web/data/*.db` 保持只读不碰。
