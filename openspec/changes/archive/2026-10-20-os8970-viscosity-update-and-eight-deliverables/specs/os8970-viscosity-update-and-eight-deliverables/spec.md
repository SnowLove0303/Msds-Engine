## ADDED Requirements

### Requirement: OS-8970 Viscosity Specification and Deliverables
The system SHALL update the viscosity specification in Section 9 of OS-8970 MSDS documents to `<1000 mPa·s` and produce the complete 8 deliverables matrix.

#### Scenario: Update Viscosity in Section 9
- **WHEN** processing OS-8970 Chinese and English variants
- **THEN** the viscosity field in Section 9 SHALL be set to `＜1000 mPa·s`
- **AND** the water solubility row formatting SHALL remain intact

#### Scenario: Eight Deliverables Production
- **WHEN** batch export is triggered for OS-8970
- **THEN** 4 DOCX files and 4 corresponding high-fidelity PDF files SHALL be produced
- **AND** all footers SHALL maintain left-aligned company names and untruncated revision dates
