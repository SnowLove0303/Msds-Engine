# Proposal: 系统核心目录绝对只读与 MCP 唯一执行通道架构 (Proposal)
(`proposal.md`)

## 1. 业务意图与原始需求逐字留存 (100% Verbatim Ingestion)

```text
====================================================================================================
【原始输入事实指纹 (Fact Fingerprint)】
会话上下文: "我们来研究一下，为了从根源上防止硬编码，：1.讨论是否只要执行覆写产出工作时，对MSDS-Studio 只读；2.设立MCP 为唯一执行通道"
用户决策指令: "执行，没有我允许的情况下，没有系统目录的写权"
时间戳: 2026-11-09T09:19:27+08:00
====================================================================================================
```

### 核心立法宗旨
1. **彻底铲除生产 Agent 私改底座与特判硬编码的物理通道**：
   确立“系统核心目录（`web/src/`、`web/templates/`、`web/scripts/`）默认严格只读”原则。未经用户明确授权允许，任何负责生产、覆写的 Agent 绝对无权向系统目录写入或修改文件。
2. **设立 MCP 为唯一合法的受控执行通道**：
   废除 Agent 随手编写 ad-hoc 脚本直接干预底层 DOCX/XML 的非正规行为，强制所有识别、编辑、导出、审计全流程统一通过官方标准 MCP 工具链（`msds-engine-mcp`）受控执行。
3. **架构两权分立与停机申报闭环**：
   确立“底座治理（Platform Governance）”与“覆写生产（Production Execution）”物理隔离；生产 Agent 遇到未知品类或底座未覆盖规则时，强制停机并出具结构化申报单，严禁越权打补丁。

---

## 2. 1:1 需求物理对账矩阵 (Requirements Traceability Matrix - RTM)

| 需求条目编号 | 原始需求语义切片 | 架构定位与承重墙 | 详细功能契约 (Functional Contract) | 独立物理验收指标 (RTM Verification) |
| :---: | :--- | :--- | :--- | :--- |
| **REQ-01** | **系统核心目录写权限严格封印**：没有我允许的情况下，没有系统目录的写权 | 权限沙箱与承重墙防御 (Layer 1 & Layer 3) | 生产/覆写任务期间，`web/src/`、`web/templates/`、`web/scripts/` 核心目录绝对只读；禁止任何非授权写入。遇底层缺陷强制触发停机申报熔断。 | 生产执行期间系统目录文件修改数为 0；违规写入直接触发权限熔断 `SYSTEM_DIRECTORY_WRITE_FORBIDDEN` [Measured] |
| **REQ-02** | **设立 MCP 为生产覆写唯一执行通道**：设立 MCP 为唯一执行通道 | 受控动作接口 (ACI / Gateway) | 废除所有临时 `build_*.mjs` / `patch_*.mjs` 散落脚本；全面固化以 `msds_recognize_source`、`msds_execute_editor_ops`、`msds_batch_export_eight`、`msds_audit_deliverables` 为核心的唯一流水线。 | 生产操作 100% 走 MCP 协议报文；产出目录无临时代码增生；8 格式交付物主审计 100% 通过且退出码 0 [Measured] |
| **REQ-03** | **生产 Agent 权限沙箱与 SOP 规则立法固化**：确立长效制度防止未来退化 | 规则宪法与 Agent 角色封印 (`agent.md` & SOP) | 更新 `msds-overwrite-producer` / `msds-studio-producer` 角色系统指令；在全局 SOP 手册与规范中显式载入“系统目录只读”与“MCP 唯一通道”法定公理。 | Agent 定义与操作手册完成版本化更新；Git 记录清晰可追溯 [Measured] |
