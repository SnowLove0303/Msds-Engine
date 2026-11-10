# universal-topology Specification Deltas

## ADDED Requirements

### Requirement: Universal Multi-Study and Multi-Paragraph Empty Line Fidelity
The rendering engine, generic cell writing primitives, and serialization pipeline SHALL preserve and render an empty separator line between distinct experimental studies, distinct component data blocks, or separate paragraphs across all table cells in all sections, strictly restoring the source document's paragraph layout.

#### Scenario: Section 11.6 Sensitization Multi-Study Separation
- **WHEN** Section 11.6 (Respiratory or skin sensitization) contains multiple experimental studies (such as Buehler dermal test and LLNA local lymph node assay)
- **THEN** the rendering engine SHALL render an empty paragraph (`<w:p>`) between the conclusion of the first study (`对类似产品研究` / `Studies on a similar product`) and the heading of the second study (`皮肤致敏性（局部淋巴结试验（LLNA））` / `Local lymph node assay (LLNA):`)
- **AND** the empty paragraph SHALL be assigned standard cell paragraph formatting (`<w:spacing w:line="300" w:lineRule="auto"/>`, `<w:jc w:val="left"/>`) without text runs
- **AND** both Chinese and English deliverables SHALL symmetrically display the empty separation line between the two studies.

#### Scenario: Universal Multi-Study Endpoint Separation
- **WHEN** any Section 11 endpoint (including 11.1 Acute oral toxicity, 11.11 In vitro mutagenicity, or repeated dose toxicity) contains multiple studies or multiple chemical components separated by blank lines in the source document
- **THEN** the structured toxicology cell writer SHALL NOT discard empty lines via `.filter(Boolean)`
- **AND** the dynamic English translation engine SHALL NOT collapse newlines with `\s+` regex substitution, preserving all line breaks and study separator lines across Chinese and English deliverables.

#### Scenario: Generic Cell Writing and Cell Pair Deconstruction Empty Line Preservation
- **WHEN** deconstructing cell pairs in `decomposeCellPairToFacts` or writing cell values via `writeCellValue`
- **THEN** intermediate empty paragraphs separating distinct data items SHALL NOT be purged by `.filter(Boolean)`
- **AND** `writeCellValue` SHALL NOT collapse double newlines (`\n\n`) to a single newline (`\n`), compressing only 3 or more consecutive newlines (`\n{3,}`) to `\n\n`.
