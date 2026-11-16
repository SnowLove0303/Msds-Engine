# 技术架构方案与因果拓扑设计 (Design: 02-2 13-Model Batch Production)

## 一、 系统架构与执行数据流 (Architecture & Batch Pipeline)

```mermaid
flowchart TD
    Scan["扫描源大类目录<br>2-2 水性羟基丙烯酸乳液 PA RA"] --> Filter["排他过滤 TDS<br>(严格提取 13 个型号 MSDS)"]
    Filter --> BatchLoop["13 个型号串行/有序调度循环"]
    
    subgraph ModelPipeline["单型号受控通用流水线 (run_universal_msds_pipeline.mjs)"]
        FormatCheck{"是否为 .doc 格式?"}
        FormatCheck -->|是| ConvertDocx["LibreOffice 无损转存 .docx"]
        FormatCheck -->|否| DirectDocx["直接使用 .docx"]
        ConvertDocx --> Step1["Step 1: 零损耗事实识别 (Context 1)"]
        DirectDocx --> Step1
        Step1 --> Step2["Step 2: 规范化治理与中英对齐 (Context 2)"]
        Step2 --> Step3["Step 3: 原生母版拓扑覆写 (4 DOCX + 4 PDF)"]
        Step3 --> Step4["Step 4: 级联三大法医审计 (几何 + 双极双层 + 173项主审计)"]
    end
    
    BatchLoop --> ModelPipeline
    Step4 -->|Exit Code 0| Save["持久化释放至对应子目录<br>02-2 水性羟基丙烯酸乳液 PA/<ModelCode>/"]
```

---

## 二、 核心技术权衡与鲁棒性保障机制

1. **显式 `--targetDir` 注入保证路径绝对隔离**：
   - 避免路径推断因包含 `/PA/` 而误判至 `02-1`，全量调用统一显式指定：
     `--targetDir="F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-2 水性羟基丙烯酸乳液 PA\<ModelCode>"`；
   - 确保产物精确落入对应的 13 个子文件夹。

2. **Word 97-2003 `.doc` 二进制自动转存机制**：
   - PA-4000、PA-4006、PA-4771、PA-4778、PA-4807、PA-4808、PA-4812、PA-4817、PA-4819 等 9 个型号源文件为 `.doc`；
   - 流水线底层通过 `resolveDocxFile` 调用无头 LibreOffice 自动转存为 `.docx` 实体后再进行 OOXML 解析，保证 100% 格式兼容与事实无损。

3. **双主体信息与排版几何硬锁全局继承**：
   - 13 个型号统一装配广州冠志与英德国彩企业预设；
   - 统一锁死单制表符 `<w:tab/>`、420/560 dxa 自适应标尺、Section 9 80.28pt 激光垂线及值单元格清除缩进顶格对齐。
