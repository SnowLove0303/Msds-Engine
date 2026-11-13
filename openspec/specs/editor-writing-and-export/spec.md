# editor-writing-and-export Specification

## Purpose
TBD - created by archiving change write-context2-to-editor-and-export-eight-deliverables. Update Purpose after archive.

## Requirements

### Requirement: REQ-ED-01 Context 2 Ingestion and Editor Session Writing
The system SHALL ingest the finalized Context 2 JSON data model for model `HPU-7651` and directly invoke the existing editor writer primitives without introducing unverified abstraction layers.

#### Scenario: Ingestion of Context 2 into editor work sessions
- **WHEN** Context 2 data is supplied with 16 sections, GHS classifications, components, and physical properties;
- **THEN** the editor SHALL create template work sessions for both Guanzhi and Guocai entities across Chinese and English variants, clear previous placeholder values, and write the corresponding values into template cells.

### Requirement: REQ-ED-02 Full Eight-Deliverables Export
The system SHALL export four standard DOCX documents and convert them into four native PDF documents.

#### Scenario: Production of four DOCX and four PDF deliverables
- **WHEN** editor sessions have finished writing and applying typography projection;
- **THEN** the system SHALL output:
  1. `<MODEL> msds_CN 冠志.docx`
  2. `<MODEL> msds_CN 国彩.docx`
  3. `<MODEL> msds_EN Guanzhi.docx`
  4. `<MODEL> msds_EN Guocai.docx`
  5. `<MODEL> msds_CN 冠志.pdf`
  6. `<MODEL> msds_CN 国彩.pdf`
  7. `<MODEL> msds_EN Guanzhi.pdf`
  8. `<MODEL> msds_EN Guocai.pdf`
  All 8 files MUST have a non-zero byte size.

### Requirement: REQ-ED-03 Target Output Directory Placement
The exported deliverables SHALL be placed into the target directory corresponding to the model.

#### Scenario: Delivery placement in HPU target folder
- **WHEN** the export and PDF conversion steps succeed;
- **THEN** the system SHALL place the 8 deliverables into `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-2 水性羟基聚氨酯树脂 HPU\<MODEL>\`.

### Requirement: REQ-ED-04 Transparent Gap and Problem Forensic Audit
The system SHALL record, analyze, and present all formatting, visual, or layout discrepancies between Context 2 and the exported deliverables.

#### Scenario: Forensic identification of editor formatting defects
- **WHEN** deliverables are generated;
- **THEN** the system SHALL inspect cell wrapping, margins, font projection, and table geometries, and compile an exhaustive problem inventory for the user to review before determining subsequent optimization steps.
