# Universal Source Recognition Specification

## ADDED Requirements

### Requirement: Lossless Full-Content DOCX Extraction
The universal recognizer (`recognizeDocumentUniversal` in `web/src/recognition-engine.js`) SHALL extract all headers/footers, body paragraphs, all tables (regardless of section count or numbering), structural field candidates, raw `sourceOoxml` XML parts, `coverage` metrics, and `recognitionWarnings` without hardcoded `1..16` section limits or industry keyword filtering.

#### Scenario: Recognize arbitrary 20-section DOCX with headers, body text, and field codes
- **WHEN** `recognizeDocumentUniversal` processes a `.docx` containing headers/footers, non-table body paragraphs, 20 tables (sections 1..20), `vMerge` cells, and `w:instrText` field codes
- **THEN** it SHALL extract all 20 tables and `dynamicSections`, all `headerFooter` items, all `bodyParagraphs`, retain `sourceOoxml` parts, report accurate `coverage` counts, and emit a `source_ooxml_not_normalized` warning for `w:instrText`.

#### Scenario: `recognizeSourceDocx` supports pure universal mode without 1..16 truncation
- **WHEN** `recognizeSourceDocx(buf, name, { universalOnly: true })` is called
- **THEN** it SHALL return the universal extraction result without running `SECTION_KEYWORDS` or `parseSection1..16` domain filters.
