# Design Document: HPU 系列 MSDS 源文件批量 Swarm 识别与机械审计架构方案

## 一、 架构总览与拓扑图

本系统采用 **主协调器 (Coordinator) + 并发执行流 (Worker Flow) + 独立法官 (Judicial Auditor)** 的三层闭环架构。主协调器负责全量源文件的模式发现与排他过滤，将 6 个独立的 MSDS 文件分发至并发处理流中，直接通过官方受控命令行执行通道生成 Context 1 Markdown，最终由独立反向机械审计器进行一票否决式闭环验证。

```mermaid
flowchart TD
    subgraph S0["输入源目录 (Source Directory)"]
        HPU_DIR["1-2 水性羟基聚氨酯树脂 HPU"]
        HPU_DIR --> F1["HPU-7651 (MSDS & TDS)"]
        HPU_DIR --> F2["HPU-7660 (MSDS & TDS)"]
        HPU_DIR --> F3["HPU-7700 (MSDS & TDS)"]
        HPU_DIR --> F4["HPU-7710 (MSDS & TDS)"]
        HPU_DIR --> F5["HPU-7711A (MSDS & TDS)"]
        HPU_DIR --> F6["HPU-7790 (MSDS & TDS)"]
    end

    subgraph S1["主协调器 (Coordinator & Filter)"]
        SCAN["扫描并锁定 6 个型号"]
        FILTER["排他规则：剥离 TDS，仅纳选 msds_CN 冠志.docx"]
        SCAN --> FILTER
    end

    subgraph S2["Swarm 并发执行流 (6 个独立 Worker)"]
        W1["Worker 1: HPU-7651"]
        W2["Worker 2: HPU-7660"]
        W3["Worker 3: HPU-7700"]
        W4["Worker 4: HPU-7710"]
        W5["Worker 5: HPU-7711A"]
        W6["Worker 6: HPU-7790"]
        
        FILTER --> W1
        FILTER --> W2
        FILTER --> W3
        FILTER --> W4
        FILTER --> W5
        FILTER --> W6
    end

    subgraph S3["执行通路 (Official Channel)"]
        CLI["web/scripts/run_source_recognition.mjs"]
        W1 --> CLI
        W2 --> CLI
        W3 --> CLI
        W4 --> CLI
        W5 --> CLI
        W6 --> CLI
    end

    subgraph S4["交付归口 (Deliverables Sink)"]
        OUT_DIR["识别模块/识别模块训练夹"]
        CLI --> OUT_DIR
    end

    subgraph S5["独立司法机械审计 (Judicial Audit Gate)"]
        AUDIT["audit_context1_mechanical.mjs (M-01~M-08)"]
        OUT_DIR --> AUDIT
        AUDIT --> PASS["Exit Code 0: 准入交付"]
        AUDIT --> FAIL["Exit Code != 0: 阻断回滚"]
    end
```

---

## 二、 核心技术策略与不变量防护

### 1. 裁判与执行物理隔离 (Judicial & Executive Isolation)
- 严禁在生成脚本内部“自测自通”。
- 抽取由 `run_source_recognition.mjs` 完成，写入目标目录。
- 审计由独立脚本 `audit_context1_mechanical.mjs` 从外部读取生成的 Markdown 进行逆向证伪检测。两个脚本之间无共享全局状态。

### 2. 管道符号转义与物理网格保护 (INV-PRUNE-02)
- MSDS 表格中含有的 `|`（例如 Section 3 成分表中的 `CAS: — | 浓度: —`）在提取并渲染为 Markdown 表格时，必须被强制替换为 `\|`，避免 Markdown 解析器将单行单元格错误分裂为 5~6 列（M-04 探针检测项）。

### 3. 父子标签解耦与说明行保护 (INV-PRUNE-01)
- 识别引擎中已建立的 8 大语义类型（`PARENT_LABEL`, `CHILD_LABEL`, `VALUE`, `EXPLANATION`, `TITLE`, `SUBSECTION_HEADER`, `HEADER`, `UNKNOWN`）严格按知识库手册映射，杜绝说明行篡改与标签混淆。

---

## 三、 数据流与时序设计 (Sequence Flow)

```mermaid
sequenceDiagram
    participant Coord as Coordinator (主协调器)
    participant Worker as Swarm Workers (并发执行流)
    participant Engine as run_source_recognition.mjs
    participant Sink as 识别模块训练夹
    participant Auditor as audit_context1_mechanical.mjs

    Coord->>Coord: 扫描 1-2 水性羟基聚氨酯树脂 HPU 目录
    Coord->>Coord: 过滤排除 TDS 文件，圈定 6 个 msds_CN.docx
    Coord->>Worker: 并发分发 6 个型号识别任务
    par HPU-7651 到 HPU-7790 并行解析
        Worker->>Engine: 调用识别引擎 CLI
        Engine->>Sink: 输出 [MODEL]_context1_recognition.md
    end
    Coord->>Auditor: 批量触发独立反向机械审计
    Auditor->>Sink: 读取生成的 6 个 Markdown 文件
    Auditor->>Auditor: 运行 P1~P4 及 M-01~M-08 探针全覆盖检测
    alt 全部通过 (Exit Code 0)
        Auditor-->>Coord: 返回 0 violations, 0 warnings
        Coord->>Coord: 汇总出具交付核销清单
    else 发现违规 (Exit Code != 0)
        Auditor-->>Coord: 返回违规报错信息
        Coord->>Coord: 阻断流水线并报警
    end
```
