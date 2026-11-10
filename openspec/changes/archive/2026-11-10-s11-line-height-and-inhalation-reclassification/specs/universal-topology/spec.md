# universal-topology Specification Deltas

## ADDED Requirements

### Requirement: Section 11 Value Font-Size Equal Empty Line Height
The rendering engine SHALL format empty paragraph spacers between distinct studies or paragraphs with exact line heights equal to the prescribed font size of value cells (12pt / 240 dxa in Chinese, 9.5pt / 190 dxa in English), eliminating disproportionately tall vertical gaps.

#### Scenario: Empty Paragraph Exact Height Formatting
- **WHEN** rendering an empty paragraph spacer (`<w:p>`) between separate experimental studies in Section 11 or other value cells
- **THEN** the paragraph properties (`<w:pPr>`) SHALL specify `<w:spacing w:before="0" w:after="0" w:lineRule="exact"/>`
- **AND** in Chinese deliverables, `w:line` SHALL be set to `240` (12pt)
- **AND** in English deliverables, `w:line` SHALL be set to `190` (9.5pt)
- **AND** the visual blank space between study blocks SHALL match the height of a single regular line of text.

### Requirement: Section 11 Acute Toxicity Inhalation Siphoning and Classification Correction
The source extraction engine SHALL separate inhalation toxicity test data that was erroneously placed under oral toxicity blocks in source documents, and correctly reclassify and append it to the acute inhalation toxicity endpoint.

#### Scenario: Inhalation Toxicity Disentanglement from Oral Block
- **WHEN** the source text for `11.1 急性毒性，经口` (acute oral toxicity) contains inhalation measurements (such as `LC50 吸入` or `OECD测试导则403`)
- **THEN** the extraction engine SHALL remove the inhalation data block from `11.1 急性毒性，经口`
- **AND** the extraction engine SHALL append the extracted inhalation data block to `11.3 急性毒性，吸入` (acute inhalation toxicity)
- **AND** both Chinese and English deliverables SHALL display oral toxicity only in 11.1 and all inhalation toxicity tests in 11.3.
