# Proposal: 通用性 MCP 工作流五大关键拼图重构与法定执行标准建立

## 1. 原始需求 100% 逐字留存 (Original Brief)
用户最高法定指示：
> “调整下MSDS-Engine 项目执行强制性：以后核心维护与开发项：1.编辑器本身能力；2.MCP与API 3.全局规范与局部规范，用于审计；4.Skill 核心维护服务于Agent 真正正确真实使用MSDS Engine 本身的能力 并实现稳定产出，过程采用Sop操作标准化，赋予Agent编辑器的各大编辑能力；非我允许禁止直接为了单一目的而改造工具； 你看一下，为了形成SOP 通用性MCP 工作流，还需要什么。回到刚才的5拼图，重写确认方案。执行。”

---

## 2. 1:1 需求物理对账矩阵 (RTM)

| 需求 ID | 用户原始指示条目 | 技术落地点 | 独立验收命令与指标 |
| :--- | :--- | :--- | :--- |
| **REQ-1** | 核心维护与开发项：1.编辑器能力；2.MCP与API；3.全局规范与局部规范；4.Skill | `PROJECT_CONSTITUTION.md`, `AGENTS.md` | 机检断言四大支柱明文入宪 |
| **REQ-2** | 核心维护服务于Agent真正正确真实使用能力并稳定产出，过程采用SOP操作标准化 | `docs/MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.md` | 查验包含完整形态决策树与 Recipe 库 |
| **REQ-3** | 非我允许禁止直接为了单一目的而改造工具 | `PROJECT_CONSTITUTION.md`, CI静态扫描 | 扫描全工程禁止包含型号写死特判分支 |
| **REQ-4** | 落实通用性 MCP 工作流五大拼图 | 1.形态决策树；2.手术配方库；3.事务自愈；4.Gap诊断；5.宪法立法 | `node web/tests/test_five_puzzles_workflow.mjs` (Exit Code 0) |

---

## 3. 拟变范围与保持现状承诺
- **拟变范围**：
  - 更新最高宪法 `PROJECT_CONSTITUTION.md` 与 `AGENTS.md`；
  - 升级 `web/src/mcp-server.js`，增强事务自动回滚与 `actionableGaps` 诊断输出；
  - 扩展 `docs/MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.md`，注入形态决策树与三大经典手术配方库；
  - 编写端到端高强度集成测试 `web/tests/test_five_puzzles_workflow.mjs`。
- **保持现状承诺**：
  - 保持已有 10 大 MCP 工具命名与 Stdio 纯净协议绝对不变；
  - 保持 `docx-engine.js` 9795 dxa 网格自愈与几何守恒核心稳定；
  - 严格杜绝针对任何具体化学品型号编写硬编码特判。
