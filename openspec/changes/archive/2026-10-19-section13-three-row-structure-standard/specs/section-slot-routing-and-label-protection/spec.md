# Spec Delta

## ADDED Requirements

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
