# Tasks: MSDS MCP 全方法论归集与 Zip 交付任务清单
(`tasks.md`)

## 施工任务清单与单焦点执行锁 (Single-Focus Lock Tasks)

- [x] **Task 1: 构建交付包拓扑目录并组装方法论核心资产** `[State Transition]`
  - **施工目标**:
    - 在 `dist/msds-mcp-methodology-package/` 创建规范子目录（`skills/`, `docs/`, `gateway/`, `agents/`）；
    - 复制并归集 `SKILL.md` (v6.0-ENTERPRISE)、SOP 手册、白皮书、五大难题复盘、网关驱动器与三大 Agent 角色定义；
    - 在 `gateway/examples/` 创建参数调用示例 JSON。
  - **验证命令**: PowerShell 校验目录结构与各模块文件存在性。

- [x] **Task 2: 编写开箱即用型《MSDS MCP 工作流集成与 Agent 调用总纲》(README.md)** `[Root Source]`
  - **施工目标**:
    - 在交付包根目录编写高质量的 `README.md`；
    - 涵盖架构定位、Agent 角色挂载指引、10 大 MCP 工具速查、网关命令行与 `--argsFile` 调用范例、常见排错对策。
  - **验证命令**: Markdown 语法与结构完整性校验。

- [x] **Task 3: 执行标准 Zip 物理打包与解压自测核销** `[Verification]`
  - **施工目标**:
    - 将 `dist/msds-mcp-methodology-package/` 完整打包输出为 `dist/MSDS_MCP_Overwrite_And_Audit_Methodology_v6.0.zip`；
    - 在临时沙箱目录执行物理自解压校验，确认文件无损、目录层级无错位，退出码 0；
    - 计算并记录 Zip 文件的 SHA-256 事实指纹。
  - **验证命令**: `Expand-Archive` 自测解压与 `Get-FileHash` 计算指纹。

- [x] **Task 4: VS Code 原生检阅、CHANGELOG 知识沉淀与最终交付呈报** `[Closure]`
  - **施工目标**:
    - 调用 `open_in_vscode` 检阅交付包 `README.md` 与生成文件；
    - 更新 `CHANGELOG.md` 记录本次打包交付事件；
    - 呈报包含物理绝对路径、文件大小及 SHA-256 哈希的终审交付报告。
  - **验证命令**: `Test-Path` 验证 Zip 文件，`git status`。
