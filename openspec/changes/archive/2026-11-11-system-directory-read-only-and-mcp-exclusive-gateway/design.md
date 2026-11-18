# Architecture Design: 系统核心目录绝对只读与 MCP 唯一执行通道架构
(`design.md`)

## 一、 系统架构设计与责任边界 (Architecture & Separation of Concerns)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        人类用户最高主权层 (Human Authority)                     │
│  • 拥有最高立法权与授权权                                                       │
│  • 未经明文授权批复，系统核心底座对生产 Agent 绝对只读                          │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ 授权门禁 / 缺陷上报裁决
┌───────────────────────────────────────▼─────────────────────────────────────────┐
│                     系统治理与底座研发角色 (Platform Governance)                 │
│  • 职责: 通用算法迭代、MCP 工具扩展、审计硬门禁建设                             │
│  • 权限: 仅在用户明确授权后，经 OpenSpec 生命周期修改系统代码                   │
│  • 资产范围: web/src/, web/templates/, web/scripts/                             │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ 封印交付物：暴露标准 MCP API
┌───────────────────────────────────────▼─────────────────────────────────────────┐
│                    生产执行角色 (Production / Overwrite Agent)                   │
│  • 角色定位: 纯粹的【数据调度者与 MCP 操作员】                                   │
│  • 权限边界:                                                                    │
│    - 系统目录 (web/src/, web/templates/, web/scripts/) ➔ 🔴 严格绝对只读        │
│    - 目标交付目录 (TDS MSDS 重写版/, 待处理文件/) ➔ 🟢 受控可写                  │
│    - 执行通道 ➔ 🔒 唯一通过 msds-engine-mcp 工具链受控执行                      │
│  • 遇到缺陷: 强制停机出具《底座缺陷申报单》，严禁私自加特判                     │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ 唯一受控通道 (JSON-RPC MCP Tools)
┌───────────────────────────────────────▼─────────────────────────────────────────┐
│                  官方 MSDS-Engine MCP 协议服务 (msds-engine-mcp)                 │
│  1. msds_recognize_source        ➔ 结构化化学事实感知 (CAS/GHS/理化数据树)       │
│  2. msds_get_template_schema     ➔ 官方母版网格拓扑透视                          │
│  3. msds_execute_editor_ops      ➔ 万能原语几何手术 (清零/增删行/合并/激光对齐)   │
│  4. msds_batch_export_eight      ➔ 受控无头批量导出 (4 DOCX + 4 PDF)             │
│  5. msds_audit_deliverables      ➔ 149 项集中式主审计物理事实硬门禁              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、 核心技术实现方案 (Technical Specifications)

### 1. 生产 Agent 系统指令与沙箱配置升级
- **更新 `agent.md`**：
  在 `.agents/agents/msds-overwrite-producer/agent.md` 与 `msds-studio-producer/agent.md` 中注入不可违背的只读准入约束：
  ```markdown
  ## 🛑 权限边界与系统目录绝对只读公理 (SYS-01 & SYS-02)
  1. 未经人类用户明文批复允许，你绝对无权向以下系统核心目录写入或修改文件：
     - `web/src/`
     - `web/templates/`
     - `web/scripts/`
  2. 你的唯一合法执行通道是官方提供的 MCP 工具链（`msds-engine-mcp`）；
  3. 严禁编写任何一次性临时拼装脚本（如 `build_<model>.mjs`、`patch_<model>.mjs`）；
  4. 遇到系统底座通用规则不足时，必须立即执行安全停机并出具《底座缺陷申报单》，严禁私自打局部特判硬编码！
  ```

### 2. 构建标准 MCP CLI 网关驱动器 (`web/scripts/msds_mcp_gateway.mjs`)
- 为保证在任何会话环境或子进程中均能 100% 同构调用 MCP 工具链，构建标准网关驱动器：
  - 直接桥接 `web/src/mcp-server.js` 的 stdio JSON-RPC 协议；
  - 接受命令行或 JSON 参数，以纯净的 MCP 报文格式派发任务；
  - 无论是主 Agent、子 Agent 还是自动化流水线，均统一调用该网关，彻底取缔散落的临时脚本。

### 3. 系统 SOP 手册升级沉淀
- 在 `docs/MSDS_OVERWRITE_PRODUCER_SOP_MANUAL.md` 与 `MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.md` 中完成制度性立法，确立全套作业准则。

---

## 三、 法定双清单自证 (The Mandatory Dual-Scope Lists)

### 1. 拟变范围清单 (Proposed Changes - 最小因果集)

| 序号 | 变更资产路径 | 因果角色分类 | 变更要点与目的 |
| :---: | :--- | :--- | :--- |
| 1 | `C:\Users\Administrator\.gemini\antigravity\brain\7f4d4b46-78e6-435a-aa29-f0d6ec194caa\.agents\agents\msds-overwrite-producer\agent.md` | `[Root Source]` | 注入系统目录绝对只读约束与 MCP 唯一通道硬门禁，从角色指令层锁死越权写底座行为 |
| 2 | `web/scripts/msds_mcp_gateway.mjs` | `[Root Source]` | 构建纯净的 MCP 标准网关驱动器，提供全同构的 MCP 工具执行通道 |
| 3 | `docs/MSDS_OVERWRITE_PRODUCER_SOP_MANUAL.md` | `[State Transition]` | 更新操作手册，确立“底座只读”、“唯一走 MCP”与“停机申报闭环”三大法定义务 |
| 4 | `CHANGELOG.md` | `[Closure]` | 沉淀 `INV-SYSTEM-READONLY-AND-MCP-GATEWAY` 架构治理记录 |

### 2. 保持现状承诺清单 (Preserved Invariants - 绝对不触碰范围)

| 序号 | 承诺资产 / 既有逻辑 | 保护动机与绝对不变量 |
| :---: | :--- | :--- |
| 1 | `web/src/pipeline-engine.js` | 核心底座逻辑保持现状，无用户特别指示严禁修改，保留既有的无水环氧映射与标点自愈不变量 |
| 2 | `web/src/smart-matching.js` | 保持现状，保留既有的全角/半角空格清洗归一化 |
| 3 | `web/src/docx-engine.js` | 保持现状，严格保护 Section 2 阶梯几何排版（480/840 twips CN, 317/677 twips EN）及外实内虚边框公理 |
| 4 | `web/templates/` 全量官方母版 | 保持 100% 原始只读状态，严禁直接篡改底模文件 |
| 5 | `web/scripts/run_master_msds_audit.mjs` | 保持现状，保留 AUD-01 149 项全量物理事实硬断言，继续行使最高一票否决权 |
