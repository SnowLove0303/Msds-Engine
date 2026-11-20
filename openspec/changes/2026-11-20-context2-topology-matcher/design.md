# Design: 拓扑匹配编译器架构

```text
Context 2 (16 章节标准化表格 + validation.isValid=true)
   +
Template Schema (inspectTemplateSchema: 16 章节行/列/gridSpan/标签锚点)
   │
   ▼  compileTopologyOps() [纯结构对齐，零内容捏造]
   ├─▶ 1. 前置清零 (applyPreset + clearSectionValues)
   ├─▶ 2. 节内锚点匹配 (seq / 归一化标签 -> writeCell)
   ├─▶ 3. 形态伸缩 (3_COL_TABLE / MULTI_COL_TABLE / 1_COL_MERGED)
   ├─▶ 4. 安全倒序删行 (deleteRow from bottom to top)
   └─▶ 5. 排版加固 (formatLaserTabs + applyAdaptiveRuler + enforceFlushLeftValues)
   │
   ▼
紧凑《拓扑对齐编译计划》 + 确定性 operations[] ──▶ msds_execute_editor_ops
```
