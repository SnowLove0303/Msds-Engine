# Technical Design: PU-218A TDS 与 MSDS 双智能体协同标准化生产

## 1. 总体架构拓扑

```mermaid
flowchart TD
    User["用户需求指令 (PU-218A 覆写)"] --> Main["主智能体 (Orchestrator)"]
    Main --> Gate1["法定门禁 1 (RTM 确认通过)"]
    Gate1 --> Gate2["法定门禁 2 (双清单与方案授权)"]
    Gate2 --> Dispatcher["双任务 A2A 胶囊派发"]
    
    subgraph TDS_Pipeline ["TDS 覆写通道 (Subagent: 3c8a7a90)"]
        TDS_Src["PU-218A tds_CN 冠志.docx"] --> TDS_Extract["TDS 实体提取与语义整理"]
        TDS_Extract --> TDS_Trans["专业技术翻译与预设派生"]
        TDS_Trans --> TDS_Build["4 套 TDS 模板原位覆写"]
        TDS_Build --> TDS_PDF["Word2PDF 转换 (word2pdf)"]
        TDS_PDF --> TDS_Deliverables["TDS 8 格式 (4 DOCX + 4 PDF)"]
    end
    
    subgraph MSDS_Pipeline ["MSDS 覆写通道 (Subagent: f880401d)"]
        MSDS_Src["PU-218A msds_CN 冠志.docx"] --> MSDS_Clear["母版模板预清空防污染"]
        MSDS_Clear --> MSDS_Inject["数据装配与 Sec 2/9/11/13 特征注入"]
        MSDS_Inject --> MSDS_Matrix["中英文 × 冠志国彩实体派生"]
        MSDS_Matrix --> MSDS_PDF["convertBatchDocxToPdf"]
        MSDS_PDF --> MSDS_Deliverables["MSDS 8 格式 (4 DOCX + 4 PDF)"]
    end

    Dispatcher --> TDS_Pipeline
    Dispatcher --> MSDS_Pipeline
    
    TDS_Deliverables --> TargetDir["目标目录: 算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A"]
    MSDS_Deliverables --> TargetDir
    TargetDir --> FinalAudit["主 Agent 零信任双极双层机械审计 (audit_bipolar_bilayer.mjs)"]
    FinalAudit --> Checkoff["1:1 逐条物理核销交付"]
```

## 2. 核心技术契约与约束
1. **TDS 标准化契约**：严格遵循 `tds-four-variant-eight-deliverable-standardizer` 规范，输入中文源底稿，派生中英文与冠志国彩双主体，输出 4 DOCX + 4 PDF。
2. **MSDS 工业级规范契约**：严格遵循 `MSDS中英文覆写排版与数据装配全景统一工业级规范 (v5.0.0)`，保证 Section 2 象形图居左与空行分离、Section 9 垂线对齐、Section 11 垂直合并三列拓扑、Section 13 双居中加粗、页脚型号居左与 Revision Date 居右。
3. **输出物绝对纯度**：目标目录内仅存放这 16 份最终交付物，所有临时 dump、缓存或调试中间件不得进入交付目录。
