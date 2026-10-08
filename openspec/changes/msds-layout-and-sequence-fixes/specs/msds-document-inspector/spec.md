# Delta Specification: MSDS Layout & Sequence Refinements

## ADDED REQUIREMENTS

### Requirement: Section Sequence Extraction & Numbering Preservation
The system MUST support extracting and rendering sequence numbers from both plain text and Word `w:numPr`/`numbering.xml` automatic numbering across Section 1, 3, 7, and 9, preserving each paragraph's sequence even within multi-paragraph cells.

#### Scenario: Display Section 1, 3, 7, 9 sequences
- **GIVEN** an MSDS document with automatic numbering in Section 1, 3, 7, or 9 (e.g. PU-1107 or embedded templates)
- **WHEN** the document is loaded into the inspector or editor
- **THEN** all sequence labels such as `1.1`, `3.1`, `7.1`, `9.1` are fully preserved in `cell.labelText` and displayed in the table view
- **AND** no sequence is silently dropped due to automatic numbering format or paragraph indexing.

### Requirement: Multi-Label Row Splitting
The system MUST ensure that each structured row contains only one primary label; if a single physical table row contains multiple label paragraphs in its first column, the system MUST automatically split it into multiple independent logical rows.

#### Scenario: Split multi-label row in Section 14
- **GIVEN** an MSDS document containing multiple label paragraphs in a single table row (such as PU-2341E Section 14 Row 2 with 14.2, 14.3, 14.4)
- **WHEN** `logicalTableRows` processes the section table
- **THEN** each label paragraph is split into its own independent logical row
- **AND** each generated row displays exactly one label and its corresponding value.

### Requirement: Empty Row Elimination
The system MUST automatically detect and eliminate physical rows where all cells contain empty string text and no images, excluding them from structured views and logical row collections.

#### Scenario: Filter out completely blank rows
- **GIVEN** a table containing an empty row where all cells have empty string text and no images
- **WHEN** the table is processed into logical rows
- **THEN** the empty row is automatically dropped and does not appear in the structured view.

### Requirement: Section 15 Explanatory Labels Flush-Left
In Section 15, bold items represent explanatory labels; the system MUST NOT assign sequence numbers to them, MUST NOT apply child indentation alignment, and MUST align them flush left.

#### Scenario: Align Section 15 explanatory labels
- **GIVEN** Section 15 with bold regulatory items (such as "其它的规定：" or "符合下列法规要求：")
- **WHEN** `classifyLabelTier` evaluates the cells
- **THEN** the cells are classified as `parent` (left-aligned with 0 padding)
- **AND** no sequence number is generated for them.

### Requirement: Header and Footer Format Restoration without Bold
When displaying or processing document headers and footers, the system MUST restore the original OOXML formatting and MUST strictly prohibit bolding (`font-weight: normal`).

#### Scenario: Render header and footer without bold
- **GIVEN** document headers or footers from `word/header*.xml` or `word/footer*.xml`
- **WHEN** the header or footer records are rendered
- **THEN** the original OOXML font and size are respected
- **AND** all bold formatting is stripped (`font-weight: normal`).
