# Design: GLaDOS 自动签到本地部署架构与实施设计

## Context

参考 proposal.md。经 GitHub API 全局检索，当前 Star 最多的 GLaDOS 签到开源仓库为：
- `RaineaAN/GlaDOS_Checkin_ql`（⭐ 295，主推本地 Python 与青龙，支持多账号与多种推送）
- `Devilstore/Glados-Railgun-checkin`（⭐ 292，主要面向 Space/Railgun 模式）

用户明确要求部署至本地路径 `F:\脚本应用\GLados`，且以 GitHub Star 最多为准，因此选定 `RaineaAN/GlaDOS_Checkin_ql`。

## Goals / Non-Goals

**Goals:**
- 将 `RaineaAN/GlaDOS_Checkin_ql` 完整仓库拉取/部署至 `F:\脚本应用\GLados`。
- 安装 Python 依赖（`requirements.txt`）。
- 建立安全配置模板，支持从环境变量或本地文件配置 Cookie，防止敏感凭据外泄。
- 提供 Windows 本地一键执行脚本（`run.bat`），方便手动测试与接入 Windows 任务计划程序。

**Non-Goals:**
- 不涉及远程 GitHub Actions 云端托管（用户指定本地部署）。
- 不硬编码用户的真实 Cookie，采用占位符与安全指导引导用户填入。

## Decisions

1. **项目选型**：采纳 `RaineaAN/GlaDOS_Checkin_ql`（295+ ⭐）。该项目不仅支持本地运行，而且具备完善的多渠道消息推送与异常重试逻辑。
2. **凭据安全**：提供独立的本地凭据配置文件或环境变量设置脚本，避免凭据被意外提交或暴露在控制台日志中。
3. **便捷执行**：编写 `run.bat`，自动检测 Python 解释器并执行签到逻辑，打印签到结果与剩余天数。
4. **自动化扩展**：输出注册 Windows 任务计划程序（Task Scheduler）的 PowerShell 单行指令，实现每天定时后台静默签到。

## Risks / Trade-offs

- **[Risk] Cookie 过期或失效** → **Mitigation**: 脚本已内置响应状态码检测，并在提示中输出重新提取 Cookie 的清晰指引。
- **[Risk] 网络连接不稳定** → **Mitigation**: 脚本包含重试与超时控制机制。
