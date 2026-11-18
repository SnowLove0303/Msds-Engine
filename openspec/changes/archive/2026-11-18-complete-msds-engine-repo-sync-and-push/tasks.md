# 施工任务清单: MSDS-Engine 全量工程资产与工作流推送远程仓库
## Implementation Tasks (Single-Focus Lock & VS Code Review)

> **Change ID**: `2026-11-18-complete-msds-engine-repo-sync-and-push`  
> **Status**: Pending Approval (等待门禁 2 批准动工)  

---

- [x] **Task 1: 同步与更新工作流及 OpenSpec 规格资产 (SPEC-SYNC-01)**
  - **Single-Focus Lock**: `[x]` (已测通并通过 VS Code Review 应用：msds-studio v9.0-ENTERPRISE 同步，cas-audit 规格并入 openspec)
  - **受控动作**:
    1. 将最新 `msds-studio` v9.0-ENTERPRISE 规范更新至 `.agents/skills/msds-studio/SKILL.md`；
    2. 将 `cas-audit` OpenSpec 规格与归档记录同步至 `MSDS-Engine/openspec/`。
  - **验收命令**: `git diff .agents/skills/msds-studio/SKILL.md`

- [x] **Task 2: 配置 `.gitignore` 排除边界加固 (SPEC-SYNC-02)**
  - **Single-Focus Lock**: `[x]` (已测通并通过 VS Code Review 应用：temp_sessions/ 临时会话目录排除，验证产出物 100% 隔离)
  - **受控动作**:
    1. 在 `.gitignore` 中追加 `temp_sessions/` 等运行时临时缓存排除项；
    2. 验证所有具体型号 Word/PDF 交付物处于 `ignored` 状态，绝对零污染。
  - **验收命令**: `git check-ignore temp_sessions/session_test.docx` (Exit Code 0)

- [x] **Task 3: 全量工程资产（代码、脚本、测试、文档）结构化暂存 (SPEC-SYNC-01, SPEC-SYNC-03)**
  - **Single-Focus Lock**: `[x]` (已测通：全量核心引擎、测试套件、脚本、文档与工作流结构化暂存，经物理筛查 0 产出物泄露)
  - **受控动作**:
    1. 暂存核心引擎优化（`docx-engine.js`, `pipeline-engine.js`, `smart-matching.js` 等）；
    2. 暂存全量测试套件（`web/tests/`）、审计脚本（`web/scripts/`）、规范文档（`docs/`）、体系交接文档及问题研究报告；
    3. 运行 `git status` 审查暂存清单，确保无任何具体型号产出物。
  - **验收命令**: `git diff --cached --stat`

- [x] **Task 4: 规范化原子提交沉淀 (SPEC-SYNC-03)**
  - **Single-Focus Lock**: `[x]` (已测通：执行 git commit 成功生成原子提交 22acf14，覆盖 1104 个工程组件文件，退出码 0)
  - **受控动作**:
    1. 执行 `git commit`，编写结构化语义提交信息，覆盖核心引擎、测试套件、工作流与治理规范。
  - **验收命令**: `git log -1 --stat` (Exit Code 0)

- [x] **Task 5: 推送远程仓库并核销状态同步 (SPEC-SYNC-04)**
  - **Single-Focus Lock**: `[x]` (已测通：执行 git push origin main 成功，远程完全同步至 8df52a6，git status 报告 'Your branch is up to date with origin/main'，working tree clean，退出码 0)
  - **受控动作**:
    1. 执行 `git push origin main`；
    2. 校验远程推送输出与退出码 0；
    3. 运行 `git status` 确认本地分支与 `origin/main` 达到 100% 同步（Up to date）。
  - **验收命令**: `git push origin main` && `git status` (Exit Code 0)
