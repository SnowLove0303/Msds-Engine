# Specification: strict-template-formatting-fidelity

## Purpose
Enforces strict typography and structural formatting parity between all generated/edited MSDS documents and the official master templates. Restricts all cell rendering in the MSDS Engine and Skill specifications to binary classification (Label vs Value) with exact template metrics, prohibiting any unauthorized font, size, indentation, or tab modifications.

## ADDED Requirements

### Requirement: Binary Semantic Classification Policy
The MSDS Engine and Template Editor SHALL classify every rewritten or inserted cell into either a `label` or a `value` semantic category before applying styles. Arbitrary or ad-hoc style injection MUST be strictly prohibited.

#### Scenario: Categorizing a Section 9 physical property cell
- **WHEN** a Section 9 table cell is formatted by the editor or pipeline
- **THEN** it SHALL be processed through the semantic classifier
- **AND** if classified as a label, it SHALL receive the standard multi-run label structure with hanging indent 420 dxa and line spacing 300 dxa
- **AND** if classified as a value, it SHALL inherit the regular value typography without bold weight.

### Requirement: Section 9 Template Typography Parity
All Section 9 label cells (Cell 0) across Chinese and English outputs SHALL strictly conform to the exact parameters of the master template: hanging indent of exactly 420 dxa, zero extra tab stops (`w:tabs`), run 1 sequence number formatted as 10.5pt Bold (`sz="21"`), and run 2 label name formatted as Arial 12pt Bold (`sz="24"`).

#### Scenario: Formatting Section 9.22 Solid content in Chinese and English
- **WHEN** Section 9.22 is rendered into the document
- **THEN** the paragraph properties MUST contain `<w:ind w:left="420" w:hanging="420"/>` and `<w:spacing w:line="300" w:lineRule="auto"/>`
- **AND** the sequence run MUST be Times New Roman (CN) or Arial (EN) at 10.5pt Bold with a single trailing space
- **AND** the label text run MUST be Arial at 12pt Bold ending with a full-width colon
- **AND** no `<w:tabs>` element SHALL be present in the cell paragraph.

### Requirement: General Table Label and Value Distinction
Across all 16 sections (including Section 1, 2, 7, 8, 11, 12, 13, etc.), labels and values in Chinese and English outputs SHALL maintain clear visual distinction matching the template. Labels SHALL be bold with appropriate line spacing, and values SHALL be regular non-bold text.

#### Scenario: English output label-value contrast verification
- **WHEN** an English deliverable is generated
- **THEN** table labels SHALL NOT degrade into single plain text runs sharing the same weight as values
- **AND** all labels SHALL remain distinct and visually bold according to the template hierarchy.

### Requirement: Skill Operational Governance and Immutability
The `msds-studio` Skill specification SHALL explicitly mandate that agents and developers only perform semantic classification (Label vs Value) aligned with template baselines, strictly forbidding custom style overriding.

#### Scenario: Agent invoking MSDS Studio API or Skill
- **WHEN** an agent performs formatting or standardization tasks
- **THEN** it SHALL adhere strictly to template-derived typography
- **AND** it SHALL NOT emit custom CSS, font-family substitutions (such as SimHei replacing Arial), or custom tab stops.
