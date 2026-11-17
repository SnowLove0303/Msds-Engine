# Spec: 通用页面格式与页脚拓扑强化识别及产出物页脚统一治理

## ADDED Requirements

### Requirement: Universal Page Formatting Recognition
The template topology recognizer SHALL extract page formatting metrics defined in `<w:sectPr>`, including `pageSize` (width, height, orientation), `margins` (top, bottom, left, right, header, footer, gutter), and `docGrid`.

#### Scenario: Extract page formatting from arbitrary DOCX template
- **WHEN**: An arbitrary valid DOCX template is loaded
- **THEN**: The system SHALL return a structured `pageFormat` blueprint with both dxa and millimeter measurements.

### Requirement: Universal Footer Topology and Slot Recognition
The template topology recognizer SHALL locate active footer parts via relationships and detect revision date, entity model, and page number slots dynamically.

#### Scenario: Detect footer slots in borderless table or paragraph layout
- **WHEN**: The template footer uses borderless tables, bordered tables, or plain paragraphs
- **THEN**: The system SHALL locate slot container types, coordinates, and native style attributes without hardcoded row or column assumptions.

### Requirement: Deliverable Footer Unification and Defect Cleanse
The overwrite engine SHALL cleanse all aberrant artifacts (e.g., prefix "P", thin spaces) and dynamically inject preset entity and source model into footer slots.

#### Scenario: Format clean date and preset entity in footer
- **WHEN**: The engine updates footer data for any deliverable
- **THEN**: The footer revision date SHALL be sanitized, company name SHALL match active preset, and typography SHALL inherit template native tokens.
