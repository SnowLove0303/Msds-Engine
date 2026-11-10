## ADDED Requirements

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
