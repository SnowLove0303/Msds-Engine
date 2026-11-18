# Design: PA-3612 Swarm 双智能体协同与全景法医审计方案

## 一、 系统架构与五层信任金字塔

```text
┌────────────────────────────────────────────────────────┐
│ Layer 5: 双清单门禁与人机审阅 (VS Code Diff + 1:1 RTM)   │
├────────────────────────────────────────────────────────┤
│ Layer 4: 自验证与环境见证者 (PDF 80.28pt / 168主审计退出码0) │
├────────────────────────────────────────────────────────┤
│ Layer 3: 契约立法 (Swarm 裁执隔离 / pipeline-engine.js)  │
├────────────────────────────────────────────────────────┤
│ Layer 2: 静态编译器硬阻断 (--max-warnings=0 / G-09 纯度) │
├────────────────────────────────────────────────────────┤
│ Layer 1: 架构与类型承重墙 (INV-ZERO-EXOGENOUS / 几何拓扑锁) │
└────────────────────────────────────────────────────────┘
```

## 二、 Swarm 双智能体协同时序

```mermaid
sequenceDiagram
    autonumber
    actor Coordinator as Coordinator (主调度)
    participant Producer as msds-producer (生产智能体)
    participant Engine as pipeline-engine.js (标准流水线)
    participant Auditor as msds-auditor (审计智能体)
    participant AuditSuites as 三大审计套件 (Master / Bilayer / Invariants)

    Coordinator->>Producer: @msds-producer 指派任务: 提取 PA-3612 源事实并生产 8 格式成果
    activate Producer
    Producer->>Engine: executeEightDeliverablesPipeline(PA-3612, facts)
    activate Engine
    Engine-->>Producer: 生成 4 DOCX + 4 PDF
    deactivate Engine
    Producer->>Coordinator: 汇报成果就绪: @msds-auditor 提请法医级审计
    deactivate Producer

    Coordinator->>Auditor: @msds-auditor 指派任务: 执行全量对抗审计
    activate Auditor
    Auditor->>AuditSuites: 运行排版几何测试 / 双极双层审计 / 集中式主审计
    activate AuditSuites
    AuditSuites-->>Auditor: 168/168 PASS, 165/165 PASS, Invariants PASS (Exit Code 0)
    deactivate AuditSuites
    Auditor->>Coordinator: 出具审计通过报告，完成法医级核销
    deactivate Auditor
```

## 三、 依赖与权衡 (Trade-offs & Alternatives)
- **.doc 原始格式处理权衡**：PA-3612 源文件为 Office 97-2003 `.doc` 二进制格式。采用本地 `soffice --headless --convert-to docx` 零损耗导出高保真 `.docx` 中间体供读取，保留原始 `.doc` 事实指纹完全不变。
- **架构硬锁原则**：杜绝手写孤立脚本，统一路由至 `pipeline-engine.js` 原生八格式流水线，确保 16 个章节完整装配。
