# Design: Context 2 全量逐句英译与标准化表格架构

## 1. 标准化表格模型 (`placement`)
- `SECTION_HEADER`: `gridType: '1_COL_MERGED'`, `colSpan: 2`（多列表头为 `colSpan: 3+`）
- `FULL_WIDTH_STRUCTURED` / `EXPLANATION` / `REGULATION_ITEM`: `gridType: '1_COL_MERGED'`, `colSpan: 2`, `targetCol: '0..1 (通栏合并)'`
- `SEQ_LABEL` / `SUB_LABEL` (双列): `gridType: '2_COL_KV'`, `colSpan: 1`, `targetCols: { label: 0, value: 1 }`
- `COMPONENT_ROW` / `TABLE_HEADER` (S3): `gridType: '3_COL_TABLE'`, `colSpan: 1`, `targetCols: [0, 1, 2]`
- `OEL_ROW` / `TABLE_HEADER` (S8 多列): `gridType: 'MULTI_COL_TABLE'`, `colSpan: 1`, `targetCols: [0..N-1]`

## 2. 全量逐句英译闭环
1. **初次识别治理**：`buildStructuredContext2` 先应用内置术语参考，扫描出所有仍含中文的条目写入 `validation.untranslatedItems`（含 `sectionNumber`, `rowIndex`, `cnText`）。
2. **Agent 逐句翻译回填**：Agent 读取 `untranslatedItems` 后，结合化学/毒理语义逐句翻译并生成 `translations.json`，通过 `--translations=<path>` 传入 `msds_govern_context2` 或 `run_standard_production.mjs`。
3. **零中文残留门禁**：二次运行后 `validation.untranslatedCount === 0` 且 `validation.isValid === true`，方可放行至 Phase 4~7 写盘。
