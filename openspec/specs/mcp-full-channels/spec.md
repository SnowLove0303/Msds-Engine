# mcp-full-channels Specification

## Purpose
TBD - created by archiving change msds-mcp-channels-and-skill-optimization-graph. Update Purpose after archive.

## Requirements

### Requirement: Full Recognition MCP Channels
The system SHALL provide fine-grained recognition channels via stdio MCP protocol, allowing agents to extract 16 sections, down-drill into specific sections, and perform factual diff against output deliverables.

#### Scenario: Agent requests specific section facts
- **WHEN** the agent calls `msds_extract_section_facts` with `sectionNumber=2` and a valid DOCX path
- **THEN** the system returns structured GHS categories, signal word, H-statements, P-statements, and typography data without serializing cyclic DOM elements

### Requirement: Universal Geometry and Rich Text Editor Channels
The system SHALL provide geometry mutation and rich text writing channels via stdio MCP protocol, enabling dynamic template registration, column deletion with grid rebalancing, cell merging, and chemical formula subscripting.

#### Scenario: Agent deletes middle column in three-column structure
- **WHEN** the agent calls `msds_execute_editor_ops` with an operation `deleteColumn` at `colIndex=1` for `sectionNumber=3`
- **THEN** the system removes the target column cells across all rows, deletes the corresponding `gridCol` from `tblGrid`, balances remaining column widths to maintain 9795 dxa total width, and saves a valid DOCX file
