# table-header-and-label-alignment Specification

## Purpose
Standardize table header typography and label sequence alignment across all 16 sections in MSDS documents and web workbench views. Enforces consistent font roles, fixed double-slot sequence containers, hanging indent for multi-line labels, vertical cell centering, and semantic decoupling of value-only text rows.

## Requirements

### Requirement: Section 3 Table Header Style Uniformity
The table header row in Section 3 (`化学品名称 | CAS编号 | 含量%（w/w）` or English counterpart) SHALL possess consistent typography roles, font weight, and border underlines in both web rendering and DOCX generation:
- All three header cells MUST render text with bold weight (`font-weight: 700`);
- All header cells SHALL retain bottom border underline styling;
- The sequence indent (`label-child-row`) MUST be suppressed in column 0 so vertical baseline aligns across all three columns;
- Exported DOCX OOXML runs MUST explicitly include `<w:b/>` tags.

#### Scenario: Rendering Section 3 table header row
- **WHEN** rendering Section 3 header row in recognition, matching, or template editor views
- **THEN** all three column cells render with bold font weight and horizontal baseline alignment
- **AND** exported Word documents contain explicit bold markup on all header runs

### Requirement: Fixed Double-Slot Baseline Alignment
All data row label cells (with or without sequence number prefixes) across DOCX recognition, smart matching, and template editor views SHALL adopt a fixed-width double-slot grid layout:
- The container MUST utilize the `.label-line-grid` layout container;
- The first slot SHALL be fixed at `--sequence-width` (default 2.8rem) as `.sequence-run` / `.sequence-slot`;
- For unnumbered labels, the slot MUST render an invisible `.empty-slot` placeholder;
- The label text MUST reside in `.label-text-slot`, ensuring first Chinese character X coordinates share a vertical collinear alignment across all 16 sections;
- Hardcoded `padding-left: 2.2rem` offsets MUST NOT be applied to unnumbered rows.

#### Scenario: Aligning labeled and unnumbered rows
- **WHEN** displaying rows with sequence numbers like `1.1` alongside unnumbered rows like `中文名称：`
- **THEN** both row types share the identical horizontal start coordinate for the primary label text
- **AND** double-click editing boundaries in the editor are confined within the text slot

### Requirement: Multi-Line Label Hanging Indent
When label text wraps across multiple lines, wrapped text lines SHALL maintain hanging indentation within the label text slot:
- Second and subsequent lines MUST align with the first character of line one;
- Wrapped text MUST NOT spill back into the sequence slot or cell left boundary.

#### Scenario: Wrapping long labels in Section 11
- **WHEN** long text such as `特异性靶器官系统毒性——一次接触` wraps in a narrow column
- **THEN** line two aligns vertically with line one
- **AND** the sequence margin remains reserved as hanging whitespace

### Requirement: Label Cell Vertical Centering
Label cells in structured tables SHALL render with vertical middle alignment by default:
- Computed `vertical-align` of label cells MUST be `middle` (excluding Section Row 0 title banners);
- Global CSS MUST NOT override label cell vertical alignment to `top` with `!important`.

#### Scenario: Rendering label cells next to multi-line values
- **WHEN** a right-side value cell expands vertically due to multi-line text
- **THEN** the left-side label cell vertically centers relative to the expanded row height

### Requirement: Horizontal Text Flow in Narrow Columns
Narrow label columns such as Section 8 and Section 11 SHALL maintain horizontal readability:
- Label columns SHALL maintain a minimum safe width of at least 110px;
- Chinese text MUST wrap by semantic phrase boundaries without single-character vertical fragmentation;
- English words, concentration units, and parenthetical groups (e.g. `(w/w)`) MUST stay horizontally intact.

#### Scenario: Viewing narrow label columns in editor
- **WHEN** column width drops below 160px
- **THEN** the layout maintains horizontal word grouping
- **AND** suppresses isolated single-character vertical text splitting

### Requirement: Value-Only Row Semantics
Single-column standalone full-width text rows (Section 13 waste disposal, Section 15 regulations, Section 16 disclaimers) SHALL be treated as pure value containers:
- Cells spanning the entire width without colon prefixes SHALL receive `role = 'value-only'` and `fontRole = 'value'`;
- Rendered markup MUST use `.value-only-row` with normal font weight (`font-weight: normal`);
- The renderer MUST NOT wrap such rows into `label-parent-row` or inject synthetic bold/indent styling.

#### Scenario: Rendering full-width regulatory text
- **WHEN** Section 13 or Section 15 outputs large multi-paragraph regulatory text
- **THEN** the row renders as regular body text without artificial bolding or label indentation
