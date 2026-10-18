# msds-document-inspector Specification

## Purpose
规范 MSDS 结构化识别表格中的标签排版系统，保障标签字号标准一致、全量还原段落序号，并建立父级标签与子级标签的分级垂直对齐机制及业务特例规则。

## Requirements

### Requirement: Standardized label role typography

The system SHALL derive label typography strictly from body section tables (`word/document.xml`), ignoring header, footer, and oversized cover title formatting. Body table labels SHALL use the standard 12pt (24 halfPoints) bold typography (宋体 for CN, Times New Roman for EN) and SHALL NOT be contaminated by smaller header/footer font sizes or non-standard fonts.

#### Scenario: Body label font size compliance
- **WHEN** a document with 9pt header text and 12pt body text is parsed
- **THEN** structured table labels render with 12pt bold font rather than the smaller header font

#### Scenario: Isolate header and footer styles
- **WHEN** a DOCX package contains header/footer tables preceding body tables
- **THEN** role style derivation skips header/footer records and establishes label/value styles solely from body records

### Requirement: Robust sequence recovery and zero-loss rendering

The system SHALL detect, normalize, and render all section item numbering prefixes—including direct text runs (`1.1`, `1.2`, `1.`, `1、`) and Word automatic multi-level lists from `w:numPr` and `numbering.xml`. The rendering system MUST NOT strip text runs when no prefix is matched and MUST display the recognized sequence prefix ahead of the label text.

#### Scenario: Multi-level text sequence rendering
- **WHEN** a cell starts with `1.1  产品名称：`
- **THEN** the sequence `1.1` is rendered in the sequence prefix slot and the label `产品名称：` follows without text loss

#### Scenario: Automatic numbering list recovery
- **WHEN** a cell's sequence is defined only in Word `w:numPr` and `numbering.xml`
- **THEN** the resolved sequence number is prepended to the rendered label and no characters from the body run are dropped

### Requirement: Parent and child label classification

The system SHALL classify first-column labels into distinct structural tiers:
1. **Parent Label (父级标签)**: Any label possessing a valid section-level or sub-item sequence number (`1.1`, `8.1`, `9.1`, etc.).
2. **Parent Label Exception (特例父级标签)**: Section 8's `建议：` / `Recommendation:` SHALL be classified as a Parent Label despite having no sequence number.
3. **Child Label (子级标签)**: Any unsequenced sub-attribute label (such as `中文名称：`, `供应商名称：`, `呼吸系统防护：`, `手部防护：`, `眼睛防护：`, `身体防护：`).

#### Scenario: Classify sequenced label as parent
- **WHEN** parsing `1.1  产品名称：` or `8.1  暴露控制：`
- **THEN** the system marks the cell/paragraph role as a Parent Label

#### Scenario: Classify unsequenced sub-attribute as child
- **WHEN** parsing `中文名称：` or `手部防护：`
- **THEN** the system marks the cell/paragraph role as a Child Label

#### Scenario: Classify Section 8 recommendation as parent exception
- **WHEN** parsing Section 8 row `建议：` or `Recommendation:`
- **THEN** the system classifies it as a Parent Label rather than a Child Label

### Requirement: Separate vertical alignment baselines

The structured table layout SHALL enforce dual vertical alignment baselines for first-column labels:
1. **Parent Alignment**: All Parent Labels (and the Section 8 `建议` exception) SHALL vertically align along the primary left baseline (0 indent).
2. **Child Alignment**: All Child Labels SHALL vertically align along a secondary indented baseline, ensuring all child labels in the same section align flush with each other.

#### Scenario: Parent labels align flush along left edge
- **WHEN** rendering Section 1 rows `1.1  产品名称：`, `1.2  使用建议：`, `1.3  供应商信息：`
- **THEN** their left text edges align along the same vertical line

#### Scenario: Child labels align flush along secondary indent
- **WHEN** rendering Section 1 rows `中文名称：`, `供应商名称：`, `电话：`
- **THEN** their left text edges align along a uniform secondary indented vertical line

#### Scenario: Section 8 recommendation aligns with parent baseline
- **WHEN** rendering Section 8 row `建议：`
- **THEN** its text aligns with `8.1  暴露控制：` and `8.2  工程控制：` on the primary parent baseline, without child indentation

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

### Requirement: Local DOCX import and recognition

The system SHALL allow the user to choose or drag a `.docx` file into the recognition workspace and SHALL parse it locally without sending the file to a remote service. The system MUST reject unsupported extensions and display a recoverable error that does not discard the current document.

#### Scenario: Import a supported DOCX

- **WHEN** the user selects or drops a readable `.docx` file
- **THEN** the workspace displays the file name, recognition status, parsed records, and the source preview

#### Scenario: Reject an unsupported file

- **WHEN** the user selects a file whose extension is not `.docx`
- **THEN** the workspace displays an actionable format error and keeps the previous recognition result intact

### Requirement: Sixteen-section structured presentation

The system SHALL present recognized MSDS content as a consistent table-based view for Sections 1 through 16. Each section view MUST retain row and column order, cell text, visible merged-cell spans, paragraph breaks, detected label/value candidates, and image content when those elements exist in the source.

#### Scenario: Display a complete sixteen-section document

- **WHEN** recognition finds the sixteen section tables
- **THEN** the navigation and content area expose Sections 1–16 with a uniform table style and the section count/coverage summary

#### Scenario: Display a document with missing or extra structure

- **WHEN** the source document has missing sections, nested tables, body text, headers/footers, or normalization warnings
- **THEN** the workspace preserves the recognized records, marks the affected sections/records as unclassified or incomplete, and surfaces the warning without silently discarding source information

### Requirement: Source-fidelity preview and format evidence

The system SHALL provide a source preview that renders the imported DOCX in document order and SHALL provide a separate evidence view for direct text/paragraph/table properties and normalization coverage. The structured view MUST NOT be presented as a claim that it is an exact replacement for the source page layout.

#### Scenario: Compare source preview with structured table

- **WHEN** the user selects a section record
- **THEN** the workspace shows the corresponding source-preview context together with the normalized table and its format/coverage evidence

#### Scenario: Inspect a formatted cell

- **WHEN** the user opens a cell's format details
- **THEN** the workspace shows available font, size, bold/italic, color, paragraph alignment/spacing, merge, border, shading, width, and row-height metadata without changing the source file

### Requirement: Search, warnings, and JSON export

The system SHALL allow filtering recognized content by section, record, cell text, detected field label, or common GHS aliases, and SHALL allow exporting the normalized recognition result as UTF-8 JSON including schema version, records, warnings, coverage, and source-format evidence.

#### Scenario: Filter by a recognized term

- **WHEN** the user enters a keyword such as `GHS07`, `感叹号`, or a product field label
- **THEN** the navigation and table results narrow to matching records/cells and show the number of matches

#### Scenario: Export the recognition result

- **WHEN** the user clicks export after a successful import
- **THEN** the browser downloads a JSON file containing the current normalized result and no transient preview-only object references

### Requirement: Minimal white interface with template-aligned tables

The system SHALL use a white page and panel background with restrained borders and SHALL omit nonessential explanatory copy from the primary work area. The structured table MUST use the source DOCX's available direct style evidence for font, font size, paragraph alignment, cell shading, borders, merged spans, column widths, and row heights so that its visual proportions follow the template instead of a separate decorative theme.

#### Scenario: Render a source-aligned structured table

- **WHEN** the user selects a recognized table from a DOCX template
- **THEN** the structured view renders on a white canvas with the source table's detected row heights, cell borders/shading, typography, widths, and merged cells applied to the corresponding rows/cells

#### Scenario: Keep the interface visually minimal

- **WHEN** either recognition or editor workspace is open
- **THEN** the page shows only the navigation, essential actions, section navigation, table/preview content, and concise status badges without dark decorative panels or long explanatory paragraphs

### Requirement: Bounded equal-height recognition workspace

The system SHALL remove the document coverage panel from the recognition workspace. The section directory, structured-result table, and source-preview column MUST share one bounded work-area height with aligned bottom edges, and each column MUST scroll vertically within its own frame so long recognition results do not increase the page height.

#### Scenario: Keep three recognition columns aligned

- **WHEN** a recognized document is open on a desktop viewport
- **THEN** the directory, result table, and source preview frames start and end at the same horizontal levels

#### Scenario: Scroll long results inside their frames

- **WHEN** a Section contains more rows than fit in the available viewport height
- **THEN** the directory, result table, and source preview use internal vertical scrolling while the surrounding page remains bounded

### Requirement: Full source-format table rendering

The structured result table SHALL render source DOCX content in paragraph/run order rather than flattening a cell to one text style. It MUST preserve available direct run formatting, paragraph alignment/spacing/indentation, cell/table borders, fills, merged geometry, and embedded images in their source order; the unchanged DOCX preview remains the fallback authority for inherited or unsupported Word styles.

#### Scenario: Preserve mixed text runs

- **WHEN** a cell contains multiple runs with different font, size, bold, italic, color, underline, or line-break properties
- **THEN** the structured table renders each run with its corresponding direct format and keeps the original run order and breaks

#### Scenario: Preserve embedded images

- **WHEN** a cell contains a DOCX drawing or image relationship
- **THEN** the structured table resolves the package image and places it in the corresponding paragraph/run order instead of replacing it with a placeholder

### Requirement: Unified Excel-style table grid

The structured result table SHALL render an Excel-style grid: every visible cell receives the same solid border, the outer frame uses the same solid line, and all horizontal and vertical separators are continuous. Source `nil`, `dotted`, or `dashed` border values MUST NOT alter this visual grid.

#### Scenario: Render PU-1107 table lines

- **WHEN** the supplied PU-1107 DOCX is recognized
- **THEN** its table frame and internal row/column separators appear as consistent solid lines across the complete table

#### Scenario: Keep the Excel grid continuous across merged cells

- **WHEN** a table contains row spans, column spans, or cells with missing direct border values
- **THEN** the visible table uses one continuous solid Excel-style grid without gaps or source-specific dotted/dashed variations

### Requirement: Bold-label and value grouping

The structured recognition view SHALL treat bold runs as labels and non-bold runs as values. It MUST preserve the source logical table rows and cell structure, keep multi-paragraph or multi-line values inside their existing value cell, and MUST NOT create a new table row or border for each text line.

#### Scenario: Render a normal label-value row

- **WHEN** a source logical row contains a bold label cell and a non-bold value cell
- **THEN** the result keeps the two cells on one table row, renders the label with its bold run formatting, and renders the value with its non-bold run formatting

#### Scenario: Keep a multi-line value in one cell

- **WHEN** a value cell contains multiple paragraphs or line breaks
- **THEN** the result keeps those lines in the same value cell with paragraph breaks and run formatting, without drawing internal table lines between them

### Requirement: Preserve automatic Word numbering

The recognition parser SHALL resolve paragraph numbering stored in `w:numPr` and `numbering.xml` when the visible sequence is not present in the text runs. The rendered result MUST display the resolved sequence before the original run content without changing the original run formatting.

#### Scenario: Restore an automatic Section 1 sequence

- **WHEN** a Word paragraph uses an automatic multi-level numbering definition for a Section item
- **THEN** the recognition table displays the resolved number (for example `1.1`) before the bold label/value content

#### Scenario: Normalize a legacy Section 1 heading

- **WHEN** the source title cell uses the legacy `v1.` prefix
- **THEN** the recognition result displays `1.` while the original `v1.` remains available in the source preview

### Requirement: Role-based typography normalization

The structured recognition result SHALL derive one label typography profile from representative bold label runs and one value typography profile from representative non-bold value runs in the imported document. All bold labels MUST use the label profile and all non-bold values MUST use the value profile, while the source DOCX preview remains unchanged.

#### Scenario: Apply one label style

- **WHEN** a document contains labels with different direct font sizes or font names
- **THEN** every rendered label in the recognition table uses the selected document label profile

#### Scenario: Apply one value style

- **WHEN** a document contains values with different direct font sizes or font names
- **THEN** every rendered value in the recognition table uses the selected document value profile and remains non-bold unless the role profile explicitly says otherwise

#### Scenario: Keep sequence and label in one column/text flow

- **WHEN** a row has a resolved sequence and a label
- **THEN** the sequence is rendered directly in the same first label text flow and cell, for example `1.1  产品名称：`, rather than as a separate table column or detached index block

### Requirement: Source-row-aware continuation merging

The recognition normalizer SHALL merge a row into the previous logical row only when the source row's first column is empty, a later column contains the continuation value, and the previous row has an identifiable label-value structure. A row with its own non-empty label-like first column MUST remain an independent row even when that label is not bold.

#### Scenario: Merge a blank-label continuation row

- **WHEN** a source row has an empty first column and a value in the second column immediately after a labeled value row
- **THEN** the value is appended to the previous row's value cell and no new logical row is created

#### Scenario: Keep an unbold label row independent

- **WHEN** a source row has text in its first column ending with a label delimiter and a value in the next column
- **THEN** the row remains independent and is not merged into the preceding row
