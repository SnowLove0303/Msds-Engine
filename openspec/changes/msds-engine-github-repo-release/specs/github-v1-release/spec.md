# Spec Delta: github-v1-release

## Purpose

建立 MSDS-Engine 在 GitHub 专属仓库 `SnowLove0303/Msds-Engine` 上的托管基线，完成首发提交与 V1.0 语义版本发布。

## ADDED Requirements

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
