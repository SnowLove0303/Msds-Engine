# Capability: Template Editor Excel-like View and Inline Editing

模板编辑器具备与识别模块一致的高保真 Excel 风格表格渲染架构与原地在线编辑能力。

## ADDED Requirements

### Requirement: Unified Layout and Excel-like Table Rendering in Editor
The template editor view MUST adopt the exact same 3-column layout as the inspector view, rendering tables with clean Excel/Word fidelity without disruptive row-gutter or action columns.

#### Scenario: Clean Table Rendering in Editor
- **Given** the user navigates to the "模板编辑器" (Editor) view with a loaded template (e.g. "CN 冠志")
- **When** the editor table is rendered for the selected Section
- **Then** the table MUST use the authentic column group markup (`<colgroup>`) matching the DOCX source
- **And** the table MUST NOT contain extra `.row-gutter` or `.row-actions` columns
- **And** the cells MUST display clean typography without permanent bulky `<textarea>` or footer badges
- **And** the overall 3-column layout (Section navigation, centered table, right preview/audit) MUST match the Inspector view.

### Requirement: In-Place Inline Cell Editing
The template editor MUST support seamless in-place inline editing directly within table cells.

#### Scenario: Editing an Editable Value Cell
- **Given** a data row in the editor table containing an editable value cell
- **When** the user clicks on the value cell
- **Then** the cell MUST display an active focus indicator without layout shift
- **And** typing text MUST immediately update the DOCX engine's cell value
- **And** the editor dirty state MUST become active ("有未导出修改").

#### Scenario: Protecting Locked or Label Cells by Default
- **Given** a label cell or Section Table Title row (Row 0)
- **When** the "特殊情况：允许修改标签文本" toggle is unchecked
- **Then** the label cell and Row 0 MUST remain read-only and non-editable
- **When** the user checks "特殊情况：允许修改标签文本"
- **Then** data row label cells MUST become editable in-place while Row 0 remains strictly protected.

### Requirement: Non-Intrusive Row Add and Delete Operations
Row addition and deletion in the template editor MUST be accessible without corrupting the table column geometry.

#### Scenario: Floating Row Actions on Hover
- **Given** a data row in the editor table (Row index > 0)
- **When** the user hovers over the row
- **Then** a floating action tool (`.row-floating-actions`) MUST appear allowing the user to add a row after or delete the current row
- **And** Row 0 (Title Row) MUST NOT permit deletion.
