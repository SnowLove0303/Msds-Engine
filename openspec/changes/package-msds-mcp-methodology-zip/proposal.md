# Proposal: MSDS MCP 覆写与审计全方法论资产归集与 Zip 交付
(`proposal.md`)

## 一、 变更背景与治理动因
在完成对 MSDS-Engine 核心目录只读约束、MCP 唯一执行通道、10 大原子工具网关驱动器落地以及 `msds-studio` v6.0-ENTERPRISE 技能权威发布之后，全系统的全流程方法论与技术资产已经彻底收敛成型。

为了便于系统用户将这套经过实战打磨、具备最高法定不变量约束的全套 MCP 覆写与审计方法论便捷地分发给其他环境、团队或赋予新的 Agent 正确调用的能力，用户下达明确指令：
> “将调用说明+skill等 用于给Agent正确调用MCP 执行覆写与审计的全方法论打包成Zip给我”

本提案将全套方法论资产进行模块化梳理、设计开箱即用的分层目录拓扑、撰写端到端集成指南，并封装生成标准的独立 Zip 压缩包交付物。

---

## 二、 1:1 需求物理对账矩阵 (Spec-Kit RTM Ingestion)

本提案严格 1:1 承接 Gate 1 获批的全部需求，数量与意图严格守恒：

| 需求编号 | 需求名称与核心契约 | 对应增量规格条款 |
| :--- | :--- | :--- |
| **REQ-01** | **Agent 调用 MCP 覆写与审计全方法论资产梳理与归集**<br>全量归集 Skill 契约、SOP 操作手册、网关驱动器、Agent 角色定义与排错指南。 | `specs/package-msds-mcp-methodology-zip.md` -> `MET-01` ~ `MET-04` |
| **REQ-02** | **开箱即用型交付包结构规划与集成引导说明编写**<br>规范组织交付目录树，提供端到端调用与开箱接入 README 指南。 | `specs/package-msds-mcp-methodology-zip.md` -> `PKG-01` ~ `PKG-03` |
| **REQ-03** | **标准 Zip 压缩包物理封装、解压校验与交付**<br>生成标准 Zip 归档文件，核销解压完整性与 SHA-256 事实指纹。 | `specs/package-msds-mcp-methodology-zip.md` -> `ZIP-01` ~ `ZIP-03` |

---

## 三、 预期交付物形态
1. **结构化方法论资产目录**：`dist/msds-mcp-methodology-package/`，包含 `skill/`、`docs/`、`gateway/`、`agents/`、`README.md`；
2. **便携式 Zip 物理压缩包**：`dist/MSDS_MCP_Overwrite_And_Audit_Methodology_v6.0.zip`；
3. **闭环核销凭据**：物理文件校验、解压完整性测试（退出码 0）及 SHA-256 事实指纹。
