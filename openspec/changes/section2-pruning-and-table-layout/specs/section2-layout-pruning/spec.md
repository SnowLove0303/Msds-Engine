# Delta Spec: Section 2 智能匹配无值删行规约与表格排版几何契约

## ADDED REQUIREMENTS

### Requirement: S2-PRUNE-001 - Section 2 无值行必须物理安全删除
当执行智能匹配将结果写入目标模板时（`applyMatchResultToEditor`），Section 2 必须遵从“无值即删行”的原则：
- 若 Section 2 中某行对应的插槽在源文件中未匹配到有效值（或状态不为 `MATCHED` / `NOT_APPLICABLE`、或值为空白），该行必须自底向上通过 `deleteRow` 进行物理删除；
- 严禁在模板中保留大段空白无值行；
- 删行后，剩余行必须自动调用 `renumberRecord` 重新按序递增编号（如 `2.1`、`2.2`、`2.3` 等无断号）。

### Requirement: S2-MERGE-002 - Section 2 复合跨行合并块的动态几何联动
针对 Section 2 中的 `2.8 健康危害` 复合跨行块：
- 若所有健康途径（吸入、食入、皮肤、眼睛、症状体征）均无匹配值，该合并块的所有行（包含父标题行）必须完整安全删除；
- 若仅部分途径有值，必须物理删除无值的途径行，且首行父级标题单元格（`2.8 健康危害`）的 `rowspan` 属性与底层 Word XML `<w:vMerge>` 必须同步更新为实际剩余子行数，严禁悬空溢出。

### Requirement: S2-LAYOUT-003 - Web 渲染层列数与跨行边界防御
Web 渲染层（`renderStructuredTable`、`renderEditorTable`）在呈现 Section 2 时：
- 表格列数必须严格维持为 2 列（`colgroup` 宽度比例 `35.926%` : `64.074%`）；
- 严禁产生因跨行溢出覆盖后续行造成的第 3 列列挤出（Column Spillover）；
- 章节内加粗子标签（如 `2.9`、`2.10` 等）在渲染出的 HTML 中必须位于第一列（`col: 0`），严禁被推至第二列。
