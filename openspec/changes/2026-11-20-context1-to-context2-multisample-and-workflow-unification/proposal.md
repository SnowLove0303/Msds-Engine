# OpenSpec Proposal: Context 1 -> Context 2 多样本检验、机械分类补强与工作流统一提速

> **Change ID**: `2026-11-20-context1-to-context2-multisample-and-workflow-unification`  
> **治理体系**: Ps-openspec · Step 2 (OpenSpec Authoring & Gate 2)  
> **前置门禁**: Step 0《需求零损耗立案对账备忘录》已获用户批准。

---

## 一、 1:1 需求物理对账矩阵 (RTM 守恒)

| 需求编号 | 核心要求 | OpenSpec 规格落点 |
| :--- | :--- | :--- |
| **REQ-01** | 通过更多跨品类、跨版式样本开展 `Context 1 -> Context 2` 测试，检验程序对 Context 1 的处理情况 | `specs/context2-governance/spec.md#REQ-01` |
| **REQ-02** | 补充机械辅助分类逻辑并优化工作流调用，解决 Agent 无机械辅助下无法准确分类序号、标签、值、说明行的问题 | `specs/context2-governance/spec.md#REQ-02` |
| **REQ-03** | 恪守“内容来源于源文件 + 源文件内容继承”，Context 2 仅依规范对 Context 1 做合规调整与补充（如 S1.1 CN 版产品中文名称标准写法） | `specs/context2-governance/spec.md#REQ-03` |
| **REQ-04** | 消除 Agent 阅读过多文件与自写脚本的低效现象，统一调用链并大幅提升 Agent 处理速度 | `specs/context2-governance/spec.md#REQ-04` |

---

## 二、 法定双清单 (Dual-List Gate 2)

### A. 拟变范围清单（严格最小因果集 + 因果角色标注）

| 拟变文件路径 | 因果角色 | 变更内容摘要 |
| :--- | :--- | :--- |
| `web/src/context-governor.js` | `[State Transition & Governance]` | 1. 强化 `buildStructuredContext2` 机械重分类引擎（精准区分序号、父标签、子标签、数据值、说明行、表头、组分行）；<br>2. 落实“源内容继承 + 规范加工”准则：补全 Section 1.1 CN 版产品中文名称标准写法（`<中文品名> <modelCode>`）、Section 4~16 完整英文映射接入、Section 2/3 跨节附注拆分迁移及 Section 11/14 范式判定；<br>3. 导出自带结构化校验摘要（含未分类行/误分类告警）。 |
| `web/scripts/msds_mcp_gateway.mjs` | `[Unified Gateway & Speedup]` | 1. 支持 `--tool=msds_run_context1_to_context2`（或一步连贯导出 Context 1 + Context 2 Markdown/JSON），消除 Agent 多段拼接脚本；<br>2. 在返回摘要中内嵌下一步操作提示与 16 节校验状态，减少 Agent 翻阅文档。 |
| `web/src/mcp-server.js` | `[Unified MCP Contract]` | 注册或增强 `msds_govern_context2` 与一键直通校验能力，保障统一入口完备性。 |
| `web/scripts/test_context1_to_context2_multisample.mjs` | `[Multi-Sample Verification]` | 新增跨品类多样本（>= 8 个样本：PA-4840, PA-4902, PU-202A, PU-2346A, EP-8801, OS-79A, HPU-7651, RU-10130 等）`Context 1 -> Context 2` 自动化检验与结构核查脚本。 |
| `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md` | `[Workflow Convergence]` | 精简并固化“零源码阅读、统一 MCP 网关一键直达 Context 1 -> Context 2 -> 编辑器”极速标准调用链。 |

### B. 保持现状承诺清单（绝对只读与不可否定）

1. **受控母版资产 (`web/templates/`)**：4 套官方定型 DOCX 底模保持 100% 只读不变；
2. **既有交付引擎 (`web/src/docx-engine.js`, `web/src/pipeline-engine.js`, `web/src/universal-editor-primitives.js`)**：已通过 PA-4840/PA-4902 171 项主审计的核心排版与渲染逻辑、`@ANTIGRAVITY_INVARIANT_LOCK` 封印块 100% 保持原状，绝不破坏；
3. **源文件识别底线 (`web/src/recognition-engine.js`)**：已完成的零硬编码、零英译污染、`facts.integrity` 物理无损指纹逻辑保持不变；
4. **本地测试/正式产出物 (`算法训练材料/TDS MSDS 重写版/`)**：不触碰既有已验收交付物，且严禁将任何产出物推送至 Git 仓库（产出别推）。
