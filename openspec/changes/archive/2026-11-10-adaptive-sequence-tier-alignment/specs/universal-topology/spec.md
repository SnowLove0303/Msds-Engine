## ADDED Requirements

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
