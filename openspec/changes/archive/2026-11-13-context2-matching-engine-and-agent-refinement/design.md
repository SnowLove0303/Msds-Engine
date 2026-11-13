# Design Document: Context 2 匹配引擎结构拓扑映射与 Agent 规范打磨架构方案

## 一、 架构总览与两阶流水线拓扑

Context 2 生产流程彻底告别旧有 pipeline 的黑盒模式，重构为 **“匹配引擎拓扑初筛（确定基本结构） + Agent 规范二次打磨（精细语义治理）”** 的两阶确定性流水线：

```mermaid
flowchart TD
    subgraph InputStage["输入事实基石 (Input Truth)"]
        C1["Context 1 经机械审计通过的客观事实<br>(facts / Markdown / JSON)"]
    end

    subgraph Stage1["第一阶: 匹配引擎拓扑学结构映射 (Matching Engine)"]
        TPL["企业正式母版拓扑定义<br>(16 章节网格、列数、固定行、槽位)"]
        ME["匹配引擎 (smart-matching.js)<br>• 内容源自源文件，结构源自模板<br>• 槽位映射 (Slot Mapping)<br>• 多元化拓扑适配 (Polymorphic Handling)"]
        
        C1 --> ME
        TPL --> ME
        ME --> BLUEPRINT["Context 2 初始骨架 (Basic Structural Blueprint)<br>16 章节基本槽位与结构已锚定"]
    end

    subgraph Stage2["第二阶: Agent 全局与局部规范二次认知打磨 (Agent Refinement)"]
        RULES["规范法规库<br>• 全局不变量 (非危防虚增/无水隔离/度数西文化)<br>• 16 章节局部细化规范 (阶梯排版/组分对齐/毒理分段)"]
        AGENT["Agent 认知大脑 (LLM Semantic Engine)<br>• 逐句高保真双语英译 (OECD/GHS 标准)<br>• 标点与粘连清洗<br>• 富文本与化学式下标标记"]
        
        BLUEPRINT --> AGENT
        RULES --> AGENT
        AGENT --> C2_FINAL["最终高精度 Context 2 (Final Precision Context 2)<br>• 100% 准确事实数据<br>• 完整双语映射<br>• 编辑器写入意图清单"]
    end

    subgraph OutputStage["下游消费层 (Downstream Consumers)"]
        EDITOR["通用编辑器万能原语受控写入<br>(universal-editor-primitives.js)<br>clearSectionValues -> insertRow -> writeCell -> writeRichText"]
        C2_FINAL --> EDITOR
    end
```

---

## 二、 核心机制与不变量防护

### 1. 结构与内容的绝对分立公理 (INV-CONTENT-SOURCE-STRUCTURE-TEMPLATE)
- **内容 100% 源自原文**：匹配引擎向槽位填入的原始文本，必须严格源自 Context 1，严禁引入母版历史脏数据或保底示例数据；
- **结构 100% 源自母版拓扑**：表格列宽、行结构、表头布局必须依循正式模板的物理定义，杜绝格式随意破坏。

### 2. 匹配引擎吸收 Pipeline 职能 (Pipeline-to-Matcher Convergence)
- 废除原 `pipeline-engine.js` 中复杂的四阶段调用，将“中英文槽位初始化”、“非危品象形图分支判定”、“Section 9 冒号格式化”、“Section 11 毒理学分段”核心逻辑收敛至 `smart-matching.js` 的纯函数映射链中；
- 暴露统一纯净的执行入口：
  `matchContext1ToTemplateTopology(facts, templateVariant)` $\rightarrow$ 返回规整的结构初筛蓝图。

### 3. Agent 二次认知打磨治理项清单
- **G-01 非危品防虚增**：检测到 `isHazardous === false` 时，强制从 Section 2 中剔除象形图行与信号词行，杜绝外生“无”字；
- **G-02 专业逐句双语英译**：品名、组分、外观、气味及毒理测试终点（如 `LD50 经口 (大鼠)` $\rightarrow$ `Oral LD50 (Rat)`），由 Agent 大脑逐句精翻，不使用僵化正则替换；
- **G-03 标点与单位标准化**：清理行末悬挂冒号，中文度数符号替换为西文 `°C`；
- **L-01~L-16 章节专属打磨**：
  - Section 3：CAS 号与浓度范围格式化；
  - Section 8：手部防护说明行与子标签分类对齐；
  - Section 9：参数名与值之间冒号激光垂直对齐准备；
  - Section 11：急性毒性/皮肤腐蚀等多研究说明行空行隔离。

---

## 三、 数据流与时序设计 (Sequence Flow)

```mermaid
sequenceDiagram
    participant User as 用户 / 调度器
    participant C1 as Context 1 事实
    participant Matcher as 匹配引擎 (smart-matching.js)
    participant Agent as Agent 认知大脑
    participant Auditor as Context 2 准确性检验器
    participant Editor as 万能编辑器原语

    User->>C1: 读取审计通过的 Context 1
    C1->>Matcher: 传入 facts 对象
    Matcher->>Matcher: 结合母版几何拓扑，进行 16 章节槽位初筛匹配
    Matcher-->>Agent: 输出 Context 2 基本结构骨架 (Blueprint)
    
    Agent->>Agent: 加载全局规范与 16 章节局部规范
    Agent->>Agent: 执行逐句双语英译、非危防虚增、标点与单位清洗
    Agent->>Agent: 组装富文本标记与编辑器原语意图
    Agent-->>Auditor: 呈报完整的 Context 2 数据资产
    
    Auditor->>Auditor: 校验内容保真度、双语一致性与编辑器操作完备性
    alt 准确性通过 (Exit Code 0)
        Auditor-->>Editor: 准入交接，驱动万能原语受控写入
    else 发现准确性偏差
        Auditor-->>Agent: 报警并触发自纠错重试
    end
```
