# Tasks: MSDS 工作流开篇三部曲执行承载固化执行计划

- [x] 1. 建立工作流开篇标准作业规程 (SOP) 知识库手册 (REQ-FLOW-01, REQ-FLOW-02)
  - [x] 1.1 在 `docs/knowledge-base/` 编写《MSDS Studio 工作流开篇三部曲标准作业规程与新 Agent 上手手册》
  - [x] 1.2 明确固化 Context 1（抽取与分类准确）与 Context 2（内容处理与排版）的绝对职责边界
  - [x] 1.3 详细定义步骤 1 寻源排他、步骤 2 导入识别器、步骤 3 机械反向审计的执行公理
  - *验证命令*: `Test-Path "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\docs\knowledge-base\MSDS_WORKFLOW_ENTRY_STANDARD_OPERATING_PROCEDURE.md"` (断言 True)

- [x] 2. 更新 msds-studio 核心技能标准与执行承载收敛 (REQ-FLOW-02, REQ-FLOW-03)
  - [x] 2.1 更新全局技能 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`，将阶段 1~3 收敛为权威开篇三部曲
  - [x] 2.2 同步更新本地技能 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\.agents\skills\msds-studio\SKILL.md`
  - [x] 2.3 注入官方受控命令行调用标准 (`run_source_recognition.mjs` 与 `audit_context1_mechanical.mjs`)
  - *验证命令*: `Select-String -Path "C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md" -Pattern "开篇三部曲"` (断言存在匹配)

- [x] 3. 注入 Producer Agent 角色指令与极速上手卡片 (REQ-FLOW-03, REQ-FLOW-04)
  - [x] 3.1 在 `msds-studio-producer/agent.md` 注入《新 Agent 极速上手指南卡片 (Quick Start Card)》
  - [x] 3.2 明确红线：Context 1 绝不中英翻译、绝不修改内容、绝不私写临时脚本
  - [x] 3.3 规范化步骤 3 机械审计退出码 0 作为通关进入 Context 2 的充分必要门禁
  - *验证命令*: `Select-String -Path "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\.agents\agents\msds-studio-producer\agent.md" -Pattern "极速上手指南"` (断言存在匹配)

- [x] 4. 派发 Swarm SubAgent 依照新 SOP 开展端到端工作流盲测 (REQ-FLOW-02, REQ-FLOW-03)
  - [x] 4.1 在 Swarm 看板新增盲测 Worker 智能体并指派测试型号（仅给 SOP 规范指引与型号）
  - [x] 4.2 观察并检验 Swarm Worker 是否 100% 依循步骤 1 (寻源) -> 步骤 2 (识别) -> 步骤 3 (机械审计)
  - [x] 4.3 验证盲测产出的 Context 1 资产与机械审计真实退出码 0
  - *验证命令*: `node web/scripts/audit_context1_mechanical.mjs --target="F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\output\<BLIND_MODEL>\<BLIND_MODEL>_context1_recognition.md" --strict` (退出码 0)

- [x] 5. 1:1 双向物理核销与 OpenSpec 规范合流归档 (REQ-FLOW-01 ~ REQ-FLOW-04)
  - [x] 5.1 校验技能、文档与盲测日志完整性
  - [x] 5.2 运行 `openspec validate msds-workflow-entry-substrate-and-onboarding` 确保零错误零警告
  - [ ] 5.3 呈报终审交付报告并等待人工验收
