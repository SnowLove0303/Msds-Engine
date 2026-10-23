## Purpose

Provide a template-agnostic footer date update and extraction architecture that dynamically inspects, extracts, and injects revision dates across tabular, paragraph-based, and non-standard Word document footers without coupling to fixed cell indices or hardcoded static dates.

## ADDED Requirements

### Requirement: Adaptive Date Extraction from Source Documents
The engine SHALL automatically inspect source document footers, headers, and document body metadata to extract the actual revision date, falling back to explicit runtime parameters or system date only when the source contains no date information.

#### Scenario: Date present in source document footer
- **WHEN** a source document contains a footer with text matching date patterns like `修订日期： 2026/10/10` or `Revision Date: 2026/10/10`
- **THEN** the pipeline MUST extract `2026/10/10` and propagate it as the canonical document revision date
- **AND** it MUST NOT be overwritten by hardcoded default dates.

### Requirement: Multi-Modal Footer Adaptation
The engine SHALL dynamically identify the structure of every `word/footer*.xml` part and adapt its update strategy to tabular footers, paragraph footers, or create missing footers.

#### Scenario: Tabular footer with arbitrary column layout
- **WHEN** a footer contains a table with an unknown number of columns
- **THEN** the engine MUST search all cells for date markers (`修订日期`, `Revision Date`, `Date`, or date regex) and update the matching cell
- **AND** if no date cell is found but the table has at least 2 columns, it MUST format the date in the rightmost cell without breaking existing text.

#### Scenario: Paragraph-based footer
- **WHEN** a footer consists of regular `<w:p>` paragraphs instead of tables
- **THEN** the engine MUST search paragraph runs for date patterns and replace the date portion while preserving tab stops, alignments, and run fonts.

#### Scenario: Missing or empty footer
- **WHEN** a template lacks a footer part or contains an empty body
- **THEN** the engine MUST synthesize a compliant footer part containing company identity, document code, and revision date.
