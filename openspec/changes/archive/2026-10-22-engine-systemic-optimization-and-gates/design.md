# Design Document: engine-systemic-optimization-and-gates

## Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        MSDS Studio Core Engine                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Preamble Harmonizer (Section 12 自适应说明行中枢)                    │
│    - 提取源文件说明行: findPreambles(sourceSection12)                   │
│    - 中英文动态映射装配，绝不硬编码裁剪                                 │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Global Table Topology Guard (全局表格拓扑自愈守卫)                  │
│    - validateAndHealTableTopology(docXml)                              │
│    - 检查全16章节表格: 宽度的代数和守恒、gridSpan补全、孤立vMerge清除    │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Master Template Style Registry (模板样式指纹与二元归类强制器)       │
│    - Section 9: 420 dxa 悬挂, 300 dxa 行距, Times/Arial + Arial, 零 tabs│
│    - 普通单元格: 标签 Arial 12pt Bold / 值 Arial 12pt Regular (w:b=0) │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Mandatory Quality Assertion Gates (全项硬性交付门禁)                 │
│    - assertDeliverableQuality(docxEngine, isEnglish, sourceFacts)      │
│    - 覆盖 S9、S11、S12、页脚日期、零中文 5 大法定门禁                   │
└────────────────────────────────────────────────────────────────────────┘
```

## Detailed Engineering Changes

### 1. Section 12 Preamble Harmonization
- 源文件解析时，收集所有不带序号（12.1/12.2/生态毒性/持久性）的说明行数组 `preambleLines = []`。
- 装配时：
  - 中文模板：根据 `preambleLines.length` 动态保留/添加行，填入源文件真实说明行。
  - 英文流水线：
    - `该产品无可用的生态毒理学研究。` -> `No ecotoxicological studies are available for this product.`
    - `以下是(.*?)生态毒理学数据[：:]` -> `The following are ecotoxicological data for $1:`（组分名称自动翻译，如 N,N-二甲基乙酰胺 -> N,N-Dimethylacetamide）。
    - 仅在源文件确实只有 1 行时才删除第 2 行。

### 2. Global Table Topology Guard
在 `docx-engine.js` 导出文件时（`exportDocx` / `save`），自动调用 `healAllTableTopologies(documentXml)`：
- 计算每个表格的基准列宽总和；
- 对每一行检查 `Σ (cell.w)`，若发现短缺，自动将缺失宽度补充到最后一个可编辑单元格，并修正其 `gridSpan`；
- 清理孤立的 `w:vMerge`。

### 3. Pipeline Assertion Gates
在 `executeEightDeliverablesPipeline` 产出最终交付物之前，对生成的 Word AST 跑断言套件，任何一项不通过立即中断。
