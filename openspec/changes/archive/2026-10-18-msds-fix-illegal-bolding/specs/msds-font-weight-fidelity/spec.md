# Delta Specification: Font Weight Fidelity & Targeted Bolding Control

## ADDED REQUIREMENTS

### Requirement: Source Run Bold Fidelity
The system MUST respect the exact `run.bold` status of text runs as defined in source OOXML runs, strictly prohibiting unauthorized bolding (`font-weight: 700`) for text runs that are regular weight in the original document.

#### Scenario: Plain text paragraphs in Section 16, 11, 8, 3, 2 rendered in regular weight
- **GIVEN** an imported MSDS document containing non-bold text runs in Section 16 (disclaimers), Section 11 (toxicology notes), Section 8 (exposure limits and glove specifications), Section 3 (ingredient substance values), or Section 2 (hazard descriptions)
- **WHEN** the document is rendered in the structured table view
- **THEN** all such unbolded text runs MUST be rendered in regular weight (`font-weight: normal` or absence of `font-weight: 700`)
- **AND** they MUST NOT be forced into bold due to being in column 0 or a single-column row.

### Requirement: Preservation of Legitimate Bold Labels and Sequences
The system MUST continue to render legitimate bold text runs (such as source-bolded label titles `1.1 产品名称：`, `3.1 产品类型：`, `建议：`, Section 15 bold regulatory items, and Row 0 table titles) as bold (`font-weight: 700`), and all generated sequence run tags (`sequence-run`) MUST remain bold.

#### Scenario: Legitimate bold labels remain bold
- **GIVEN** a table row containing a legitimately bold label or sequence prefix
- **WHEN** the cell is rendered
- **THEN** the sequence prefix and bold label text retain `font-weight: 700`
- **AND** the dual vertical alignment layout is fully preserved.
