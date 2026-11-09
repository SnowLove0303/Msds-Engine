# Universal Topology and Source Grounding Specification

## ADDED Requirements

### Requirement: Section 3 Subheader Typography
The system SHALL identify Section 3 subheaders and format them as bold subheaders with statutory font sizes, while keeping chemical component rows as regular text.

#### Scenario: Section 3 Subheader Formatting
- **WHEN** any table cell in Section 3 matches subheader patterns `/^(?:3\.[12]\s*)?(?:成分|混合物|物质|Ingredients|Mixture|Substance)/i`
- **THEN** the rendering engine SHALL apply bold typography (`<w:b/>` and `<w:bCs/>`)
- **AND** in Chinese documents, the font size SHALL be set to statutory 12pt (`w:sz w:val="24"` and `w:szCs w:val="24"`)
- **AND** in English documents, the font size SHALL be set to statutory 9.5pt (`w:sz w:val="19"` and `w:szCs w:val="19"`)
- **AND** component data rows below Section 3 subheaders SHALL preserve regular font weight (`<w:b/>` stripped).

### Requirement: Table Row Cross-Page Break Permissive Invariant
The system bottom layer SHALL NOT inject `<w:cantSplit/>` by default, allowing multi-line narrative content and large tables to flow naturally across page margins and eliminating vertical white space cliffs.

#### Scenario: Multi-Line Table Natural Flow
- **WHEN** generating table data rows across all sections (Section 1 through 16)
- **THEN** rows SHALL be permissive to cross-page splitting (`<w:cantSplit/>` omitted or removed)
- **AND** only indivisible single-line section title headers (Row 0) MAY preserve `<w:cantSplit/>`
- **AND** vertical empty white space between consecutive tables or before page footers SHALL NOT exceed 3.0 cm due to artificial table row suppression.

### Requirement: Section 11 Dynamic Entity-Driven Topology
The contents of Section 11 SHALL be 100% grounded in the source file, and the template SHALL NOT dictate or constrain the number of toxicity endpoints.

#### Scenario: Section 11 All 13 Endpoints Preserved
- **WHEN** extracting and building Section 11 from the source file
- **THEN** the engine SHALL extract all 13 toxicological endpoints present in the source file, including STOT-SE classification conclusions ("Based on available data, the classification criteria are not met"), CMR composite evaluations, subacute toxicity, and in vivo genotoxicity
- **AND** the engine SHALL dynamically invoke universal primitives (`insertRow`) to create the exact matching number of rows
- **AND** both Chinese and English outputs SHALL maintain a 1:1 identical row count and slot correspondence.

### Requirement: Section 14 Dangerous Goods Dynamic Topology and Anti-Hardcoding
Section 14 SHALL be constructed via universal primitives driven by chemical classification facts, without hardcoded product model branches or exogenous regional regulations.

#### Scenario: Section 14 Universal Assembly and Conventions
- **WHEN** constructing Section 14 for dangerous or non-dangerous goods
- **THEN** the engine SHALL NOT inject ungrounded regional regulations (such as Australian Dangerous Goods Code / ADG regulations)
- **AND** all statutory international conventions (MARPOL 73/78 Annex II and IBC Code) and precautionary directions (See sections 6-8) present in the source file SHALL be 100% preserved
- **AND** the engine SHALL invoke universal editing primitives (`insertRow`, `deleteRow`, `editCellLabel`, `editCellValue`) to dynamically construct the appropriate dangerous goods or non-dangerous goods topology.

### Requirement: Section 2 Pure Full-Width Container (Zero Inner Dashed Borders)
Section 2 SHALL render visually as a single unified full-width card container, with internal horizontal borders set to none.

#### Scenario: Section 2 Seamless Full-Width Block
- **WHEN** rendering Section 2 split across multiple rows for cross-page breaking
- **THEN** the internal horizontal borders between adjacent rows inside Section 2 SHALL be set to `w:val="none"`
- **AND** the engine SHALL NOT inject `dotted`, `dashed`, or visible internal borders between Section 2 rows
- **AND** the outer table borders SHALL remain standard solid borders to enclose the full-width block cleanly.
