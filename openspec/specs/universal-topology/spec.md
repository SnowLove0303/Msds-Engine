# universal-topology Specification

## Purpose
Defines universal 16-section table topology, alignment, hierarchical indentation, dynamic Section 14 source-sovereign construction, and typography projection rules across all MSDS deliverables.

## Requirements

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
Section 2 SHALL render visually as a single unified full-width card container, with internal horizontal borders set to none, and global border enforcement SHALL exempt Section 2 from injecting inner dotted/dashed lines.

#### Scenario: Section 2 Seamless Full-Width Block
- **WHEN** rendering Section 2 split across multiple rows for cross-page breaking
- **THEN** the internal horizontal borders between adjacent rows inside Section 2 SHALL be set to `w:val="none"`
- **AND** the engine SHALL NOT inject `dotted`, `dashed`, or visible internal borders between Section 2 rows
- **AND** the outer table borders SHALL remain standard solid borders to enclose the full-width block cleanly
- **AND** global border enforcement functions SHALL exempt Section 2 from injecting inner dotted/dashed lines.

### Requirement: Global Sequence, Label, and Value Typography Invariant
The system bottom layer SHALL enforce uniform font family, font size, and font weight across all 16 sections, and SHALL align all parent labels and sub-labels to the single global golden anchor established by Section 9.1 ("9.1 外观").

#### Scenario: All 16 Sections Chinese Documents
- **WHEN** formatting any table cell in Chinese documents across Section 1 through Section 16
- **THEN** sequence numbers and labels in column 0 SHALL be formatted as 12pt (`sz="24"`) SimSun Bold with Times New Roman for ASCII characters (exempting Section 9 sequence numbers at 10.5pt `sz="21"` for laser vertical alignment)
- **AND** all value cells (column 1 and subsequent data columns) SHALL be formatted as 12pt (`sz="24"`) regular font weight (`bold: false`)
- **AND** all parent label texts (following the sequence number) across all 16 sections SHALL vertically align with the golden anchor line established by Section 9.1 (`420 dxa`).

#### Scenario: All 16 Sections English Documents
- **WHEN** formatting any table cell in English documents across Section 1 through Section 16
- **THEN** sequence numbers and labels in column 0 SHALL be formatted as 9.5pt (`sz="19"`) Arial Bold
- **AND** Section 8 small labels SHALL NOT be enlarged to 12pt (`sz="24"`)
- **AND** all value cells (column 1 and subsequent data columns) SHALL be formatted as 9.5pt (`sz="19"`) Arial regular font weight (`bold: false`).

#### Scenario: Sub-Label and Parent Label Golden Anchor Parity
- **WHEN** rendering sub-labels without sequence numbers (such as respiratory protection, hand protection, glove material, eye protection, body protection in Section 8)
- **THEN** the first character of each sub-label SHALL start at horizontal position 420 dxa (`<w:ind w:left="420"/>`)
- **AND** the sub-labels SHALL vertically align 100% with the first character of parent label text (e.g., "暴" in Section 8.1 and "外" in Section 9.1).

### Requirement: Label Wrap Hanging Indent Alignment
When label text wraps to multiple lines, the first character of the second and subsequent lines SHALL always vertically align with the first character of the first line on the golden anchor line (420 dxa).

#### Scenario: Label with Sequence Number Wrapping
- **WHEN** a label cell contains a sequence number and label text that wraps to multiple lines (such as Section 11.7 "亚急性、亚慢性和延迟毒性：")
- **THEN** the paragraph SHALL be configured with hanging indentation (`w:ind w:left="420" w:hanging="420"`)
- **AND** a tab stop anchor SHALL position the first character of the label text at horizontal position 420 dxa
- **AND** the first character of the second line (e.g., "性：") SHALL start at horizontal position 420 dxa, vertically aligned with the first line label text.

#### Scenario: Pure Label Without Sequence Number Wrapping
- **WHEN** a label cell contains no sequence number and wraps to multiple lines
- **THEN** the paragraph SHALL NOT have asymmetric first-line indentation (`firstLine="482"` stripped)
- **AND** the second line first character SHALL align with the first line first character at horizontal position 420 dxa.

### Requirement: Section 3 Single Sequence Number and Zero Automatic Numbering
Section 3 SHALL strictly have a single, non-repeating sequence number for 3.1 and 3.2, and paragraphs SHALL NOT contain Word automatic list numbering attributes (`<w:numPr>`).

#### Scenario: Section 3 Single Sequence Enforcement
- **WHEN** generating Section 3 (Composition/Information on Ingredients)
- **THEN** all paragraph nodes in Section 3 SHALL NOT contain `<w:numPr>`
- **AND** the sequence numbers "3.1" and "3.2" SHALL each appear exactly once as physical text
- **AND** Word dynamic bullet/number generation SHALL NOT cause duplicate sequence display (`3.1 3.1` or `3.2 3.2`).

### Requirement: Sub-Label Value Rightward Indentation Hierarchy
Values corresponding to sub-labels SHALL indent further to the right than the sub-labels, creating a clear tree-like visual hierarchy.

#### Scenario: Sub-Label Value Indentation
- **WHEN** rendering value cells corresponding to sub-labels in Section 8 or Section 11
- **THEN** the value paragraph SHALL be formatted with an explicit left indentation (`w:ind w:left="240"`)
- **AND** the rendered value SHALL be visually shifted to the right relative to the parent-level values.

### Requirement: Universal Multi-Column Table Value Flush Left Alignment
In all 16 sections, multi-column tables with distinct columns SHALL have value cells aligned flush left without superfluous paragraph-level left indentations.

#### Scenario: Multi-Column Table Value Paragraph Left Indent Elimination
- **WHEN** a table row contains multiple distinct physical columns (`cells.length > 1`)
- **THEN** all content paragraphs in column index $\ge 1$ SHALL have their paragraph left indent `w:left` eliminated or set to 0
- **AND** the alignment SHALL be strictly flush left with the cell left margin
- **AND** no `w:left="240"` or extra paragraph indentation SHALL be injected

### Requirement: Section 2 Full-Width Narrative Hierarchical Indentation Preservation
Section 2 full-width narrative layout SHALL preserve its explicit multi-tier hierarchical indentation structure for value paragraphs under labels.

#### Scenario: Full-Width Narrative Indentation Integrity
- **WHEN** a table row is a single full-width cell (`cells.length === 1` or `gridSpan > 1`)
- **THEN** label paragraphs (e.g. 预防措施 / 事故响应) SHALL maintain their base indentation `s2BaseIndent`
- **AND** the corresponding action item value paragraphs SHALL maintain their hierarchical rightward indentation `s2SubValueIndent`
- **AND** the hierarchical narrative structure SHALL NOT be flattened or stripped

### Requirement: Section 14 Source-Sovereign Dynamic Reconstruction
Section 14 transport information SHALL be constructed dynamically based on source document facts, using the template strictly for formatting and layout scaffolding rather than forcing source facts into preset template labels.

#### Scenario: UN GHS Dangerous Goods Dynamic Construction
- **WHEN** the source document contains UN GHS dangerous goods elements (such as UN number, hazard class, packing group, environmental hazards, or special precautions)
- **THEN** the system SHALL dynamically construct standard itemized rows for all present facts (14.1 UN number, 14.2 UN proper shipping name, 14.3 Transport hazard class, 14.4 Packing group, 14.5 Environmental hazards, 14.6 Special precautions for user, 14.7 MARPOL 73/78 Annex II and IBC Code)
- **AND** the system SHALL apply template layout geometry (2800 dxa / 6981 dxa, 420 dxa hanging indent + `<w:tab/>` golden anchor, sequence font tokens, and flush-left value cells)
- **AND** the system SHALL NOT force UN GHS elements into template mode-of-transport rows (such as "公路和铁路运输")
- **AND** English variants SHALL mirror the Chinese itemized structure 1:1

### Requirement: Adaptive Sequence-Length Tiering and Dedicated 4-Digit Alignment
The system SHALL dynamically classify each section by its maximum sequence number character length, preserving the 3-digit golden anchor (420 dxa / 80.28pt) for standard sections while applying a dedicated 4-digit alignment anchor (560 dxa / 87.28pt) for sections containing 4-digit sequences.

#### Scenario: Tier A Standard 3-Digit Section Alignment Preservation
- **WHEN** a section contains maximum sequence numbers with length $\le 4$ characters or $\le 3$ digits (such as Section 8 `8.1`, Section 9 `9.1`~`9.24`, Section 10 `10.1`, Section 14 `14.1`~`14.7`)
- **THEN** the section SHALL maintain the standard golden anchor indentation of 420 dxa (`w:left="420"` and `w:hanging="420"`)
- **AND** all parent and child label texts SHALL vertically align at physical coordinate 80.28 pt
- **AND** no changes SHALL be introduced to these standard 3-digit sections

#### Scenario: Tier B Extended 4-Digit Section Dedicated Alignment and Comfortable Spacing
- **WHEN** a section contains sequence numbers with $\ge 4$ digits or character length $\ge 5$ (such as Section 11 containing `11.10` through `11.16`)
- **THEN** the section SHALL dynamically apply the dedicated extended anchor of 560 dxa (`w:left="560"` and `w:hanging="560"`)
- **AND** the gap between the longest sequence `11.15` and its label text SHALL be comfortable and uncrowded ($\ge 180$ dxa)
- **AND** all parent labels (`11.1` to `11.16`) and wrapped second-line label texts within the section SHALL vertically align at physical coordinate 87.28 pt
- **AND** multiple sections containing 4-digit sequences SHALL adopt identical 560 dxa geometry and vertically align with each other
