# footer-company-left-alignment Specification

## Purpose
Ensure all company names in footer parts (footer*.xml) are strictly left-aligned via explicit OOXML `<w:jc w:val="left"/>`, overriding inherited table style justification.

## Requirements

### Requirement: Footer Company Name Left-Alignment
The word processing engine SHALL explicitly set paragraph justification to left (`<w:jc w:val="left"/>`) on all paragraphs containing company name and model identifiers in footer parts.

#### Scenario: Update Table-Based Footer Company Name
- **WHEN** `updateHeaderFooterData` processes a table-based footer part
- **THEN** it SHALL set `<w:jc w:val="left"/>` on `rows[0].cells[0]` paragraph properties
- **AND** it SHALL remove any unintended paragraph indentation (`<w:ind>`)

#### Scenario: English Long Name Multi-Line Wrap
- **WHEN** an English company name wraps across multiple lines in the footer cell
- **THEN** all lines SHALL align flush to the left boundary without justified word-stretching
