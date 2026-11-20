# Tasks: 七流程工作流只读源码防篡改与零临时脚本门禁

- [x] **Task 1: 在 `run_standard_production.mjs` 植入 `verifyReadonlyEngineGuard` 机械硬门禁（REQ-01, REQ-02）**
  - 检测源码篡改（排除 `translation-memory.json` 合法沉淀）与临时脚本产出，命中即退出码 `1` 阻断；
  - 验证命令：正常跑 `PA-4840` 退出码 `0`；在临时目录放一个假 `.mjs` 脚本验证直接退出码 `1` 拦截。

- [x] **Task 2: 更新七流程 `SKILL.md`、`README_FOR_AGENT.md` 与全局 `SKILL.md` 固化 Agent 唯二职责（REQ-03）**
  - 明确写入“严禁修改源码（失败必须报错退出）”、“严禁产出临时脚本”、“Agent 唯二职责（1. 调用工作流填内容交产出；2. 介入非机械审计）”。

- [x] **Task 3: 运行 `npm run lint`、重打 `MSDS_Studio_7Phase_Workflow_Kit.zip` 并推送至 `origin/main`**
