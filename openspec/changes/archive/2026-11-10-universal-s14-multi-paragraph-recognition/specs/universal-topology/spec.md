# universal-topology Specification Deltas

## ADDED Requirements

### Requirement: Universal Multi-Paragraph Compressed Cell Parsing and Alignment
The recognition engine bottom layer SHALL universally parse multi-paragraph compressed table cells, establishing 1:1 or 1:N paragraph semantic bindings between multi-line label cells and multi-line value cells, and identifying sub-label parent-child hierarchy.

#### Scenario: Multi-Paragraph Cell 1:1 and 1:N Semantic Pairing
- **WHEN** a table row contains multiple paragraphs in column 0 and multiple paragraphs in column 1 (such as Section 14 where hazard class, packing group, environmental hazards, special precautions, additional info, and MARPOL are compressed into a single row)
- **THEN** the recognition engine SHALL iterate through paragraph nodes of column 0 and column 1
- **AND** for each label detected in column 0 paragraph $i$, the corresponding value in column 1 paragraph $i$ SHALL be bound to that label
- **AND** when a label in column 0 is followed by an empty paragraph while column 1 contains a non-empty continuation paragraph, the continuation text SHALL be appended to the current active label's value list
- **AND** when an unnumbered sub-label (such as `附加信息：` or `Additional information:`) directly follows a parent label (such as `14.6 特殊防范措施`), the engine SHALL classify it as a child item under the parent label.

### Requirement: Section 14.6 Precautionary Grounding and Sub-Label Separation
The system SHALL bind Section 14.6 Special precautions for user with its true primary value ("参见6-8节" / "See sections 6-8."), and SHALL render sub-labels (such as "附加信息：" / "Additional information:") as structured items with complete temperature control and separation facts preserved.

#### Scenario: Section 14.6 Primary Precaution and Additional Information Structure
- **WHEN** constructing Section 14 from source facts where special precautions contains both a primary cross-reference and additional information
- **THEN** row 14.6 `14.6 用户特殊防范措施：` / `14.6 Special precautions for user:` SHALL have its primary value cell populated with `参见6-8节` / `See sections 6-8.`
- **AND** the sub-label `附加信息：` / `Additional information:` SHALL be rendered with full preservation of its multi-line factual statements:
  - Line 1: `具可燃性。温度不可高于+35℃，温度不可低于-10℃。` / `Flammable. Temperature must not exceed +35°C and must not fall below -10°C.`
  - Line 2: `远离食物、酸和碱。` / `Keep away from food, acids and bases.`
- **AND** Chinese and English documents SHALL maintain identical 1:1 mirrored row and paragraph structure.
