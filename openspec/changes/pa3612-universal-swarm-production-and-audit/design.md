# Design: PA-3612 Swarm Universal Assembly & Dual-Scope Audit Architecture

## 1. 架构流转拓扑
```mermaid
flowchart TD
    S0["源文件: PA-3612 msds_CN 冠志.doc / .docx"] --> S1["阶段 1: 物理定位与 modelCode 提取"]
    S1 --> S2["阶段 2: msds_recognize_source -> Context1"]
    S2 --> S3["阶段 3: context-governor.js -> Context2<br>(丙烯酸体系英译 + GHS 非危防虚增)"]
    S3 --> S4["阶段 4 & 5: Swarm Worker 极速原语装配<br>(editor-writer.js + Presets -> DOCX & PDF)"]
    S4 --> S5["阶段 6: Coordinator 两阶深度审计<br>(159项机械审计 + 16节保真审计)"]
    S5 --> S6["阶段 7: 交付与 1:1 双向物理核销矩阵"]
```

## 2. 核心契约与不变量
- **去 Pipeline 化公理**: 不读、不调、不依赖 `pipeline-engine.js` 4200+ 行特定型号特判，纯由编辑器万能原语驱动；
- **情境解耦公理**: 冠志/国彩/第三方为 Preset 参数，中/英为 Template 参数，系统底层 100% 通用；
- **时效红线**: 单文件装配耗时 $\le 300$ ms，端到端总流程 $\le 60$ 秒。
