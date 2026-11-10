# universal-topology Delta Specification

## MODIFIED Requirements

### Requirement: Section 2 Pure Full-Width Container (Zero Inner Dashed Borders)
Section 2 SHALL render visually as a single unified full-width card container, with internal horizontal borders set to none, and global border enforcement SHALL exempt Section 2 from injecting inner dotted/dashed lines.

#### Scenario: Section 2 Seamless Full-Width Block
- **WHEN** rendering Section 2 split across multiple rows for cross-page breaking
- **THEN** the internal horizontal borders between adjacent rows inside Section 2 SHALL be set to `w:val="none"`
- **AND** the engine SHALL NOT inject `dotted`, `dashed`, or visible internal borders between Section 2 rows
- **AND** the outer table borders SHALL remain standard solid borders to enclose the full-width block cleanly
- **AND** global border enforcement functions SHALL exempt Section 2 from injecting inner dotted/dashed lines.

## ADDED Requirements

### Requirement: Global Sequence, Label, and Value Typography Invariant
The system bottom layer SHALL enforce uniform font family, font size, and font weight across all 16 sections according to the statutory sequence/label/value topology model.

#### Scenario: All 16 Sections Chinese Documents
- **WHEN** formatting any table cell in Chinese documents across Section 1 through Section 16
- **THEN** sequence numbers and labels in column 0 SHALL be formatted as 12pt (`sz="24"`) SimSun Bold with Times New Roman for ASCII characters (exempting Section 9 sequence numbers at 10.5pt `sz="21"` for laser vertical alignment)
- **AND** all value cells (column 1 and subsequent data columns) SHALL be formatted as 12pt (`sz="24"`) regular font weight (`bold: false`).

#### Scenario: All 16 Sections English Documents
- **WHEN** formatting any table cell in English documents across Section 1 through Section 16
- **THEN** sequence numbers and labels in column 0 SHALL be formatted as 9.5pt (`sz="19"`) Arial Bold
- **AND** Section 8 small labels SHALL NOT be enlarged to 12pt (`sz="24"`)
- **AND** all value cells (column 1 and subsequent data columns) SHALL be formatted as 9.5pt (`sz="19"`) Arial regular font weight (`bold: false`).

### Requirement: Label Wrap Hanging Indent Alignment
When label text wraps to multiple lines, the first character of the second and subsequent lines SHALL always vertically align with the first character of the first line.

#### Scenario: Label with Sequence Number Wrapping
- **WHEN** a label cell contains a sequence number and label text that wraps to multiple lines
- **THEN** the paragraph SHALL be configured with hanging indentation (`w:ind w:left="420" w:hanging="420"`)
- **AND** a tab stop anchor SHALL position the first character of the label text at horizontal position 420 dxa
- **AND** the first character of the second line SHALL start at horizontal position 420 dxa, vertically aligned with the first line label text.

#### Scenario: Pure Label Without Sequence Number Wrapping
- **WHEN** a label cell contains no sequence number and wraps to multiple lines
- **THEN** the paragraph SHALL NOT have asymmetric first-line indentation (`firstLine="482"` stripped)
- **AND** the second line first character SHALL align with the first line first character.
