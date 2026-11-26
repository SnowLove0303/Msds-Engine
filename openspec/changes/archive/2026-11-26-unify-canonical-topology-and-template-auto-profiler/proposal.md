# OpenSpec Proposal: Unify Canonical Topology & Template Auto-Profiler

## 1. 变更背景与目的
当前 `MSDS-Engine` 已具备初步的共享 `canonicalModel`（`context-governor.js`）与全局角色字阶映射（`GLOBAL_ROLE_STYLE_TOKENS`），但仍存在两类架构隐患：
1. **残余语言结构分叉**：`topology-matcher.js` 中仍有少量 `lang === 'zh'` / `lang === 'en'` 的结构分支，且部分英文段落边界依赖下游正则二次猜测，导致中文拓扑改动时英文可能脱节；
2. **模板参数与几何硬编码**：`template-editor.js`（`inspectTemplateSchema` 与 `GLOBAL_ROLE_STYLE_TOKENS`）及 `staged-mechanical-audit.js` 仍硬编码 `9781 dxa`、`[3519, 6262]` 及部分字体/字号（`宋体`/`Arial`、`24`/`21`/`19`），一旦更换新样式模板，渲染与机械审计均存在炸裂风险。

本次变更旨在将体系严格收敛为：**单一规范化拓扑（Single Canonical Topology）× 双语内容与模板参数投影 × 模板自发现剖析（Template Auto-Profiler）**，并同步固化至体系规范与交接文档。

---

## 2. 1:1 需求物理对账矩阵 (RTM — 严格守恒自 Step 0 Gate 1)

| 需求 ID | 需求名称 | 核心契约摘要 | 关联提案 |
| :--- | :--- | :--- | :--- |
| **R1** | 中英文共享唯一结构拓扑与双语同源投影 | 结构拓扑在中英文之间 100% 同构；英文内容严格继承中文 IR 段落数组与槽位结构，消除下游英文正则二次猜结构 | — |
| **R2** | 模板样式自发现剖析（Template Auto-Profiler）与自适应渲染 | 加载任意 `.docx` 模板时自动统计众数表宽、两栏列宽比、各语义角色字体/字号/Tab 缩进与页脚网格，仅缺失时回退默认值 | 提案 C（众数+区间抗脏表污染） |
| **R3** | 渲染与机械审计同源驱动 | `template-editor.js` 与 `staged-mechanical-audit.js` 共用同一份 `TemplateProfile` 基线，新模板下渲染与审计同步自适应 | 提案 D（HPU-7651 零回归）、提案 E（模拟换模板实测） |
| **R4** | 体系规范与交接文档固化 | 将上述三层正交与模板自发现红线同步写入 `SKILL.md` 与体系交接文档 | — |

---

## 3. 法定双清单（Gate 2 施工边界）

### 3.1 拟变范围清单 (Proposed Changes)
1. `[Root Source]` [template-editor.js](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/web/src/template-editor.js)：升级 `inspectTemplateSchema` 为完整的 **Template Auto-Profiler**（自动探测主表宽众数、两栏众数网格、页脚网格、`SEQ_NUM`/`LABEL`/`VALUE`/`EXPLANATION` 字体字号与 Tab 缩进），并让 `GLOBAL_ROLE_STYLE_TOKENS` 与 `applyTopologyTypographyLock` 优先消费实时 `typographyProfile` / `geometryProfile` 而非写死 `9781`；
2. `[State Transition / Matcher]` [topology-matcher.js](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/web/src/topology-matcher.js)：收口残留的语言结构分叉（如 S3 `3.2\t成分` / `3.2\tIngredients` 统一由角色匹配驱动，不依赖硬编码 `tplRows[2]` 与 `lang === 'zh'` 特判），确保拓扑变更同步作用于 CN 与 EN；保留 `@ANTIGRAVITY_INVARIANT_LOCK` 封印的 S1 业务规则（中文保留 `中文名称` 行，英文合并至 `1.1 Product name`）；
3. `[Audit Consumer]` [staged-mechanical-audit.js](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/web/src/staged-mechanical-audit.js)：支持接收 `TemplateProfile`（或在未传入时从当前输出文档各表众数自适应推导基准表宽），使 `P5_TABLE_WIDTH_UNIFIED`、`P5_GLOBAL_ROLE_TYPOGRAPHY` 与 `P5_EN_FONT_SZ19` 等检查与实际模板画像同源；
4. `[Governance Docs]` [SKILL.md](file:///C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md) 与 [体系交接文档 SKILL.md](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/体系交接文档/MSDS_Studio_Agent_Test_Kit/skill/SKILL.md)：同步增补“单拓扑 IR + 双语投影 + Template Auto-Profiler”规范章节。

### 3.2 保持现状承诺清单 (Preserved Invariants — 绝对不触碰)
1. **所有 `@ANTIGRAVITY_INVARIANT_LOCK` 封印逻辑**：S1 中文名称接型号（`HPU-7651`）、S1 英文合并规则、S2 非危产品保留 `GHS-象形图` 与 `根据GHS不属于危害化学品`、S11 括号与冒号规则、16 表宽度一致性；
2. **核心化学事实抽取与翻译词库**：`context-governor.js` 中现有化学名词、法规词库与已验证的 S1–S16 业务语义；
3. **标准生产入口与三任务审计分离职责**：`run_standard_production.mjs` 与 `run_three_task_audit_prep.mjs` 的命令行契约保持向后兼容；
4. **尾页 Section 16 孤立问题**：按用户明文指示继续保持现状，不在本次范围处理。
