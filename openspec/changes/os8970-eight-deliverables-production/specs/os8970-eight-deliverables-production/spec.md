## ADDED Requirements

### Requirement: OS-8970 Chemical Fact Ingestion and Source Grounding
The system SHALL ingest chemical facts strictly from the authorized source document `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\水性噁唑啉交联剂\OS-8970\OS-8970 msds_CN 冠志.docx` without exogenous contamination or ungrounded alterations.

#### Scenario: Single Source Grounding
- **WHEN** the OS-8970 production pipeline executes
- **THEN** it SHALL extract chemical properties and composition directly from the specified source file
- **AND** it SHALL freeze `isHazardous: false` and `isDangerousGoods: false` as authoritative invariants.

### Requirement: OS-8970 Eight Deliverables Generation Matrix
The system SHALL generate the full matrix of 8 deliverables covering Guanzhi and Guocai entities across Chinese and English languages in both DOCX and PDF formats.

#### Scenario: Deliverables Matrix Production
- **WHEN** batch export is triggered for OS-8970
- **THEN** the system SHALL produce `OS-8970 msds_CN 冠志.docx`, `OS-8970 msds_CN 冠志.pdf`, `OS-8970 msds_CN 国彩.docx`, `OS-8970 msds_CN 国彩.pdf`, `OS-8970 msds_EN Guanzhi.docx`, `OS-8970 msds_EN Guanzhi.pdf`, `OS-8970 msds_EN Guocai.docx`, and `OS-8970 msds_EN Guocai.pdf`
- **AND** the timestamp skew across all 8 files SHALL NOT exceed 300 seconds.

### Requirement: OS-8970 Section 2 Non-Hazardous Topology
The system SHALL render Section 2 of OS-8970 as a 2-row single-cell full-width layout reflecting non-hazardous classification according to GHS.

#### Scenario: Section 2 Chinese Non-Hazardous Rendering
- **WHEN** rendering Section 2 in Chinese documents
- **THEN** the table SHALL contain exactly 2 rows (header + full-width content cell)
- **AND** it SHALL state "根据GHS分类不属于危害化学品。" or "根据GHS不属于危险物" without any exogenous signal word or pictogram.

#### Scenario: Section 2 English Non-Hazardous Rendering
- **WHEN** rendering Section 2 in English documents
- **THEN** the table SHALL contain exactly 2 rows
- **AND** it SHALL state "Not classified as a hazardous chemical according to GHS." with no pictograms or signal words.

### Requirement: OS-8970 Section 3 Formulation and Trade Secret Preservation
The system SHALL faithfully map the chemical components from the source document into Section 3 with correct bilingual table isomorphism.

#### Scenario: Component Extraction and Trade Secret Mapping
- **WHEN** generating Section 3 for OS-8970
- **THEN** Row 1 SHALL represent `Oxazoline-modified acrylic polymer` (CAS: `Trade secret`, `20-30%`)
- **AND** Row 2 SHALL represent `Water` (CAS: `7732-18-5`, `70-80%`)
- **AND** the table structure SHALL be 100% isomorphic between Chinese and English.

### Requirement: OS-8970 Section 9 Physical and Chemical Properties Alignment
The system SHALL reproduce all measured physical properties from the source document and guarantee golden anchor alignment in exported PDFs.

#### Scenario: Measured Properties Reproduction
- **WHEN** populating Section 9 fields
- **THEN** appearance SHALL be `淡黄色至黄色透明液体` / `Light yellow to yellow transparent liquid`
- **AND** pH value SHALL be `6.5-8.5`
- **AND** viscosity SHALL be `＜500 mPa·s`
- **AND** water solubility SHALL be `可混溶的` / `Miscible`
- **AND** solid content SHALL be `约25%` / `Approx. 25%`.

#### Scenario: PDF Golden Anchor Label Alignment
- **WHEN** compiling PDFs for OS-8970
- **THEN** all Section 9 labels across the 4 PDF files SHALL vertically align at `x0 = 80.28pt` within tolerance.

### Requirement: OS-8970 Section 14 Non-Dangerous Goods Cascading Linkage
The system SHALL cascade non-dangerous goods status throughout Section 14 for road, maritime, and air transport.

#### Scenario: Non-Dangerous Goods Transport Information
- **WHEN** assembling Section 14
- **THEN** it SHALL omit any dangerous goods UN numbers (such as UN 1866)
- **AND** it SHALL state non-dangerous goods classification under IMDG, IATA, and domestic transport regulations.

### Requirement: OS-8970 Full-Spectrum Master and Bilayer Audit Passing
The system SHALL enforce that all 8 deliverables pass Layer 2 static linting, the 165-assertion master audit suite, and the bipolar bilayer audit with exit code 0.

#### Scenario: Zero-Defect Master Verification
- **WHEN** verifying OS-8970 deliverables
- **THEN** `lint_code_invariants.mjs` SHALL exit with code 0 (0 violations)
- **AND** `run_master_msds_audit.mjs` SHALL exit with code 0 (165/165 passing)
- **AND** `audit_bipolar_bilayer.mjs` SHALL exit with code 0 (0 failures).
