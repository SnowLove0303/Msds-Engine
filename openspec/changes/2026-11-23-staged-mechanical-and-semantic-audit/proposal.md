# Proposal: 全流程分阶段机械审计与 Agent 内容审计双轨重构

## 1. 背景与动机
现有三套机械审计脚本（`audit_topology_roles.mjs`、`audit_bipolar_bilayer.mjs`、`run_master_msds_audit.mjs`）存在规则大量重复、相互矛盾、仅在 Phase 7 末尾执行，且夹杂写死特定产品原文/固定行数的硬编码断言。本变更确立“**机械审形式/结构/物理/数学确定性，Agent 审原文内容与语义逻辑**”的双轨解耦架构，实现 Phase 1~7 全阶段随动前置拦截与结构化 JSON 直出入库。

## 2. 1:1 需求物理对账矩阵 (RTM)
- **RTM-01**: 机械审计边界纯化：剔除写死特定型号、固定章节行数（如 S1 9行/S13 4行）及强制/禁止法规词的硬编码断言，收敛为统一确定性机械审计引擎。
- **RTM-02**: Phase 1~4 前置机械审计：支持独立校验 `Context 1` 抽取完整性、`Context 2` 数字/CAS 守恒与零中文/文本归一化、`Topology Ops` 前置清零/Preset 独占锁与父级题头保护。
- **RTM-03**: Phase 5~6 交付物 XML 与 PDF 物理审计：校验 4 DOCX 拓扑排版几何（字阶、加粗、单 Tab、Tier A/B 缩进、外实内虚边框、CAS 模 10、双语 16 节行数对称、页眉页脚与双主体隔离）及 4 PDF 物理渲染（PyMuPDF 坐标/字号/末页防空）。
- **RTM-04**: Agent 审计聚焦与速查包增强：增强 `generate_agent_audit_brief.md`，增加 Preset 覆盖槽位声明与 S2/S3/S14 跨章节危化逻辑摘要。
- **RTM-05**: Phase 7 数据库直出集成与随动分段触发（P-01 & P-02）：机械审计返回结构化 JSON 直接写入 `user_exec_logs.db`，`run_standard_production.mjs` 在 `--stopAfter` 分段模式及全流程中自动触发对应阶段机械审计。

## 3. 法定双清单
### 拟变范围清单
1. `[Core Audit Engine]` 新增 `web/src/staged-mechanical-audit.js`：统一分阶段机械审计核心库（Phase 1 ~ Phase 6 独立函数 + 汇总入口，返回标准化 `{ ok, stage, summary, findings }` JSON）。
2. `[Audit CLI]` 新增 `web/scripts/run_staged_mechanical_audit.mjs`：支持 `--stage=phase1|context2|ops|docx|pdf|all`、`--json` 的独立命令行入口。
3. `[Agent Brief]` 修改 `web/scripts/generate_agent_audit_brief.mjs`：增强输出 Preset 覆盖清单与 S2/S3/S14 跨章节危化逻辑摘要。
4. `[Runner Integration]` 修改 `标准化流程/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs`：在 Phase 1、Phase 2~3、Phase 4、Phase 5~6 及 Phase 7 接入分阶段机械审计前置拦截，并将结构化 `findings` 直接写入 `user_exec_logs.db`。
5. `[Packaging]` 修改 `web/scripts/pack_workflow_kit.mjs`（确认自动打包新增的审计模块与脚本，且不打包用户 `.db`）。

### 保持现状承诺清单
1. 绝对不修改 `web/src/context-governor.js`、`web/src/topology-matcher.js`、`web/src/template-editor.js`、`web/src/docx-engine.js` 的核心生产与排版逻辑；
2. 绝对不修改 `web/src/user-exec-db.js` 表结构与 `.gitignore` 数据隔离防线；
3. 绝对不删除现有历史审计脚本及 `npm run lint` 十大硬门禁。
