# section2-layout-pruning Specification

## Purpose
Define strict invariants and operational procedures for Section 2 (Hazard Identification) layout pruning in MSDS documents. Ensures that empty rows are physically removed from OOXML tables without leaving dangling blanks or broken row-spanning merges, sequence numbers remain strictly consecutive, and web table rendering maintains a clean two-column layout without column spillover.

## Requirements

### Requirement: S2-PRUNE-001 - Section 2 无值行物理安全删除
The matching engine SHALL enforce zero-residual pruning for Section 2 when applying match results to template tables:
- When a slot in Section 2 lacks a valid matched fact in source data (or status is not `MATCHED`/`NOT_APPLICABLE`, or value is whitespace), the engine SHALL physically delete the corresponding row via bottom-up row deletion;
- The engine MUST NOT leave blank or unpopulated rows in target tables;
- After row deletion, remaining rows SHALL be automatically renumbered sequentially (e.g. `2.1`, `2.2`, `2.3` with zero sequence gaps).

#### Scenario: Pruning unmatched Section 2 rows
- **WHEN** smart matching runs on Section 2 slots and finds unmatched or empty items
- **THEN** the engine deletes all empty row nodes from bottom to top
- **AND** renumbers the remaining valid rows with consecutive numbering prefixes

### Requirement: S2-MERGE-002 - Section 2 复合跨行合并块动态联动
The layout engine MUST dynamically synchronize vertical merges (`<w:vMerge>`) for compound multi-row blocks like `2.8 健康危害`:
- When all health hazard routes (inhalation, ingestion, skin, eyes, symptoms) have no matched values, the engine SHALL safely remove all rows of the compound block including the parent header row;
- When only a subset of routes has valid values, the engine SHALL physically delete empty route rows and update the parent cell's `rowspan` and `<w:vMerge>` count to match the actual remaining child rows, preventing dangling spillover.

#### Scenario: Synchronizing rowspan on partial health routes
- **WHEN** only inhalation and skin routes have values while eyes and ingestion are empty
- **THEN** the engine deletes the empty child rows
- **AND** updates the parent header row cell rowspan and vertical merge tags to match the surviving rows

### Requirement: S2-LAYOUT-003 - Web 渲染层列数与跨行边界防御
The web rendering layer (`renderStructuredTable`, `renderEditorTable`) SHALL strictly protect column boundaries when rendering Section 2:
- The table MUST maintain exactly 2 columns with a fixed width ratio (`35.926%` : `64.074%`);
- The renderer MUST NOT produce a third column spillover caused by row-span overflow;
- Sub-labels in Section 2 (such as `2.9`, `2.10`) MUST stay positioned in the first column (`col: 0`) in rendered HTML.

#### Scenario: Rendering Section 2 in editor without column spillover
- **WHEN** the web client renders Section 2 table view
- **THEN** the table layout enforces exactly two columns without width collapse
- **AND** all sequence sub-labels stay pinned in column 0
