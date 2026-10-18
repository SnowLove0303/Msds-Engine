# github-v1-release Specification

## Purpose
建立 MSDS-Engine 在 GitHub 专属仓库 `SnowLove0303/Msds-Engine` 上的托管基线，完成首发提交与 V1.0 语义版本发布。

## Requirements

### Requirement: Repository Cleanliness and Ignore Discipline
The system SHALL configure root `.gitignore` to prevent committing build artifacts, logs, node_modules, Python cache, and large backup archives.
系统必须配置工程根目录 `.gitignore`，阻止将构建产物、日志、`node_modules`、Python 缓存及大体积备份包纳入 Git 版本控制。

#### Scenario: Build artifacts and large files excluded
- **WHEN** 执行 `git status` 或 `git add .`
- **THEN** `web/node_modules/`、`web/dist/`、`web/*.log`、`__pycache__/` 及 `rollback/*.zip` 不得出现在暂存区或待提交列表中。

### Requirement: Canonical Project Documentation
The project SHALL provide a root `README.md` defining the project identity as `MSDS-Engine` at version `V1.0`.
工程根目录必须提供标准 `README.md`，明确项目命名为 `MSDS-Engine`，发布版本为 `V1.0`。

#### Scenario: Identity and usage verified
- **WHEN** 访问 GitHub 仓库主页或阅读根目录 README
- **THEN** 必须清晰展示 MSDS-Engine 名称、V1.0 版本、架构概览、快速启动及 API 说明。

### Requirement: Remote Sync and Release Tagging
The project SHALL link remote `https://github.com/SnowLove0303/Msds-Engine.git`, push `main` branch, and tag `V1.0`.
工程必须绑定远程仓库并推送 `main` 分支及创建标注式发布标签 `V1.0`。

#### Scenario: Tag and commit pushed successfully
- **WHEN** 执行推送并在远端检查
- **THEN** `git ls-remote --tags origin` 或 GitHub API 必须包含 `V1.0` 标签且与本地首发 commit 严格一致。

### Requirement: V1.6.0 发布语义与跨设备交接基线

系统 SHALL 建立完整的 v1.6.0 版本交付基准，完成代码资产固化、标签创建并推送到 GitHub 远程仓库，同时提供支持在新设备上无痛恢复运行的交接指南：

1. `web/package.json` 中的版本号 MUST 递增为 `1.6.0`；
2. 项目根目录 MUST 包含 `RELEASE_NOTES_v1.6.0.md`，汇总 PDF 导出管道、预览灰框根除与 OpenSpec 全量归档；
3. `web/项目交接文档.md` MUST 更新为当前 1.6.0 架构与跨设备操作流程；
4. Git 仓库 MUST 创建标注式语义发布标签 `v1.6.0`，且 `main` 分支与标签 MUST 成功推送至 GitHub 远程仓库 `https://github.com/SnowLove0303/Msds-Engine.git`。

#### Scenario: 版本递增至 1.6.0 与说明文档齐备
- **WHEN** 检查项目清单与发版说明
- **THEN** `web/package.json` 的版本为 `1.6.0`，根目录存在 `RELEASE_NOTES_v1.6.0.md` 且内容完整

#### Scenario: 远程仓库推送与发布标签同步
- **WHEN** 执行推送并在远端检查
- **THEN** `git ls-remote --tags origin` 包含 `v1.6.0` 标签，远端 `main` 分支包含本次发布的提交

#### Scenario: 跨设备快速运行指南齐备
- **WHEN** 在另一台新设备上接入项目
- **THEN** 查阅交接文档即可通过标准 Docker 指令构建并启动服务，HTTP 200 就绪
