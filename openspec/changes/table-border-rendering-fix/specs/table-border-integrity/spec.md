# Capability: Table Border Integrity and Rendering Fidelity

确保 MSDS 表格在包含复杂跨行跨列（Rowspan / Colspan）及三列等多列结构时，所有边框线条均完整无缺、清晰对齐。

## ADDED Requirements

### Requirement: Full Border Coverage for Multi-Row Spanning Tables
When a table contains cells that span multiple rows (`rowspan > 1`), all adjoining cells in subsequent rows MUST retain complete border lines without dropping vertical or horizontal boundaries.

#### Scenario: Section 11 Acute and Reproductive Toxicity 3-Column Sub-Tables
- **Given** a document containing Section 11 with 3-column structured data (such as Row 3 `rowspan="4"` for 急性毒性 and Row 12 `rowspan="3"` for 生殖毒性)
- **When** the table is rendered in the Inspector or Editor view
- **Then** all rows under the spanning cell (Rows 4, 5, 6 and Rows 13, 14) MUST render a solid 1px border on all sides
- **And** the vertical dividing line between Column 0 and Column 1 MUST remain completely visible and continuous across all 4 rows.

#### Scenario: Section 2 Hazards Identification Multi-Row Health Hazards
- **Given** Section 2 containing Row 9 `2.8 健康危害` with `rowspan="5"`
- **When** the table is rendered in the Inspector or Editor view
- **Then** Rows 10, 11, 12, and 13 starting at Column 1 MUST render an unbroken vertical left border abutting Column 0
- **And** no border line segment between the hazard category and its specific routes of exposure may disappear.

### Requirement: Elimination of Fragile Sibling Selector Borders and Inline Border-Zero
The application MUST rely on native CSS table border collapsing (`border-collapse: collapse`) rather than sibling element selectors (`td + td`, `tr + tr > td`) or inline `border:0` styles.

#### Scenario: Standard CSS Border Application
- **Given** any table element rendered with `.structured-table`, `.editor-excel-table`, or `.editor-table`
- **When** CSS styles are applied
- **Then** every `td` and `th` element MUST have `border: 1px solid #6f6f6f`
- **And** no inline `style="border:0"` may suppress cell borders
- **And** adjacent borders MUST collapse into crisp single-pixel dividers without doubling.
