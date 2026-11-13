# Proposal: MSDS 工作流开篇三部曲执行承载固化与新 Agent 极速上手规范

## 一、 业务动机与核心思想 (Why)
在 MSDS Studio 工业级受控工作流的持续演进中，必须明确确立核心公理：**Context 1 的核心职责与审计目标是确保源文件识别提取准确与标签/值/说明行的分类归纳准确，真正对源文件内容进行治理、改写、翻译和适配的操作在 Context 2**。

因此，工作流的开篇阶段具备高度的纯粹性与确定性，可以且必须正式固化为标准三部曲：
1. **接受任务并找到源文件 (Source Discovery)**；
2. **通过导入识别器识别 (Recognizer Ingestion & Extraction)**；
3. **获取 Context 1 并进行独立反向审计 (Context 1 Acquisition & Audit)**。

为了让后续任何全新入驻的 Agent（包括主协调器、各类执行 Subagent 以及其他协作开发智能体）都能**在 3 分钟内快速上手该工作流，并 100% 严格按照规定的受控路线执行**，本次变更将开篇三部曲的执行承载全面物理固化，确立标准的执行规范、标准命令行范式、零歧义操作指南与准入阻断门禁，杜绝任何偏航、私写临时脚本或自作主张的退化行为。

---

## 二、 1:1 需求物理对账矩阵 (Spec-Kit RTM)

| 需求编号 | 需求名称 | 原始诉求映射 | 优先级 | 核心验收与审计依赖 |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-FLOW-01** | Context 1 与 Context 2 职责与审计边界公理确立 | `context1 的审计核心确保源文件和识别结果准确与分类准确 就行，真正要对源文件内容处理的是在Context2` | P0 (阻断级) | 职责切分纯粹性：Context 1 专职“识别提取与分类归纳准确”，严禁越界修改内容；Context 2 专职“内容治理与业务加工” |
| **REQ-FLOW-02** | 工作流开篇标准三部曲（步骤 1~3）业务契约固化 | `固定下来工作流的开头：1.接受任务并找到源文件；2.通过导入识别器识别；3.获取Context1 并进行审计` | P0 (阻断级) | 1:1 映射并法定固化：步骤 1 物理锁定源文件、步骤 2 受控识别、步骤 3 Context 1 机械审计 100% 全绿 |
| **REQ-FLOW-03** | 工作流执行承载固化与新 Agent 极速上手规范 | `先固定下来工作流的执行承载（核心目的是方便后续任何新Agent都能快速上手该工作流并严格按照 我们所规定的路线去执行）` | P0 (阻断级) | 建立明确易懂、物理闭环的执行承载基座，提供标准调用范式与门禁手册，使任何新 Agent 零认知歧义、100% 按规执行 |
| **REQ-FLOW-04** | Context 2 演化衔接接口与不可篡改基石保障 | `然后我们再接着做下一步` | P0 (阻断级) | 确保开篇三步输出的 Context 1 数据契约清晰稳定，为下一步无缝进入 Context 2 内容处理提供黄金底座 |

---

## 三、 拟变范围与影响评估 (What Changes)
- **纳入范围**：
  - 编写《MSDS Studio 工作流开篇三部曲标准作业规程 (SOP) 与新 Agent 上手手册》至知识库 `docs/knowledge-base/`；
  - 同步更新系统核心生产技能 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md` 与本地技能 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\.agents\skills\msds-studio\SKILL.md`，将阶段 1~3 正式对齐为新的权威开篇三部曲；
  - 完善 Producer Agent 角色指令 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\.agents\agents\msds-studio-producer\agent.md`，注入极速上手卡片与标准 CLI 执行通路。
- **排除范围**：
  - 不篡改底层识别核心算法 `web/src/recognition-engine.js`；
  - 不弱化已建立的独立机械审计规则 `web/scripts/audit_context1_mechanical.mjs`。
