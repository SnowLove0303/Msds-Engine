# Design: MSDS MCP 全方法论归集包拓扑与法定双清单
(`design.md`)

## 一、 交付包拓扑架构与目录规划

```text
MSDS_MCP_Overwrite_And_Audit_Methodology_v6.0/
├── README.md                                    # 👑 全方法论快速上手与 Agent 接入总纲
├── skills/
│   └── msds-studio/
│       └── SKILL.md                             # 🚀 官方 msds-studio v6.0-ENTERPRISE 技能核心
├── docs/
│   ├── MSDS_OVERWRITE_PRODUCER_SOP_MANUAL.md    # 📖 覆写生产 SOP 手册与停机申报规程
│   ├── UNIVERSAL_MCP_WORKFLOW_FIVE_PUZZLES.md   # 💡 五大核心难题复盘与万能原语方法论
│   └── MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.md    # 📑 新一代 MCP 驱动白皮书
├── gateway/
│   ├── msds_mcp_gateway.mjs                     # ⚡ 标准 JSON-RPC 2.0 MCP 网关驱动器
│   └── examples/
│       ├── args_recognize_example.json          # 样例：源文件识别参数
│       └── args_audit_example.json              # 样例：交付物主审计参数
└── agents/
    ├── msds-overwrite-producer/
    │   └── agent.md                             # 🤖 覆写生产 Agent 角色定义与只读约束
    ├── msds-studio-producer/
    │   └── agent.md                             # 🤖 Studio 原语生产 Agent 角色定义
    └── msds-deliverables-auditor/
        └── agent.md                             # 🔍 交付物敌手主审计 Agent 角色定义
```

---

## 二、 架构权衡与技术考量

1. **便携性与零依赖**：
   - 交付包以纯 Markdown、标准 JavaScript (Node.js ES Module) 和 JSON 文件组成，解压即用；
   - 依赖项完全透明，仅需标准的 Node.js 运行时即可驱动网关与核心底座通信。

2. **角色与权限硬隔离显性化**：
   - 将三大专用 Agent 角色直接纳入 `agents/` 目录，使接收方可直接将其作为系统提示词或子智能体配置挂载，天生具备系统只读与 MCP 唯一通道约束。

3. **开箱即用的参数范式**：
   - 在 `gateway/examples/` 中提供可以直接使用的 JSON 参数文件模版，让调用端 Agent 彻底摆脱转义困扰。

---

## 三、 法定双清单自证 (Dual Lists Proof)

### 1. 拟变范围清单 (Proposed Changes Scope)

| 拟变文件路径 | 变更类型 | 拟变角色 | 变更动机与拟写入内容 |
| :--- | :---: | :---: | :--- |
| `openspec/changes/package-msds-mcp-methodology-zip/` | 新增 | `[Root Source]` | 创建规范立法四大法定资产（已就绪） |
| `dist/msds-mcp-methodology-package/` | 新增/临时 | `[State Transition]` | 组装并生成全方法论资产目录与 `README.md` |
| `dist/MSDS_MCP_Overwrite_And_Audit_Methodology_v6.0.zip` | 新增 | `[Root Source]` | 最终物理 Zip 压缩包输出物 |

### 2. 保持现状承诺清单 (Leave-as-is Invariants Commitment)

| 核心资产 / 目录 | 保护原因与现行不变量 |
| :--- | :--- |
| `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web/src/` | **系统目录绝对只读公理 (`INV-SYSTEM-READONLY`)**：底座核心代码严格只读，绝对不触碰 |
| `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web/templates/` | **母版几何网格封印**：母版文件严格只读，绝对不触碰 |
| `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web/scripts/` | **核心脚本稳定**：仅读取 `msds_mcp_gateway.mjs` 进行打包，不修改其内部逻辑 |
| `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\.agents/` | **生产配置稳定**：仅作为只读源进行打包提取，不修改既有配置 |
