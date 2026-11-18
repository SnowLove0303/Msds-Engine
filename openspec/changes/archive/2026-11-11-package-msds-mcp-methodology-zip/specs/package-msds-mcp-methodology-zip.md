# Specification: MSDS MCP 覆写与审计全方法论打包规格
(`specs/package-msds-mcp-methodology-zip.md`)

## 1. 词汇与规范性引用 (Normative Terminology)
本文档中的关键字 "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "MAY" 均依据 RFC 2119 进行解释。

---

## 2. 规范条款

### 2.1 全方法论资产梳理与归集 (REQ-01)

- **MET-01 (技能契约资产归集)**:  
  归集包 SHALL 包含最新的 `msds-studio` v6.0-ENTERPRISE 完整技能定义（`SKILL.md`），确保其包含 10 大 MCP 工具契约、三大最高法定不变量、8 大万能几何配方及停机申报规范。

- **MET-02 (操作手册与调用说明归集)**:  
  归集包 SHALL 包含：
  1. `MSDS_OVERWRITE_PRODUCER_SOP_MANUAL.md`：面向生产 Agent 的权威 SOP 操作手册与停机申报规程；
  2. `UNIVERSAL_MCP_WORKFLOW_FIVE_PUZZLES.md`：五大核心难题复盘与万能编辑器原语方法论；
  3. `MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.proposed.md`：新一代 MCP 驱动白皮书。

- **MET-03 (唯一执行网关归集)**:  
  归集包 SHALL 包含标准的轻量 MCP 网关驱动器代码 `msds_mcp_gateway.mjs`，并配备命令行调用与 `--argsFile` 参数文件调用的标准模板。

- **MET-04 (智能体角色定义与提示词归集)**:  
  归集包 SHALL 包含：
  1. `msds-overwrite-producer/agent.md`：具备系统目录绝对只读约束与 MCP 唯一通道的生产 Agent 角色定义；
  2. `msds-studio-producer/agent.md`：Studio 原语生产 Agent 角色定义；
  3. `msds-deliverables-auditor/agent.md`：负责 150 项全量主审计与事实对账的敌手审计 Agent 角色定义。

---

### 2.2 交付包目录结构与接入指南 (REQ-02)

- **PKG-01 (目录分层结构)**:  
  归集包内部结构 SHALL 划分为逻辑自解释的子目录：
  - `skills/msds-studio/`：技能核心资产；
  - `docs/`：SOP 操作手册、白皮书与难题复盘；
  - `gateway/`：网关驱动器与调用示例模板；
  - `agents/`：三大专用智能体角色配置与提示词约束；
  - `README.md`：根目录集成引导说明。

- **PKG-02 (集成说明文档编制)**:  
  根目录 `README.md` SHALL 包含：
  1. 架构总览与目录导航；
  2. 智能体快速接入与提示词挂载指南；
  3. 官方 10 大原子 MCP 工具速查表；
  4. 网关调用典型命令范例（含探查、编辑、导出与审计）；
  5. 遇到未知品类时的安全停机申报流程。

- **PKG-03 (纯净性与防污染)**:  
  归集包中 SHALL NOT 包含任何临时测试文件、调试日志（`*.log`）、node_modules、Git 版本管理目录（`.git`）或针对特定型号的硬编码脏脚本。

---

### 2.3 标准 Zip 物理打包与交付核销 (REQ-03)

- **ZIP-01 (标准 Zip 压缩包输出)**:  
  构建流程 SHALL 将归集资产通过标准 Zip 格式打包输出至目标路径 `dist/MSDS_MCP_Overwrite_And_Audit_Methodology_v6.0.zip`。

- **ZIP-02 (解压完整性核销)**:  
  构建后 SHALL 在独立测试沙箱中执行物理自解压校验，真实退出码必须为 0，解压出的文件结构必须与源目录完全一致。

- **ZIP-03 (事实指纹留存)**:  
  终审报告中 SHALL 明文出具该 Zip 文件的物理绝对路径、文件大小（字节数）与 SHA-256 校验指纹。
