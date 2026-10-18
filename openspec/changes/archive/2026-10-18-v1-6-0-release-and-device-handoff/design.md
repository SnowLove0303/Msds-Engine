# Design

## Context

工程自 `af2649f`（2026-10-17 源码对齐）之后，经历了两轮重磅优化：
1. **容器内高保真 PDF 导出管道**：补齐 Linux 字体同步脚本 `scripts/sync-build-fonts.ps1`、容器内 fontconfig 配置、`pdf-converter.js` Linux 无头 LibreOffice 支持、预检能力状态探测 `/api/msds/health`，以及前端 UI 导出弹窗的实时能力感知；
2. **预览视口灰框彻底根除与自适应缩放修复**：穿透覆盖三方库动态注入的 `background: gray` 30px 深灰粗框，修复 `applyDocxFitToWidth` 选择器，并通过运行时计算样式测试与负向验证确保不留死角；
3. **OpenSpec 规约体系大归档**：34 项历史变更已全量规范归档至 `openspec/changes/archive/`。

为了支持用户明天在另一台设备上无缝继续开发，必须完成版本封板、文档交接与远端推送。

## Goals / Non-Goals

**Goals:**
- 递增版本至 `v1.6.0`，编写完整的 Release Notes 与更新项目交接文档；
- 自动化测试与 Docker 状态验证 100% 绿灯；
- 规范化提交工作区资产，创建语义标签 `v1.6.0`，推送到 GitHub 远程仓库；
- 提供另一台设备的极简拉取与无痛启动指引。

**Non-Goals:**
- 本次不改动现有功能逻辑或页面交互（逻辑已在上一轮闭环验收）；
- 不做与发布无关的代码重构。

## Decisions

### D1: 版本标识与发版说明
将 `web/package.json` 的 `version` 从 `1.5.0` 升级为 `1.6.0`。
生成根目录 `RELEASE_NOTES_v1.6.0.md`，并在 `web/项目交接文档.md` 中将版本更新为 `1.6.0`，详细登记当前的架构、容器端口、字体映射及常见问题处理。

### D2: 提交文件完整性审计
审查待提交列表：
- 核心代码：`web/src/main.js`、`web/src/styles.css`、`web/src/pdf-converter.js`、`web/src/msds-api-controller.js`、`web/data/msds_repo.db`
- 基础设施：`docker/`、`scripts/sync-build-fonts.ps1`
- 规约档案：`openspec/changes/archive/*`、`openspec/specs/*`
- 自动化测试：`web/tests/*`
- 文档：`RELEASE_NOTES_v1.6.0.md`、`web/项目交接文档.md`

### D3: 自动化测试门禁
在提交前必须执行两项核心测试：
1. `docker exec msds-engine node tests/test_preview_background_contract.mjs`
2. `docker exec msds-engine node tests/scratch_docx_dom.mjs`
确保所有契约测试 100% 通过。

### D4: 跨设备交接指令集
在交接文档与终末总结中，明确列出另一台设备的 standard runbook：
```bash
git clone https://github.com/SnowLove0303/Msds-Engine.git
cd Msds-Engine
docker compose build
docker compose up -d
# 访问 http://localhost:5173/
```

## Risks / Trade-offs

- [远端推送网络超时] → 使用标准 git push，若遇网络波动重试或指定超时策略。
