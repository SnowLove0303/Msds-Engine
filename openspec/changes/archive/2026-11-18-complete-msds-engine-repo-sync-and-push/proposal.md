# 变更提案: MSDS-Engine 全量工程资产与工作流推送远程仓库
## Proposal: Complete MSDS-Engine Assets & Workflow Synchronization and Remote Push

> **Change ID**: `2026-11-18-complete-msds-engine-repo-sync-and-push`  
> **Type**: Chore / Feature / Repository Synchronization  
> **Status**: In Review (等待门禁 2 审查批准)  
> **Author**: Antigravity Coordinator  

---

## 1. 变更背景与动因 (Motivation & Context)
用户明确要求：“把完整的MSDS-Engine（含工作流等） ，完整啊，完整，就是全部相关的东西（ 除产出物外），推送到仓库”。
当前 `MSDS-Engine` 本地分支在经过持续的工业级迭代后，包含了：
1. **CAS 国际标准数学校验与实体消歧审计体系**（`cas-validator.js`、`legal-invariants-oracle.json`、117 项单元测试及 174 项中央主审计）；
2. **底层引擎重大健壮性优化**（`docx-engine.js` 针对无表段落与属性安全读取、`pipeline-engine.js` 针对 Section 9 表头回退容灾、`smart-matching.js` 针对 Section 2 跨记录提取）；
3. **最新企业级工作流与 SOP**（`msds-studio` v9.0-ENTERPRISE 技能、SOP 12 阶操作规程与两大人机门禁）；
4. **全量 OpenSpec 历史与主规格资产**（包含 `cas-audit`、`section2-hazardous-ingredients`、`pipeline-performance-and-audit` 等）；
5. **完整的测试用例与体系交接文档**（`web/tests/` 全量套件、`问题研究报告/`、`体系交接文档/`）。

本地分支已领先远程 123 个提交，且存在大量未跟踪的核心工程组件，必须在严格排除具体型号成品（Word/PDF 交付物与运行时 session 缓存）的前提下，实现全量工程资产的结构化提交与推送到 GitHub 远程仓库 (`https://github.com/SnowLove0303/Msds-Engine.git`)。

---

## 2. 1:1 Spec-Kit 需求对账矩阵 (RTM 守恒注入)

| 原始需求 ID | 需求内容与范围 | 承接规格条款 (Specs) | 关联原子任务 (Tasks) |
| :--- | :--- | :--- | :--- |
| **REQ-INGEST-01** | 完整包含工作流与核心工程资产 (含工作流等，完整，全部相关) | `SPEC-SYNC-01` | Task 1, Task 3 |
| **REQ-INGEST-02** | 严格隔离与排除所有交付物产出物 (除产出物外) | `SPEC-SYNC-02` | Task 2, Task 3 |
| **REQ-INGEST-03** | Git 仓库完整原子暂存与规范沉淀 (推送到仓库 - 本地层) | `SPEC-SYNC-03` | Task 3, Task 4 |
| **REQ-INGEST-04** | 远程仓库安全推送与状态同步核销 (推送到仓库 - 远程层) | `SPEC-SYNC-04` | Task 5 |

---

## 3. 拟交付资产概览 (Deliverables Overview)
1. **工作流与技能资产同步**：将最新 `msds-studio` v9.0-ENTERPRISE 规范同步至 `.agents/skills/msds-studio/SKILL.md`，并将 `cas-audit` OpenSpec 规格并入仓库；
2. **排除边界加固**：在 `.gitignore` 中补充 `temp_sessions/` 等运行时缓存排除项，确保交付物绝对零污染；
3. **全量工程代码与测试提交**：将核心引擎代码修复、`web/tests/` 测试套件、`web/scripts/` 审计流水线脚本、`docs/` 规范及体系交接文档进行结构化 Git 暂存与提交；
4. **远程分支 100% 同步**：执行 `git push origin main`，验证远程与本地分支完全对齐（Up to date，Exit Code 0）。
