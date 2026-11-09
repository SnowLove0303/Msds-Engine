# Design: 识别与编辑模块 MCP 通道全景图谱与 Skill 优化工作流设计

## 一、 系统架构全景图谱 (System Architecture Graph)

```mermaid
flowchart TD
    subgraph AGENT["🤖 AI Agent (智脑决策层)"]
        DEC["语义理解 / 策略规划 / 契约监督"]
    end

    subgraph PROTOCOL["⚡ MCP 标准协议总线 (stdio JSON-RPC 2.0)"]
        direction TB
        BUS["纯净 stdio 数据管道 (拦截日志重定向至 stderr)"]
    end

    subgraph CHANNELS["🛠️ MSDS-Engine 原生 MCP 通道矩阵"]
        subgraph REC_CH["【1. 识别感知通道矩阵】"]
            RC1["msds_recognize_source (16章节全量事实抽取)"]
            RC2["msds_extract_section_facts (单节细粒度下钻提取)"]
            RC3["msds_compare_source_with_output (源文件vs产出物对账)"]
        end

        subgraph EDT_CH["【2. 编辑手脚通道矩阵】"]
            EC1["msds_register_template (外部新模板动态注册)"]
            EC2["msds_get_template_schema (网格列宽拓扑反射)"]
            EC3["msds_peek_cell_or_row (触觉感知切片透视)"]
            EC4["msds_execute_editor_ops (万能原子几何/排版操作)"]
        end

        subgraph AUD_CH["【3. 规划与审计通道矩阵】"]
            AC1["msds_plan_audit_targets (ADD 逆向终审契约推演)"]
            AC2["msds_batch_export_eight (批量受控流水线渲染导出)"]
            AC3["msds_audit_deliverables (双极双层全景机械深度终审)"]
        end
    end

    subgraph ENGINE["⚙️ 底座核心引擎 (Core Engines)"]
        RE["recognition-engine.js (DOMParser 无损抽取)"]
        TE["template-editor.js (会话管理/事务回滚)"]
        DE["docx-engine.js (OOXML 几何/列手术/网格自愈)"]
        AP["audit-planner.js (ADD 目标规划与断言核销)"]
    end

    AGENT <-->|JSON-RPC 2.0| BUS
    BUS <--> CHANNELS
    REC_CH --> RE
    EDT_CH --> TE & DE
    AUD_CH --> AP & TE
```

---

## 二、 交互调用全流程时序图 (Agent End-to-End Workflow Sequence)

```mermaid
sequenceDiagram
    autonumber
    actor User as 用户 / 上游系统
    participant Agent as AI Agent (智脑)
    participant MCP as MCP 协议总线 (mcp-server)
    participant Rec as 识别模块 (recognition-engine)
    participant Tpl as 模板编辑器 (template-editor)
    participant Add as ADD规划器 (audit-planner)
    participant Aud as 双极双层审计器

    User->>Agent: 下达生产或重排任务 (源文件路径 + 目标规范)
    
    rect rgb(240, 248, 255)
    Note over Agent,Rec: 阶段 1: 事实感知与结构抽取
    Agent->>MCP: call msds_recognize_source(sourceFilePath)
    MCP->>Rec: 解析源 DOCX 16 章节事实与结构
    Rec-->>MCP: 返回纯净 JSON 事实 (GHS, 组分, 理化, 结构类型, 样式)
    MCP-->>Agent: 交付源文档技术事实
    end

    rect rgb(255, 250, 240)
    Note over Agent,Add: 阶段 2: ADD 前置审计目标锁定
    Agent->>MCP: call msds_plan_audit_targets(modelCode, sourceFacts)
    MCP->>Add: 根据事实与 G-01~G-40 及 L-S1~L-S16 规则推演
    Add-->>MCP: 返回不可篡改的 AuditTargetContract JSON
    MCP-->>Agent: 交付前置终审目标清单
    end

    rect rgb(245, 255, 245)
    Note over Agent,Tpl: 阶段 3: 模板感知与网格多态重构
    Agent->>MCP: call msds_get_template_schema(templateKey)
    MCP->>Tpl: 解析母版 tblGrid 列数与宽度
    Tpl-->>Agent: 返回模板网格拓扑 (发现 Section 3 为三列结构)
    
    Agent->>Agent: 规划几何动作: 事实只需两列，需剔除中间第2列标签
    Agent->>MCP: call msds_execute_editor_ops([deleteColumn, mergeCells, insertRow, writeRichText, ...])
    MCP->>Tpl: 执行全表删列、网格重算 (9795 dxa 平衡)、富文本注入
    Tpl-->>MCP: 返回执行结果与导出文件路径
    MCP-->>Agent: 交付编辑完成状态
    end

    rect rgb(255, 240, 245)
    Note over Agent,Aud: 阶段 4: 批量导出与双向物理核销
    Agent->>MCP: call msds_batch_export_eight(modelCode, sourcePath, targetDir)
    MCP-->>Agent: 批量产出 4 份 DOCX + 4 份高保真 PDF
    
    Agent->>MCP: call msds_audit_deliverables(targetDir, modelCode)
    MCP->>Aud: 运行双极双层全景深度审计 (G-01~G-40, L-S1~L-S16)
    Aud-->>MCP: Failures: 0, 100% PASS
    MCP-->>Agent: 审计绿灯凭据
    end

    Agent->>User: 呈报 100% 满分通过交付物与对账清单
```

---

## 三、 表格网格多态几何演化状态机 (Grid Geometry State Machine)

```mermaid
stateDiagram-v2
    [*] --> 原始母版表格: 模板加载与 Schema 反射
    
    原始母版表格 --> 三列结构: 检测到 3 列网格 (Section 3/8/11)
    原始母版表格 --> 标准两列: 检测到 2 列网格 (Label + Value)
    原始母版表格 --> 通栏结构: 检测到单格跨列 (gridSpan)

    三列结构 --> 标准两列: deleteColumn (精准剔除中间标签列，重算列宽平衡至 9795 dxa)
    三列结构 --> 通栏结构: mergeCells (整行横向熔合，设置 gridSpan=3)
    标准两列 --> 通栏结构: mergeCells (整行横向熔合，设置 gridSpan=2)
    标准两列 --> 三列结构: insertColumn (动态扩充新列，重算网格)

    标准两列 --> 样式继承增行: insertRow (深拷贝源行边框底色，清空段落)
    通栏结构 --> 样式继承增行: insertRow

    样式继承增行 --> 富文本写入: writeRichText (化学式角标解析 + 混排加粗)
    标准两列 --> 常规体写入: writeCell (剥离粗体锁定常规体 + 居左)

    常规体写入 --> 物理网格自愈: healAllTableTopologies (修正宽度与跨页断裂)
    富文本写入 --> 物理网格自愈

    物理网格自愈 --> [*]: 导出合法 DOCX 与 PDF
```
