# Proposal: 建立 GitHub 专属仓库 SnowLove0303/Msds-Engine 并发布 V1.0 (MSDS-Engine)

## Why

当前项目 `F:\Skill\MSDS` 尚未建立本地 Git 版本控制体系，且未托管至远程代码仓库。为了实现 MSDS Studio / MSDS 引擎的云端版本化追溯、协作共享及稳定基线固化，用户明确要求：
1. 绑定并推送到 GitHub 专属仓库：`SnowLove0303/Msds-Engine`（https://github.com/SnowLove0303/Msds-Engine）；
2. 建立规范的项目版本基线，发布版本标识为 `V1.0`，命名为 `MSDS-Engine`；
3. 保障仓库纯净度，排除庞大的构建依赖 (`node_modules`)、临时编译产物 (`dist`)、运行日志 (`*.log`) 与大型备份归档 (`rollback/*.zip`)，避免无用二进制膨胀。

## What Changes

- **建立工程级 `.gitignore`**：
  - 过滤 `web/node_modules/`、`web/dist/`、`*.log`、`__pycache__/`、`.DS_Store`；
  - 忽略大型回滚备份包 `rollback/*.zip`；
  - 保留测试必需的样例数据（如 `scratch/standard-compare/` 中的测试用例基准 DOCX）。
- **优化项目根目录 `README.md`**：
  - 呈现项目命名 `MSDS-Engine`、版本 `V1.0`、双核架构（Web 工作台 + Agent REST API）、核心功能特性与快速启动指南。
- **本地 Git 仓库初始化与基线提交**：
  - 执行 `git init -b main`；
  - 暂存并执行 V1.0 首期完整基线提交，提交信息规范为 `feat(release): MSDS-Engine V1.0 initial release`。
- **绑定 GitHub 远端并同步**：
  - 关联远程仓库 `https://github.com/SnowLove0303/Msds-Engine.git`；
  - 协调远端已存在的初始 `README.md`（如有），保持历史干净同步；
  - 打上 `V1.0` 语义化版本 Tag；
  - 安全推送到 GitHub 远端 `main` 分支及所有标签。
- **推送结果与远端可访问性验证**：
  - 使用 `gh repo view` 验证远端分支、提交哈希与 Tag 状态。

## Capabilities

### New Capabilities
- `github-v1-release`: 支持将 MSDS-Engine 完整工程体系纳入 Git 与 GitHub 远程仓库托管，并打标发布 V1.0。

### Modified Capabilities
- 无已有能力契约变更。

## Impact

- **版本控制**：为整个 `F:\Skill\MSDS` 建立正式的 Git 根仓库与 `.git` 目录；
- **配置与文档**：新增根目录 `.gitignore`，补充根目录 `README.md`；
- **远程协作**：GitHub `SnowLove0303/Msds-Engine` 获得完整的 V1.0 源码与文档发布资产。
