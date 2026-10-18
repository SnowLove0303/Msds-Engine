# Spec Delta

## Purpose

为 MSDS 用户提供一套以正式 CN/EN 模板为样式原型的网页编辑器，在不破坏表格结构、字体角色、序号规则和源模板的前提下修改值、核对章节并导出可继续使用的 DOCX。

## ADDED Requirements

### Requirement: Embedded template workspace

The system SHALL provide embedded CN 冠志 and EN 冠志 templates and SHALL let the user switch between them in the editor workspace. The editor MUST display the template's sixteen-section structure, merged-cell layout, labels, values, and a source-style preview before editing.

#### Scenario: Open the default template

- **WHEN** the user enters the editor workspace
- **THEN** the CN template is available as the default or explicitly selectable template, its sections are navigable, and the source template remains unchanged

#### Scenario: Switch language template

- **WHEN** the user selects EN 冠志 and confirms the switch
- **THEN** the editor replaces the working copy with the EN template, resets dirty state, and updates the section preview and fields

### Requirement: Protected value editing

The system SHALL allow editing non-bold value runs and note rows by default while keeping section titles, numbering, structural rows, and bold labels read-only. The editor MUST require an explicit user action before allowing label edits and MUST preserve the original role/style metadata when writing values.

#### Scenario: Edit a normal value

- **WHEN** the user changes a non-bold field value and exports
- **THEN** the value changes in the working document while the surrounding run/paragraph/table styles and the source template remain unchanged

#### Scenario: Attempt to edit a locked label

- **WHEN** the user attempts to edit a bold label or a protected sequence without enabling the exceptional label-edit mode
- **THEN** the editor blocks the mutation and explains the protection rule

#### Scenario: Edit a Section 9 label with permission

- **WHEN** the user explicitly enables label editing and changes a Section 9 property label
- **THEN** the editor preserves the `9.n` prefix, restores the required fixed-width spacing before the label, keeps the label's style, and marks the document as dirty

### Requirement: Safe row operations and audit

The system SHALL support adding a row after an editable row and deleting only eligible data rows. It MUST protect Section title rows and minimum structural rows, keep changes scoped to the selected section, re-number surviving sub-items continuously, preserve legitimate repeated sub-items, and surface audit errors before export.

#### Scenario: Add a formatted row

- **WHEN** the user adds a row after an editable row
- **THEN** the new row inherits the source row's layout/style, clears editable value content, receives a continuous section number, and is included in the audit

#### Scenario: Delete a data row

- **WHEN** the user deletes an eligible data row
- **THEN** the row is removed from the working copy, later item numbers are re-numbered within that section, and repeated Section 11/12 sub-items remain valid

#### Scenario: Protect a structural row

- **WHEN** the user requests deletion of a section title or otherwise protected structural row
- **THEN** the editor refuses the operation and leaves the working document unchanged

### Requirement: Style-preserving DOCX export

The system SHALL export the current working document as a new `.docx` download and SHALL never overwrite the embedded template or the imported source. Export MUST include a final audit summary and MUST stop with an actionable error when structural audit failures remain.

#### Scenario: Export an audited document

- **WHEN** the working document is valid and the user clicks export
- **THEN** the browser downloads a new DOCX with the edited values and preserved template structure/styles, and reports the output file name and audit result

#### Scenario: Block export on audit failure

- **WHEN** a section has a numbering or protected-structure audit error
- **THEN** export is blocked, the affected section and error are shown, and the working document remains available for correction

### Requirement: Minimal white editing surface

The system SHALL present the editable working copy on a white canvas with concise controls and SHALL apply the embedded template's detected table proportions, borders, shading, typography, merged cells, and row heights to the editor table wherever those properties are available.

#### Scenario: Edit within the template visual system

- **WHEN** the user opens a CN or EN embedded template
- **THEN** the editor's table surface is white and its row/cell geometry and visual hierarchy follow the selected template rather than a separate dark application theme

