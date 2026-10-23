# Spec Delta

## ADDED Requirements

### Requirement: English Section Dynamic Layout Pruning and Substance Cleansing
When processing English MSDS tables derived from legacy templates, the engine SHALL dynamically prune redundant placeholder and unrelated substance rows to achieve 1:1 structural and semantic parity with the approved Chinese baseline:
1. **Section 2 (Hazards Identification)**: The engine SHALL prune the 16-row template down to exactly 5 rows (Row 0: Section header, Row 1: 2.1 Classification, Row 2: 2.2 GHS Label Elements, Row 3: 2.3 Precautionary Statements, Row 4: 2.4 Other Hazards), eliminating rows 5 through 15 and eradicating all placeholder symbols.
2. **Section 5 (Fire fighting measures)**: Unsuitable extinguishing media (5.2) SHALL be evaluated before suitable extinguishing media to ensure `High-volume water jet.` is properly assigned.
3. **Section 8 (Exposure controls)**: The engine SHALL prune the template table down to 12 rows, completely removing the bottom control parameters sub-table containing unreferenced substances (such as Hexamethylene diisocyanate / HDI) when the product contains no isocyanates.
4. **Section 11 (Toxicological information)**: When no empirical product studies are available, Section 11 SHALL prune all component reference data rows (rows 2 through 17) and converge to a standard 2-row layout containing only the section header and `No toxicological studies are available for this product.`.
5. **Section 12 (Ecological information)**: The engine SHALL prune legacy introductory narrative rows and converge to the standard 4-row layout (12.1 Ecotoxicity, 12.2 Persistence and degradability, 12.3 Other adverse effects) without unrelated component residue.

#### Scenario: Section 2 pruning down to 5 rows in English MSDS
- **WHEN** building Section 2 for an English MSDS with GHS Category 3 aquatic hazard
- **THEN** rows 5 through 15 are deleted from the table
- **THEN** row 1 through row 4 contain 2.1 Classification, 2.2 Label Elements, 2.3 Precautionary Statements, and 2.4 Other Hazards without any empty row

#### Scenario: Section 8 unreferenced HDI table pruning
- **WHEN** generating Section 8 for waterborne epoxy emulsion EP-1702
- **THEN** the template table is pruned to 12 rows
- **THEN** no hexamethylene-1,6-diisocyanate row is present in the output document

#### Scenario: Section 11 convergence to 2-row layout
- **WHEN** generating Section 11 for an English MSDS lacking product toxicological studies
- **THEN** rows 2 through 17 are pruned
- **THEN** the section strictly consists of 2 rows with zero Chinese characters and zero placeholder letters
