# Tasks: 系统核心目录绝对只读与 MCP 唯一执行通道架构
(`tasks.md`)

## 施工任务清单与单焦点执行锁 (Single-Focus Lock Tasks)

- [x] **Task 1: 生产 Subagent 权限沙箱与系统目录只读封印重构** `[Root Source]`
  - **施工目标**:
    - 在 `msds-overwrite-producer/agent.md` 中全面注入“未经允许严禁修改系统目录”硬性准入约束；
    - 明确列出受控只读白名单（`web/src/`、`web/templates/`、`web/scripts/`）与受控可写白名单；
    - 明确设立遇底座缺陷强制停机申报闭环。
  - **验证命令**: 读取 `agent.md` 核验约束完整性。

- [x] **Task 2: 标准 MCP 网关驱动器 (`msds_mcp_gateway.mjs`) 构建与连通性自检** `[Root Source]`
  - **施工目标**:
    - 在 `web/scripts/` 目录下构建轻量、纯净的标准 MCP 网关驱动器 `msds_mcp_gateway.mjs`；
    - 直接对接 `web/src/mcp-server.js`，支持通过标准 JSON 参数以纯净 MCP 协议调用 10 大原子工具；
    - 实现与 Antigravity / Agent 的无缝同构调用，彻底终结手写 ad-hoc 脚本。
  - **验证命令**: `node web/scripts/msds_mcp_gateway.mjs --tool=msds_get_template_schema --args='{"templateKey":"正式模板_MSDS_CN_冠志"}'`，验证退出码 0。

- [x] **Task 3: 覆写生产 SOP 手册升级与停机申报规程立法** `[State Transition]`
  - **施工目标**:
    - 在 `docs/MSDS_OVERWRITE_PRODUCER_SOP_MANUAL.md` 中增设【系统目录只读封印】与【MCP 唯一通道】章节；
    - 制定标准的《系统底座通用缺陷申报单》模板与升级审批流程；
    - 废止散落的一次性历史临时脚本。
  - **验证命令**: 检视 SOP 文档，确认各项条款 100% 对齐。

- [x] **Task 4: 端到端 MCP 单通道受控生产验证与主审计核销** `[Verification]`
  - **施工目标**:
    - 使用标准 MCP 网关驱动器对基准型号（如 EP-1404）执行识别、透视与主审计验证；
    - 验证整个过程零系统目录文件改动、零临时拼装脚本生成；
    - 集中式主审计套件 149 项全绿通过，真实退出码 0。
  - **验证命令**: `node web/scripts/msds_mcp_gateway.mjs --tool=msds_audit_deliverables --args='{"model":"EP-1404","targetDir":"F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1404"}'`。

- [x] **Task 5: CHANGELOG 知识沉淀、VS Code 检阅与 Git 物理存档** `[Closure]`
  - **施工目标**:
    - 更新 `CHANGELOG.md` 沉淀 `INV-SYSTEM-READONLY-AND-MCP-GATEWAY` 治理演进记录；
    - 调用 VS Code MCP 通道检阅变更文件；
    - 执行 git commit 物理原子归档。
  - **验证命令**: `git status`，`git log -n 1`。
