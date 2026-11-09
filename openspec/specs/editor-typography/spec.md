# editor-typography Specification

## Purpose
TBD - created by archiving change editor-level-typography-and-section8-invariants. Update Purpose after archive.

## Requirements

### Requirement: 英文版带序号标签与未编号标签制表位对齐 (REQ-01)
The system SHALL ensure that in English MSDS documents, numbered labels (e.g., `1.3  Supplier information:`) and unnumbered labels (e.g., `Name of supplier:`) strictly align on the 420 twips (or 565 twips for Section 11) horizontal baseline, with no oversized gap.

#### Scenario: 英文版第一列标签在 Word 中垂直严格对齐
- **WHEN** the engine processes English label cells in table column 0
- **THEN** it SHALL inject matching `<w:tabs><w:tab w:val="left" w:pos="420"/></w:tabs>` (or 565 for Section 11) and `<w:ind w:left="420" w:hanging="420"/>` into `w:pPr`
- **AND** the numbered run SHALL contain only `seqStr` followed immediately by `<w:tab/>` without extra trailing spaces
- **AND** unnumbered labels SHALL have `<w:ind w:left="420"/>` so their text begins at the identical 420 twips baseline.

### Requirement: Section 8 题头格式保护与 PPE 子标签缩进一致性 (REQ-02)
The system SHALL preserve Section 8.1 and 8.2 as bold section subheadings, prevent them from degrading to 9.5pt normal text, maintain consistent 420 twips indentation across all PPE items including `Recommendation:`, and normalize all corrupted dashes.

#### Scenario: Section 8.1 与 8.2 题头格式保持
- **WHEN** processing Section 8 rows with subheadings such as `8.1 Exposure controls:` or `8.2 Engineering controls:`
- **THEN** it SHALL keep them left-aligned without hanging indentation, styled with 10.5pt Bold / 12pt Bold Arial/Times New Roman
- **AND** it SHALL NOT delegate them to single-cell body row formatting or reduce font size to 9.5pt.

#### Scenario: Section 8 PPE 子标签缩进与乱码清洗
- **WHEN** formatting PPE sub-labels under Section 8
- **THEN** `Recommendation:` SHALL receive the standard 420 twips left indentation matching all other PPE labels
- **AND** all corrupted dash characters in labels like `Fluororubber C FKM:` SHALL be normalized to `Fluororubber - FKM:`.

### Requirement: 底层防篡改源码封印与主审计硬门禁 (REQ-03)
The system SHALL lock down typography logic with code invariant locks and enforce exit code 0 automated assertions in the master audit script.

#### Scenario: 自动化主审计一票否决
- **WHEN** running `node web/scripts/run_master_msds_audit.mjs`
- **THEN** it SHALL assert that numbered labels have valid 420 twips tabs, unnumbered labels have 420 twips indents, Section 8.1 is bold subheading without hanging indent, `Recommendation:` is indented 420 twips, and no dash mojibake exists
- **AND** any assertion failure SHALL immediately exit with non-zero code.
