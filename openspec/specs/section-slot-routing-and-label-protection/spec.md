# section-slot-routing-and-label-protection Specification

## Purpose
Defines explicit semantic slot routing rules for Section 1 and strict label/category-header immutability and physical isolation constraints across all 16 MSDS sections to prevent value injection from overwriting labels or hijacking parent category headers.

## Requirements

### Requirement: Section 1 Slot Routing and Parent Header Blank Invariance
The matching and injection engine SHALL route `product_name` exclusively to `中文名称：` whenever the template contains a `中文名称：` row. The parent sub-clause header row `1.1  产品名称：` SHALL retain an empty value cell.

#### Scenario: Injecting product name into Chinese template
- **WHEN** matching and injecting a product name like `聚氨酯分散体 PU-2341E` into a Chinese template containing both `1.1  产品名称：` and `中文名称：`
- **THEN** the value `聚氨酯分散体 PU-2341E` is written into the value cell of `中文名称：`
- **THEN** the value cell of `1.1  产品名称：` remains empty

#### Scenario: English template product name fallback
- **WHEN** matching and injecting a product name into an English template that lacks a `Chinese name:` row
- **THEN** the value is written directly to `1.1  Product name：`

### Requirement: All 16 Sections Category Header and Bold Label Protection
The injection engine SHALL strictly separate labels from values across all 16 sections. It SHALL NOT write values into any cell designated as `kind === 'label-only'`, any cell with `labelText`, or any structural category header row (including `1.1 产品名称：`, `1.3 供应商信息：`, `8.1 暴露控制：`, `工作场所组分控制参数`, `物质或混合物的相关安全、健康和环保法律法规`). Values SHALL strictly be routed to editable value cells (`kind !== 'label-only'` and `editable === true`).

#### Scenario: Protection against label cell overwrite on single cell rows
- **WHEN** injecting data into a row where only a label cell exists or no second value cell is present
- **THEN** the engine does not fallback to overwriting column 0 label cell
- **THEN** all bold runs and label texts remain immutable

#### Scenario: Toxicological multi-column label protection
- **WHEN** injecting acute toxicity or reproductive toxicity in Section 11
- **THEN** column 0 category headers (`11.1  急性毒性：`, `11.7  生殖毒性：`) and column 1 sub-labels (`经口：`, `生育力`) remain intact with bold formatting
- **THEN** data is written strictly into column 2

#### Scenario: Regulatory header protection in Section 15
- **WHEN** injecting applicable regulatory statutes into Section 15
- **THEN** structural headers `其它的规定：` and `符合下列法规要求：` are protected and never overwritten
- **THEN** statutes are written sequentially into subsequent data rows

### Requirement: Section 13 Three-Row Structure Invariance and Single-Cell Paragraph Merging
The matching and injection engine SHALL maintain an immutable 3-row layout for Section 13 (废弃处置 / Handling precautions). The engine SHALL NOT insert extra rows into Section 13 (including note rows). It SHALL consolidate statutory compliance and European Waste Catalogue (EWC) provisions into row index 1 column 0 as newline-separated paragraphs, strictly standardizing any typo occurrences of "必需遵守" to statutory "必须遵守". If an input or template table contains a rogue 4-row structure with an isolated split EWC row, the engine SHALL automatically prune the extra row and restore the official 3-row layout.

#### Scenario: Section 13 injection into standard 3-row template
- **WHEN** matching and injecting waste treatment methods containing national compliance and EWC into Section 13
- **THEN** both statements are written into row 1 cell 0 separated by a newline
- **THEN** no extra note rows are inserted and the section strictly maintains exactly 3 rows

#### Scenario: Automatic reconciliation of legacy 4-row tables
- **WHEN** loading or matching against a Section 13 table that contains 4 rows with an isolated split EWC row at row index 2
- **THEN** the rogue row 2 is safely pruned from the table structure
- **THEN** the consolidated statements are preserved in row 1 cell 0 and the table structure returns to exactly 3 rows

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
