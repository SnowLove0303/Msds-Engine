# Design Document: MSDS 工作流开篇三部曲执行承载架构设计

## 一、 顶层架构与执行承载全景

为了让任何新 Agent（无论是主协调器、Subagent 还是协同开发者）快速上手，必须消除散漫的自然语言指令，将工作流开篇固化为一个由**“规约手册 (SOP) + 技能标准 (Skill) + 智能体角色 (Agent Role) + 官方受控命令行 (CLI)”** 四位一体构成的刚性执行承载基座：

```mermaid
flowchart TD
    subgraph ExecutionSubstrate["工作流开篇执行承载体系 (Execution Substrate)"]
        SOP["1. 知识库标准作业手册<br>MSDS_WORKFLOW_ENTRY_STANDARD_OPERATING_PROCEDURE.md"]
        SKILL["2. 系统受控技能<br>skills/msds-studio/SKILL.md (阶段 1~3 收敛)"]
        ROLE["3. Agent 角色指令<br>msds-studio-producer/agent.md (极速上手卡片)"]
        CLI["4. 官方唯一受控通路<br>run_source_recognition.mjs & audit_context1_mechanical.mjs"]
    end

    subgraph StepSequence["开篇三部曲强时序闭环 (Steps 1~3 Triad)"]
        STEP1["步骤 1: 接受任务并找到源文件<br>(锁定物理 DOCX，排除 TDS，提取型号)"]
        STEP2["步骤 2: 导入识别器识别<br>(官方受控 CLI 提取多维语义事实)"]
        STEP3["步骤 3: 获取 Context 1 并审计<br>(4 列 Markdown 落地，独立反向机械审计)"]
        GATE1{"审计结果<br>Exit Code == 0?"}
        
        STEP1 --> STEP2 --> STEP3 --> GATE1
        GATE1 -->|通过 (0 违规 0 警告)| C2["准入 Context 2: 开展源文件内容治理与排版"]
        GATE1 -->|不通过| HALT["触发安全停机，上报违规探针，禁止盲目推进"]
    end

    ExecutionSubstrate --> StepSequence
```

---

## 二、 核心公理与职责划分矩阵

| 阶段划分 | 核心定位 | 允许执行的操作 | 严禁触碰的红线 | 审计检验重点 |
| :--- | :--- | :--- | :--- | :--- |
| **Context 1 (步骤 1~3)** | **客观物理事实抽取层** | 1. 扫描源文件表格与段落文本；<br>2. 识别父子标签、数据值、说明行；<br>3. 转义 Markdown 管道符号；<br>4. 产出标准 4 列 Markdown 与 JSON。 | 1. **严禁中英翻译**；<br>2. **严禁内容润色或修改**；<br>3. **严禁填补缺失数据**；<br>4. **严禁私写 ad-hoc 脚本**。 | 1. 源文件内容 100% 忠实还原（零遗漏、零虚增）；<br>2. 标签与说明行分类精准度（P1/P2/P3 探针）；<br>3. 表格网格结构完整性（M-01~M-08 探针）。 |
| **Context 2 (后续阶段)** | **源内容合规治理与生成层** | 1. 结合大模型进行逐句高保真双语翻译；<br>2. 理化指标单位与表述标准化；<br>3. 适配官方企业底模与 Design Tokens；<br>4. 组装万能编辑器原语受控写入。 | 1. **严禁背离 Context 1 凭空捏造事实**；<br>2. **严禁破坏承重墙模板几何约束**。 | 1. 双语语义高保真对照；<br>2. 159 项企业模板机械主审计。 |

---

## 三、 新 Agent 极速上手卡片 (Quick Start Card 规范)

在新 Agent 读取的规约中，固化以下极简、无歧义的执行范式：

```markdown
### 🚀 MSDS 处理新 Agent 极速上手指南（三步开篇法）

1. **步骤 1：定位源文件**
   - 寻找目标型号的中文 MSDS 源文件（如 `算法训练材料/源文件材料/.../<MODEL>/<MODEL> msds_CN 冠志.docx`）。
   - 过滤排除任何以 `tds` 命名的文件。

2. **步骤 2：调用受控识别器**
   - 执行官方标准命令：
     ```bash
     node web/scripts/run_source_recognition.mjs --source="<SOURCE_DOCX_PATH>" --output="<OUTPUT_DIR>" --format=md
     ```
   - 检查控制台输出，确认提取耗时约 300ms，生成 `<MODEL>_context1_recognition.md`。

3. **步骤 3：独立机械反向审计**
   - 执行官方独立审计命令：
     ```bash
     node web/scripts/audit_context1_mechanical.mjs --target="<OUTPUT_DIR>/<MODEL>_context1_recognition.md" --strict
     ```
   - 核心判定：真实进程退出码必须为 `0`，`CRITICAL: 0`，`WARNING: 0`。
   - 满分通过后，Context 1 固化完成，方可向用户汇报并申请进入 Context 2！
```
