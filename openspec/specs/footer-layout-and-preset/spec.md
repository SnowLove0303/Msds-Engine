# footer-layout-and-preset Specification

## Purpose
Governs the layout, typography, and preset unification for MSDS document footers, ensuring vertical baseline alignment between entity and revision date, standard 9pt page numbers, and authoritative enterprise preset naming.

## Requirements

### Requirement: Guocai Entity Name Unification
The system SHALL unify the official enterprise name for Yingde Guocai in all preset definitions to "英德市国彩精细化工有限公司" in Chinese and "Yingde Guocai Fine Chemical Co., Ltd." in English.

#### Scenario: Chinese Guocai Deliverables Generation
- **GIVEN** a generation request using the Guocai Chinese preset (`preset_guocai_cn`)
- **WHEN** the MSDS document is compiled and rendered
- **THEN** Section 1 supplier name and the footer left cell SHALL display "英德市国彩精细化工有限公司"
- **AND** no occurrences of "英德市国彩新材料有限公司" SHALL exist in the output metadata or text.

#### Scenario: English Guocai Deliverables Generation
- **GIVEN** a generation request using the Guocai English preset (`preset_guocai_en`)
- **WHEN** the MSDS document is compiled and rendered
- **THEN** Section 1 supplier name and the footer left cell SHALL display "Yingde Guocai Fine Chemical Co., Ltd."
- **AND** no occurrences of "Yingde Guocai New Material Co., Ltd." SHALL exist.

### Requirement: Footer Revision Date Vertical Alignment Calibration
The system SHALL ensure that the revision date cell in the footer table is vertically aligned and shares the same baseline coordinate as the entity/model cell in Row 0, eliminating vertical Y-axis float.

#### Scenario: Vertical Center and Spacing Alignment
- **GIVEN** a document footer with a 2-column table in Row 0
- **WHEN** `updateHeaderFooterData` updates the revision date slot
- **THEN** the cell properties (`w:tcPr`) of the revision date cell SHALL contain `<w:vAlign w:val="center"/>` matching the left cell
- **AND** the paragraph properties (`w:pPr`) SHALL enforce `<w:spacing w:line="0" w:lineRule="atLeast"/>`
- **AND** the vertical baseline difference $|\Delta Y|$ between left entity text and right revision date text in rendered PDF SHALL be $\le 1.5\text{ pt}$.

### Requirement: Footer Page Number Font Size Correction
The system SHALL format dynamic page number runs and paragraphs to standard 9pt (Word 18 half-points) rather than hardcoded 12pt (Word 24 half-points).

#### Scenario: Dynamic Page Number Rendering
- **GIVEN** a document footer containing dynamic page number fields (`PAGE` / `NUMPAGES`)
- **WHEN** `updateHeaderFooterData` processes the footer
- **THEN** all run elements (`w:r`) within the page number paragraph SHALL have their font size set to 18 half-points (9pt)
- **AND** the paragraph properties (`w:pPr/w:rPr`) SHALL not enforce 24 half-points (12pt)
- **AND** the extracted font size of the page numbers in rendered PDF SHALL be 9.0 pt ($\pm 0.5\text{ pt}$).
