# Spec Delta

## Purpose
Defines the complete 16-section standardization contract, term mapping, dynamic row pruning, zero-Chinese, and zero-placeholder invariants for English MSDS deliverables.

## ADDED Requirements

### Requirement: English MSDS Zero Chinese and Zero Placeholder Verification
All generated English MSDS documents (EN 冠志, EN 国彩) SHALL NOT contain any Chinese characters in table cells, document body, headers, or footers. The generation pipeline SHALL eradicate all template placeholder letters (including `G, H, I, K, L, M, N, O, P, Q` and `AA, BB, CC`).

#### Scenario: Verification of zero Chinese characters in English document
- **WHEN** an English MSDS document is compiled and audited
- **THEN** regex check `/[\u4e00-\u9fa5]/` across all records and headers yields 0 matches

#### Scenario: Verification of zero template placeholder letters
- **WHEN** auditing Section 2 and Section 11 of an English MSDS
- **THEN** all placeholder letters (`G~Q`, `AA~CC`) are completely deleted or overwritten with validated English facts

### Requirement: English Header and Footer Physical XML Synchronization
The document generation pipeline SHALL invoke `updateHeaderFooterData` to physically rewrite `word/header1.xml`, `word/footer1.xml`, and the main `document.xml`. It SHALL NOT rely on in-memory object property assignments alone. The resulting headers and footers SHALL contain the target product model (e.g. `EP-1702` or `EP-1740`), official English company name, document code (`${modelCode}-MSDS`), English title (`MATERIAL SAFETY DATA SHEET`), and English revision date (`Revision Date: YYYY/MM/DD`).

#### Scenario: English Header and Footer XML Generation
- **WHEN** generating an English MSDS for model EP-1702 under entity Guanzhi
- **THEN** the left header contains `Guangzhou Guanzhi New Material Technology Co., Ltd.  EP-1702-MSDS`
- **THEN** the right header contains `Revision Date: 2026/10/10`
- **THEN** the header table contains the model `EP-1702` and all occurrences of template placeholder `PEA-4139` are replaced

### Requirement: English Physical Properties and Regulatory Standardization
Section 9 physical properties SHALL cover all standard SDS properties in English. The property label for solid content SHALL match `/Solid(?:s)?\s*content/i` and accurately reflect the product's solid content percentage. Any property without empirical data SHALL be marked `No data available.` or `Not applicable` rather than Chinese `无数据`. Section 15 SHALL replace all Chinese statute titles with official English translations (State Council Decree No. 591, GB/T 16483-2008, GB 13690-2009, GB 30000.2-29, GB 15258).

#### Scenario: English Solid Content Binding
- **WHEN** injecting physical properties for EP-1702 into English Section 9
- **THEN** row label `9.22 Solid content：` is matched and bound to `53±2%`
- **THEN** no empty or `No data available.` fallback is assigned to solid content

#### Scenario: English Regulatory List Injection
- **WHEN** injecting statutes into English Section 15
- **THEN** rows 4 through 8 contain official English titles of Chinese chemical safety standards without any Chinese characters
