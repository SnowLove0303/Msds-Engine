# universal-topology Delta Specification

## MODIFIED Requirements

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

## ADDED Requirements

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
