# Design: HPU-7700 八格式标准生产与法医级审计技术方案

## 1. 架构流转拓扑 (Architectural Topology)

```mermaid
flowchart TD
    Src["HPU-7700 源文件材料<br/>(HPU-7700 msds_CN 冠志.docx)"] --> Pipe["executeEightDeliverablesPipeline 流水线"]
    
    subgraph Engine ["MSDS Studio 工业级流水线内核"]
        Pipe --> BaseCN["buildBaseChineseEngine<br/>(中文基准构建 + Section 2极简通栏收敛)"]
        BaseCN --> BaseEN["buildBaseEnglishEngine<br/>(1:1 双语镜像英译 + 零中文强门禁)"]
        BaseEN --> Preset["derivePresetEngines<br/>(冠志/国彩双主体双语派生)"]
        Preset --> Typo["applyGlobalTypographyProjection<br/>(Design Tokens 字阶 + 420/560 dxa 标尺)"]
    end
    
    Typo --> BatchExport["batchExportDeliverables<br/>(4 DOCX + 4 原生 PDF)"]
    BatchExport --> TargetDir["目标目录: 01-2 水性羟基聚氨酯树脂 HPU/HPU-7700/"]
    
    subgraph AuditGate ["三大全景法医级审计门禁"]
        TargetDir --> AuditMaster["run_master_msds_audit.mjs<br/>(168 项集中式中央主审计)"]
        TargetDir --> AuditBipolar["audit_bipolar_bilayer.mjs<br/>(165 项双极双层机械审计)"]
        TargetDir --> TestTypo["test_editor_indent_and_alignment_invariants.mjs<br/>(排版几何不变量测试套件)"]
    end
```

## 2. 状态机与因果拓扑
1. **输入事实状态**:
   - `modelCode = 'HPU-7700'`
   - `isHazardous = false`（触发非危通栏 2 行模式）
   - `appearance = '透明至半透明液体'`（英译 `Transparent to translucent liquid`）
   - `solidContent = '37±2%'`
2. **生产控制状态**:
   - 编写专用生产调用脚本 `web/scripts/produce_hpu7700_deliverables.mjs`；
   - 依赖已修复的 `universal-editor-primitives.js`（零 tabs）、`template-editor.js`（9.1~9.N单调递增）、`smart-matching.js`（非破坏性PU前缀）、`pipeline-engine.js`（引燃温度完整英译）；
   - 一键生成 8 个标准文件。

## 3. 防线与门禁设计
- **L1 承重墙防线**: 模板只读豁免，页眉页脚原生继承，Section 2 极简通栏；
- **L2 静态分析门禁**: 三大脚本审计，退出码 0 为充要条件；
- **L3 契约立法**: RFC 2119 行为契约，1:1 RTM 守恒；
- **L4 外部见证者**: PyMuPDF 物理实测 PDF 字号 9.5pt 与 Section 9 标签对齐 80.28pt。
