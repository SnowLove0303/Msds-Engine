# Spec Delta

## Purpose

Defines behavioral and geometric layout requirements for label continuation line vertical alignment, workspace width utilization, panel space reallocation, and presentation-layer adaptive label widths across recognition and smart matching views.

## ADDED Requirements

### Requirement: Label Continuation Vertical Alignment Invariance
The UI rendering engine SHALL ensure that whenever a table label wraps across multiple lines, the first character of the second and subsequent lines aligns vertically with the first character of the first line's label text slot. The label line container SHALL maintain `display: grid` with sequence slot in column 1 and text slot in column 2.

#### Scenario: Numbered label wrapping in two-column table
- **WHEN** a numbered label such as `5.1  合适的灭火剂：` or `5.2 不合适的灭火剂：` wraps into multiple lines
- **THEN** the second line's first character aligns vertically with the first Chinese character of line 1 with horizontal deviation <= 1px
- **THEN** the second line does not retreat to the left boundary of the sequence slot or cell

#### Scenario: Non-numbered label wrapping in two-column table
- **WHEN** a label without a sequence number wraps into multiple lines
- **THEN** the empty sequence slot preserves spacing and all lines align vertically with the label text slot start line

### Requirement: Wide Screen Workspace Width Expansion
The application root container `main.page-shell` SHALL expand to utilize available horizontal screen space on wide displays without being constrained to a fixed 1920px limit.

#### Scenario: Rendering in wide viewport
- **WHEN** the browser viewport width exceeds 1920px (e.g. 2304px)
- **THEN** the workspace shell expands to fill available width with no more than 32px total margin
- **THEN** no horizontal scrolling is introduced

#### Scenario: Responsive fallback for smaller screens
- **WHEN** the viewport width is below 1280px
- **THEN** existing responsive breakpoints and column collapsing behaviors are preserved

### Requirement: Recognition and Matching View Panel Reallocation
The layout grids in the recognition view and smart matching view SHALL allocate sufficient width to structured tables and reduce unnecessary decorative padding.

#### Scenario: Recognition view panel allocation
- **WHEN** viewing the recognition page
- **THEN** the structured table receives higher flex priority and the DOCX preview maintains at least 820px minimum width

#### Scenario: Smart matching three-screen view allocation
- **WHEN** viewing smart matching in three-screen mode
- **THEN** original and standard tables receive balanced readable width and table scroll container padding is reduced to 4px

### Requirement: Table Structure Preservation and Non-interference
The web layout optimization SHALL NOT alter Section 3 three-column table structures, single-column note/disclaimer blocks, or DOCX export `gridWidthsTwips`.

#### Scenario: Section 3 composition table layout
- **WHEN** rendering Section 3 composition table
- **THEN** chemical name, CAS number, and concentration columns maintain their three-column structure with intact headers

#### Scenario: DOCX export fidelity
- **WHEN** generating or exporting a document
- **THEN** original template twips column widths remain unmodified
