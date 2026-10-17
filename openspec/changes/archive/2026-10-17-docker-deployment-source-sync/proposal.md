# Proposal: Docker 部署源码与 v1.5.0-Complete 发行包对齐

## Why

本机 Docker 交付（容器 `msds-engine`）的构建源码目录是 `F:\docker\projects\Msds-Engine`，而非 `F:\Skill\MSDS`。该目录的 git 停在 `9784166 chore(release): v1.5.0`（2026-10-11 21:31，正是镜像构建时刻），而 2026-10-17 收到的 `MSDS-Engine-v1.5.0-Complete-20261017.zip` 在同一版本号下包含更靠后的源码修订，导致用户通过 Docker 访问的始终是旧构建。

已实测的差异（宿主机与容器内文件逐字节比对）：

- `web/src/main.js`: 196,933 → 223,629 B
- `web/src/msds-api-controller.js`: 24,443 → 45,176 B
- `web/src/styles.css`: 85,768 → 98,199 B（暗色 `#07111f` → 亮色 `#f4f6f9`）
- `web/src/smart-matching.js`: 201,129 → 211,323 B
- `web/src/docx-engine.js`: 96,516 → 104,935 B
- 新增 `web/src/pdf-converter.js`（被 `msds-api-controller.js` 引用）
- 全部构建输入（`Dockerfile`、`docker-compose.yml`、`.dockerignore`、根与 `web/` 的 `package.json`、`vite.config.js`、`index.html`、`server.mjs`）归一化后完全一致

## What Changes

- 将 v1.5.0-Complete 发行包内容全量对齐到 `F:\docker\projects\Msds-Engine`。
- 保留本地资产：`.git`（含 v1.3.0/v1.4.0/v1.5.0 历史）、`output/`、`web/data/`（容器活挂载的 SQLite 仓储与 44 份记录）、`scratch/` 以及未跟踪的 `web/check_2341_output.mjs`、`web/compare_truth.mjs`、`web/deep_compare_live.mjs`。
- 重建镜像并重启容器，使 5173 服务运行新源码。
- 建立回滚路径：旧镜像打 `rollback-oct11` tag，旧 `web/src`、旧 `web/package-lock.json`、未跟踪脚本与更新前清单存档到 `_rollback/pre-v1.5.0-20261017/`。
- 处置对齐过程中因 `robocopy /XD` 未生效导致的保留项被覆盖事故，并留下完整事故与恢复记录。

## Capabilities

### New Capabilities

- `deployment-source-parity`: 约束 Docker 交付的构建源码与发行包保持一致，并保证重建结果可被客观验证、变更可回滚、保留项不被破坏。

### Modified Capabilities

（无现有规约修改，属于交付链路一致性约束的新增）

## Impact

- 目标路径：`F:\docker\projects\Msds-Engine`
- 运行时：容器 `msds-engine`（端口 5173），镜像重建，服务中断约 1 分钟
- 数据安全：`web/data/msds_repo.db` 曾被误覆盖，已从回滚镜像完整恢复（哈希与变更前一致）
- 依赖变化：无。`web/package.json` 依赖集与包内一致，新增文件仅使用 Node 内置模块
- 已知限制（不在本变更范围）：`pdf-converter.js` 仅实现 Windows 路径（`C:\Program Files\LibreOffice\...` 探测 + `powershell.exe` COM），容器为 `node:22-alpine`，无 `soffice`、无 PowerShell，故 PDF 导出在 Docker 内不可用；补齐 Linux 转换路径属独立变更
