# footer-revision-date-clip-fix Specification

## Purpose
TBD - created by archiving change footer-revision-date-clip-fix. Update Purpose after archive.

## Requirements

### Requirement: Footer Revision Date Indent Pruning
The word processing engine SHALL prune any inherited paragraph indentations (`<w:ind>`) on footer date cells to prevent character clipping at page boundaries.

#### Scenario: Update Table Footer Date Cell
- **WHEN** `writeDateToFooterCell` updates the date cell in a table-based footer
- **THEN** it SHALL remove any existing `<w:ind>` element from `<w:pPr>`
- **AND** the full prefix text (e.g. `Revision Date: `) SHALL be rendered without leading character loss

#### Scenario: PDF Text Extraction Integrity
- **WHEN** a document with an English footer is exported to PDF
- **THEN** extracted text SHALL contain `Revision Date` with capital leading character
- **AND** it SHALL NOT contain truncated fragments like `evision Date`
