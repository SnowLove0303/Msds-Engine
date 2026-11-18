# Tasks: MSDS MCP 工作流体系技能交付任务清单
(`tasks.md`)

## 施工任务清单与单焦点执行锁 (Single-Focus Lock Tasks)

- [x] **Task 1: 编制全景权威《MSDS Studio MCP 工作流技能手册》(v6.0-ENTERPRISE)** `[Root Source]`
  - **施工目标**:
    - 完整收录 10 大标准原子 MCP 工具语义契约、输入输出参数范式；
    - 系统梳理 5 阶作业流水线 SOP 与万能几何手术配方库（Recipe A~H）；
    - 注入系统核心目录只读、MCP 唯一通道与底座通用缺陷停机申报三大法定不变量；
    - 包含标准《系统底座通用缺陷申报单》Markdown 模板与 CLI/网关调用代码范式。
  - **验证命令**: 读取文件内容，执行 Markdown 语法与结构完整性自检。

- [x] **Task 2: 全局技能配置路径同步与落盘 (`C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`)** `[State Transition]`
  - **施工目标**:
    - 将整理完毕的全新技能文档覆盖写入全局技能配置路径；
    - 验证 YAML Frontmatter 格式合规性与关键词覆盖度。
  - **验证命令**: PowerShell 校验 Frontmatter 结构与文件大小。

- [x] **Task 3: 项目本地技能配置路径同步与对齐 (`F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\.agents\skills\msds-studio\SKILL.md`)** `[State Transition]`
  - **施工目标**:
    - 将全新技能文档同步覆盖写入 MSDS-Engine 项目本地 `.agents/skills/msds-studio/SKILL.md`；
    - 验证全局与本地两份文件的 SHA-256 物理哈希 100% 对齐。
  - **验证命令**: `Get-FileHash` 比对两份技能文件哈希值。

- [x] **Task 4: VS Code 原生检阅、CHANGELOG 知识沉淀与 Git 物理原子存档** `[Closure]`
  - **施工目标**:
    - 调用 `open_in_vscode` 唤起 VS Code 检阅变更的技能资产；
    - 在 `CHANGELOG.md` 中记录本次技能升级（`v6.0-ENTERPRISE`）；
    - 执行 `git add` 与 `git commit` 原子归档。
  - **验证命令**: `git status`，`git log -n 1`。
