# Spec: 运行期只读防篡改与零临时脚本契约

## REQ-01: 源码只读与遇阻硬退出
- `run_standard_production.mjs` 启动时 SHALL 执行 `verifyReadonlyEngineGuard()`（在 Git 仓库下检测 `web/src/`、`web/scripts/`、`web/templates/`、`标准化流程/` 是否存在未提交修改；在非 Git 解压包下校验关键入口与文件完整性），发现源码被篡改立即报错退出（退出码 `1`）。
- 任何阶段（Phase 1~7）失败时，Runner MUST 直接以非零退出码终止并报告缺陷，严禁自动回退或绕过门禁。

## REQ-02: 零临时脚本产出禁令
- `verifyReadonlyEngineGuard()` SHALL 检测目标输出目录与仓库受控目录中是否存在 Agent 私自生成的临时脚本（`*.mjs`, `*.js`, `*.py`, `*.ps1`, `*.sh`）；若发现未受控临时脚本，立即阻断退出（退出码 `1`）。

## REQ-03: Agent 唯二职责边界固化
- `标准化流程/MSDS_Studio_Agent_Test_Kit/skill/SKILL.md`、`README_FOR_AGENT.md` 与全局 `msds-studio/SKILL.md` SHALL 在顶部显式规定 Agent 仅负责：① 调用工作流、完成内容填写、提交产出；② 介入审计（非机械语义/视觉级审计）。
