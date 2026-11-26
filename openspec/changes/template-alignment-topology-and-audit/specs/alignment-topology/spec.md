# Spec: 模板对齐拓扑识别、执行与机械审计

## ADDED Requirements

### Requirement: RTM-01 模板拓扑识别提取对齐方式与策略
The template schema inspector (`inspectTemplateSchema` in `web/src/template-editor.js`) **SHALL** extract per-cell horizontal alignment (`jc`), vertical alignment (`vAlign`), and row-level `alignmentPolicy` (`MULTI_COL_CENTER` / `KV_TWO_COL` / `FULL_WIDTH_LEFT` / `SECTION_TITLE`) for all 16 sections.

#### Scenario: 识别模板 Section 3 与 Section 8 多列网格对齐策略
- **WHEN** `msds_get_template_schema` / `inspectTemplateSchema` parses a template
- **THEN** Section 3 header/data rows (`cellsCount >= 3`) and Section 8 OEL header/data rows (`cellsCount >= 3`) **SHALL** report `alignmentPolicy: "MULTI_COL_CENTER"` and `zeroIndentRequired: true`.

### Requirement: RTM-02 & RTM-03 拓扑锁定执行多列居中零缩进（含 S3 与 S8 OEL）
`formatSection3GridCenter` and `applyTopologyTypographyLock` in `web/src/template-editor.js` **SHALL** enforce `jc="center"`, `vAlign="center"`, and **SHALL** strip all `w:ind` attributes (`left`, `right`, `hanging`, `firstLine`, `leftChars`, `rightChars`, `hangingChars`, `firstLineChars`) on every centered cell (`jc === "center"`) in Section 3 (`r >= 3`) and Section 8 OEL header/data rows (`cells.length >= 3`).

#### Scenario: Section 3 克隆第 3 条成分与前两行及表头同轴居中
- **WHEN** a Section 3 component table has 3+ components (original rows + cloned rows)
- **THEN** all rows `r >= 3` **SHALL** have `jc="center"`, `vAlign="center"`, and zero `w:ind` attributes on every paragraph.

#### Scenario: Section 8 控制参数物质表（OEL）统一居中零缩进
- **WHEN** a Section 8 table contains an OEL multi-column substance header and data rows (`cells.length >= 3`)
- **THEN** all OEL header and data cells **SHALL** have `jc="center"`, `vAlign="center"`, and zero `w:ind` attributes, while the OEL explanation row remains `jc="left"`.

### Requirement: RTM-04 机械审计纳入多列对齐与零缩进硬校验
`staged-mechanical-audit.js` **SHALL** verify across all deliverables (CN/EN × primary/secondary presets) that:
1. Every Section 3 (`r >= 3`) cell has `jc="center"`, `vAlign="center"`, and zero `w:ind` attributes (`P5_S3_CENTER` + `P5_S3_ZERO_INDENT`);
2. Whenever Section 8 contains an OEL multi-column substance table (`cells.length >= 3`), every OEL header/data cell has `jc="center"`, `vAlign="center"`, and zero `w:ind` attributes (`P5_S8_OEL_ALIGNMENT`).

#### Scenario: 检出居中单元格残留 w:ind 并阻断放行
- **WHEN** any Section 3 or Section 8 OEL centered cell retains `w:ind` (`left`, `right`, `hanging`, etc.)
- **THEN** `staged-mechanical-audit.js` **SHALL** emit `FAIL` and exit with non-zero status.
