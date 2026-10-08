# Capability: MSDS Empty Line Preservation

MSDS 表格单元格内的多段落空行间隔必须在网页识别中被正确保留并渲染为可见高度，杜绝段落高度坍缩。

## ADDED Requirements

### Requirement: Paragraph Spacing Preservation in Multi-Paragraph Cells
Within any table cell containing multiple paragraphs (such as Section 11 toxicological test items), any empty paragraphs (`<w:p/>` without text runs or with only whitespace) that separate content blocks MUST be rendered as non-collapsing visual line spacers (`paragraph-spacer`) with minimum line height.

#### Scenario: Section 11 Toxicological Study Spacer Lines
- **Given** an imported MSDS document (such as PU-2341E) with Section 11 containing 104 paragraphs and 17 empty spacer paragraphs
- **When** the document is parsed and rendered in the inspector view
- **Then** each empty spacer paragraph MUST render with `min-height: 1.2em` and contain non-collapsing content (`&nbsp;`)
- **And** the 17 spacer lines MUST visually separate the distinct toxicological test sections
- **And** the height of the spacer line MUST NOT collapse to `0px`.

### Requirement: Distinct Handling of Empty Rows vs Empty Paragraphs
The system MUST maintain distinct handling between empty table rows (`<tr>`) and empty paragraphs within a cell.

#### Scenario: Empty Row Deletion Maintained
- **Given** a table with an empty data row where all cells are devoid of content (such as Section 14 row 3)
- **When** `logicalTableRows` processes the record
- **Then** the empty row MUST still be pruned from the logical row list
- **And** empty paragraphs inside valid content cells MUST NOT be pruned.
