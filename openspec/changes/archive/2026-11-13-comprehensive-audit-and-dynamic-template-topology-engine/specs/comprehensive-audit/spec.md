# Spec: Comprehensive Multi-Dimensional Audit

## ADDED Requirements

### Requirement: REQ-AUDIT-01 Full-Scope Forensic Audit of Headers, Footers, and 16 Sections
The system SHALL execute an exhaustive, multi-dimensional forensic inspection of the generated deliverables across Chinese and English variants, analyzing headers, footers, and all 16 sections for content fidelity, table geometries, text formatting, font sizes, alignments, indents, laser tabs, and historical residues.

#### Scenario: Full-scope inspection of HPU-7651 deliverables
- **WHEN** the inspection probe is executed against the exported deliverables in the model directory;
- **THEN** it SHALL extract XML DOM attributes (`w:pPr`, `w:rPr`, `w:tcPr`, `w:tblBorders`, `w:sz`, `w:jc`, `w:ind`) for every section and compile a structured audit report detailing:
  1. Header and footer company identifiers, date, model code, and page number integrity;
  2. 16 sections content correctness, empty cells, and untranslated Chinese terms in English documents;
  3. Font family and font size distribution across body text and headers;
  4. Paragraph indents (hanging indents, first-line indents), laser tabs, and text alignments;
  5. Table border styles (outer solid, inner dotted) and cell width distribution;
  6. Historical template placeholder residues and pruning effectiveness.
