# Proposal: MSDS MCP 工作流体系规范收敛与工业级技能交付
(`proposal.md`)

## 一、 变更背景与治理动因
在完成对系统核心目录绝对只读封印（`INV-SYSTEM-READONLY-AND-MCP-GATEWAY`）以及 10 大原子 MCP 工具网关（`msds_mcp_gateway.mjs`）的构建后，MSDS-Engine 的架构分工已全面理清：
1. 底座核心代码（`web/src/`、`web/templates/`、`web/scripts/`）对生产 Agent 实施物理与契约级绝对只读封印；
2. 官方 MCP 工具链（10 大原子工具）成为唯一的合法执行通道；
3. 生产 Agent 遇到未知化工分类或底座通用缺陷时，执行强制停机申报闭环；
4. 既往在 `docs/UNIVERSAL_MCP_WORKFLOW_FIVE_PUZZLES.md`、`docs/MSDS_OVERWRITE_PRODUCER_SOP_MANUAL.md`、`docs/MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.proposed.md` 以及多个 OpenSpec 规格中沉淀的 SOP 经验仍呈散落分布状态。

为了让后续任何 AI Agent、开发者与治理者能够以最标准、最低摩擦的方式调用该体系，用户下达最高明确指令：
> “现在给我整理一下MCP 工作流体系，以技能的方式交付给我”

本提案将全套 MCP 工作流体系进行工业级规范收敛，封装为官方标准的 `msds-studio` 技能（Skill）资产并同步至全系统生态。

---

## 二、 1:1 需求物理对账矩阵 (Spec-Kit RTM Ingestion)

本提案严格 1:1 承接 Gate 1 获批的全部需求，数量与意图严格守恒：

| 需求编号 | 需求名称与核心契约 | 对应增量规格条款 |
| :--- | :--- | :--- |
| **REQ-01** | **MCP 工作流全景体系系统化梳理与规范收敛**<br>系统化梳理 10 大标准原子 MCP 工具契约、5 阶段作业流水线、两大门禁及三大法定不变量。 | `specs/msds-mcp-workflow-system-skill.md` -> `MCP-01` ~ `MCP-04` |
| **REQ-02** | **工业级标准技能资产封装与交付规范**<br>按照 Antigravity 官方技能规范编写完整 `SKILL.md`，包含标准 Frontmatter、正向行动化表述、异常自愈与停机模板。 | `specs/msds-mcp-workflow-system-skill.md` -> `SKL-01` ~ `SKL-03` |
| **REQ-03** | **技能资产多环境同步与可感知性保障**<br>实现全局技能配置（`.gemini/config/skills/msds-studio/`）与项目本地技能配置（`.agents/skills/msds-studio/`）的双向一致同步。 | `specs/msds-mcp-workflow-system-skill.md` -> `ENV-01` ~ `ENV-02` |

---

## 三、 预期交付物形态
1. **统一权威技能资产**：`msds-studio/SKILL.md`（v6.0-ENTERPRISE），集成 10 大 MCP 工具、5 阶段 SOP、双门禁、万能几何配方库及系统只读不变量；
2. **多环境部署对齐**：全局技能路径与代码库本地路径 100% 物理哈希对齐；
3. **闭环验证凭据**：技能语法格式与结构校验退出码 0，网关与工具链语义对齐无偏差。
