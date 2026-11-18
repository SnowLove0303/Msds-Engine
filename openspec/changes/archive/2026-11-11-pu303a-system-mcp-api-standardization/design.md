# Design: PU-303A MSDS 系统受控 API 生产架构设计

## 1. 架构拓扑与受控执行流

```mermaid
sequenceDiagram
    autonumber
    actor User as 用户 / Agent
    participant API as MSDS-Engine API Server (Port 5174)
    participant Pipe as Pipeline Engine (pipeline-engine.js)
    participant Docx as DOCX Engine (docx-engine.js)
    participant PDF as PDF Converter (pdf-converter.js)
    participant Disk as 目标产出目录 (PU-303A)

    User->>API: 1. 探活预检 GET /api/msds/health
    API-->>User: 200 OK (service ready, pdf capable)

    User->>API: 2. 发起原子生产 POST /api/msds/pipeline/generate-eight
    Note over API,Pipe: 载荷: model=PU-303A, cnGroundTruthPath, targetDir
    API->>Pipe: 调用 executeEightDeliverablesPipeline()
    
    Pipe->>Pipe: 3. 安全备份源文件 preserveOriginalFileBackup()
    Pipe->>Docx: 4. loadDocx() 解包源 DOCX，解析 16 章节事实
    Pipe->>Docx: 5. 构建中文基准母版 buildBaseChineseEngine()
    Note over Pipe,Docx: 组装 Section 2 通栏 (gridSpan="2", 9795 dxa)
    Pipe->>Docx: 6. 专业英译与构建英文母版 buildBaseEnglishEngine()
    Pipe->>Docx: 7. 多预设派生 derivePresetEngines() (冠志/国彩)
    Pipe->>Docx: 8. 排版规范注入 (G-11 字体、悬挂缩进、值格纯左对齐)
    Pipe->>Disk: 9. 批量写盘 4 份 DOCX
    Pipe->>PDF: 10. 驱动 LibreOffice 批量高保真转换 4 份 PDF
    PDF->>Disk: 写盘 4 份 PDF
    Pipe->>Pipe: 11. 触发 8 大质量门禁全检 (assertDeliverableQuality, assertZeroChinese)
    
    Pipe-->>API: 交付物清单与质检摘要
    API-->>User: 200 OK (8 deliverables delivered, allPassed: true)

    User->>Disk: 12. 运行 audit_bipolar_bilayer.mjs 独立复测
```

## 2. 核心技术细节与数据映射

### 2.1 Section 2 危化品事实与通栏装配
- **源文件事实提取**：
  - 类别：吸入急毒 4 类 (H332)、皮肤腐蚀/刺激 3 类 (H316)、眼睛刺激 2B (H320)、生殖毒性 1B (H360)、STOT SE 1 (H370)、STOT RE 2 (H373)；
  - 信号词：危险 (Danger)；
  - 组分关联危害：N,N-二甲基乙酰胺 (DMAC) 透皮吸收风险；
- **排版几何**：
  - Row 0：`2. 危险性概述`；
  - Row 1：单单元格，`w:gridSpan w:val="2"`, `w:tcW w:w="9795" w:type="dxa"`；
  - 内部段落：5 级缩进状态机，英文垂向首字严格对齐。

### 2.2 交付物与目录纯度
- 产出路径：`F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-303A`；
- 交付物清单（严格 8 份）：
  - `PU-303A msds_CN 冠志.docx` / `PU-303A msds_CN 冠志.pdf`
  - `PU-303A msds_CN 国彩.docx` / `PU-303A msds_CN 国彩.pdf`
  - `PU-303A msds_EN Guanzhi.docx` / `PU-303A msds_EN Guanzhi.pdf`
  - `PU-303A msds_EN Guocai.docx` / `PU-303A msds_EN Guocai.pdf`
- 严禁向目标目录或 Git 暂存区遗留任何临时脚本或 dump 数据。
