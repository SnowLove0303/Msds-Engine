# Spec Delta

## ADDED Requirements

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
