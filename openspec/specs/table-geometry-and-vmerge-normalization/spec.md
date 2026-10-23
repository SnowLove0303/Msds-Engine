# table-geometry-and-vmerge-normalization Specification

## Purpose
Establishes an automated table row geometry self-healing and grid conservation mechanism within the MSDS Engine and Editor. Ensures that any multi-column collapse or row consolidation maintains exact table grid alignment, restores missing gridSpan and cell width, and purges dangling vertical merge markers (`vMerge`), preventing border distortion and broken layouts.

## Requirements

### Requirement: Table Row Geometry and Width Conservation
Whenever a table row is consolidated or pruned from multiple cells into fewer cells (e.g. from 3 cells to 2 cells in Section 11), the engine SHALL automatically normalize the geometry of the remaining cells. The total width of the cells (`Σ tcW`) MUST match the table baseline width (e.g. 9781 dxa in Section 11), and the final cell SHALL receive the appropriate `gridSpan` to span the remaining grid columns.

#### Scenario: Consolidating Section 11.7 Reproductive Toxicity into two cells
- **WHEN** the 3-column template row for Section 11.7 is simplified into a standard label-value pair
- **THEN** the value cell (Cell 1) SHALL be assigned a width of exactly `6262 dxa`
- **AND** the value cell SHALL have `<w:gridSpan w:val="3"/>` explicitly defined
- **AND** the right border of Section 11.7 SHALL be vertically aligned with surrounding rows.

### Requirement: Dangling Vertical Merge Elimination
The engine SHALL detect and purge any dangling vertical merge markers (`<w:vMerge>`) on cells that no longer have corresponding downstream `continue` cells.

#### Scenario: Pruning downstream continuation rows of a merged cell
- **WHEN** downstream continuation rows of a vertically merged item are deleted
- **THEN** any `<w:vMerge w:val="restart"/>` or `<w:vMerge/>` on the primary row SHALL be stripped
- **AND** the cell SHALL behave as a standalone single-row cell without vertical merge side-effects.

### Requirement: Skill Immuntable Table Geometry Standard
The `msds-studio` Skill specification SHALL mandate that all agents and pipeline procedures invoke `normalizeRowGeometry` whenever mutating table topology, strictly forbidding raw cell deletion without geometry rebalancing.

#### Scenario: Agent executing row convergence or cell removal
- **WHEN** an agent modifies table rows or columns
- **THEN** it SHALL apply the table geometry normalizer
- **AND** it SHALL verify that no cell width deficits or dangling merge states remain in the rendered deliverable.
