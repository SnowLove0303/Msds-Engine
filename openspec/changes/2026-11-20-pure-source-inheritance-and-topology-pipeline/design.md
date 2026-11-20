# Design: Context 2 -> 拓扑匹配编译器 -> 编辑器 -> WPS PDF

```text
源文件 DOCX
  ├─▶ Phase 1: recognizeSourceDocx -> Context 1
  ├─▶ Phase 2~3: buildStructuredContext2 (先中后英 + TM) -> Context 2 (isValid=true)
  └─▶ Phase 4~5: 对 4 套模板 (CN/EN x 冠志/国彩):
        compileTopologyOps(ctx2, schema, { enableContentMapping: false })
        ──▶ 执行编辑器原语 (clearSectionValues, applyPreset, morphToFullWidth, insertRowAfter, deleteRow, writeCell, formatLaserTabs)
        ──▶ 产出 4 份 DOCX
  └─▶ Phase 6: Windows WPS COM -> 4 份矢量 PDF
  └─▶ Phase 7: 机械审计 + Agent 介入审计速查包
```
