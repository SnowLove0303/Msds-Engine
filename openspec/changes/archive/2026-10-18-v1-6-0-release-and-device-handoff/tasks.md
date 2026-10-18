# Tasks

## 1. 版本与文档资产准备
- [ ] 1.1 将 `web/package.json` 中的版本号提升至 `1.6.0`
- [ ] 1.2 编写根目录 `RELEASE_NOTES_v1.6.0.md`，汇总 PDF 导出管道、预览视口纯白优化与 OpenSpec 归档成果
- [ ] 1.3 更新 `web/项目交接文档.md`，同步 v1.6.0 状态、容器配置与新设备快速启动步骤

## 2. 自动化测试与质量门禁验证
- [ ] 2.1 运行容器内静态契约测试与运行时计算样式测试：`docker exec msds-engine node tests/test_preview_background_contract.mjs` 及 `tests/scratch_docx_dom.mjs`，确保 100% 通过
- [ ] 2.2 验证 Docker 容器运行状态与 `http://127.0.0.1:5173/` 访问正常

## 3. 规约归档与代码提交
- [ ] 3.1 归档当前变更 `openspec archive v1-6-0-release-and-device-handoff -y` 并同步 specifications
- [ ] 3.2 审计待提交变更集合，执行 `git add` 并创建语义化提交 `chore(release): v1.6.0 - Portable PDF Export Pipeline & Preview Hardening`
- [ ] 3.3 创建语义版本标签 `v1.6.0`

## 4. 远程推送与跨设备交接验证
- [ ] 4.1 推送 `main` 分支至 GitHub 远程仓库 `origin`
- [ ] 4.2 推送标签 `v1.6.0` 至 GitHub 远程仓库 `origin`
- [ ] 4.3 验证远端分支与标签一致性（`git ls-remote --tags origin`）
- [ ] 4.4 输出另一台设备的无缝启动指南（Git clone、Docker build/up、端口映射与验证）
