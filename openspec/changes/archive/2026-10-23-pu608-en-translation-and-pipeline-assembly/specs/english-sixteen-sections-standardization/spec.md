# Spec Delta: english-sixteen-sections-standardization

## MODIFIED Requirements

### Requirement: English MSDS Zero Chinese and Zero Placeholder Verification
All generated English MSDS documents (EN 冠志, EN 国彩) SHALL NOT contain any Chinese characters in table cells, document body, headers, or footers. The generation pipeline SHALL eradicate all template placeholder letters (including `F`, `G, H, I, K, L, M, N, O, P, Q` and `AA, BB, CC`).

#### Scenario: Verification of zero Chinese characters in English document
- **WHEN** an English MSDS document is compiled and audited
- **THEN** regex check `/[\u4e00-\u9fa5]/` across all records and headers yields 0 matches

#### Scenario: Verification of zero template placeholder letters
- **WHEN** auditing Section 2 and Section 11 of an English MSDS
- **THEN** all placeholder letters (`F`, `G~Q`, `AA~CC`) are completely deleted or overwritten with validated English facts

## ADDED Requirements

### Requirement: English MSDS Reference Translation Document Ingestion
The document generation pipeline SHALL support ingesting an expert reference translation document (`对照翻译.docx` or parsed translation dictionary) when generating English MSDS deliverables. When provided, the translation facts SHALL override fallback translations across all 16 sections (including S1 product usage, S2 reproductive toxicity and precautionary statements, S4-S8 controls, S9 full properties, S10-S12 endpoints, and S13-S16 regulatory terms) while preserving the official template geometry, 420 dxa hanging indents, and table alignments.

#### Scenario: Reference translation ingestion for PU-608 English deliverables
- **WHEN** executing English MSDS pipeline with `对照翻译.docx`
- **THEN** Section 1.2 is bound to `Industrial applications in metal coatings, porous flooring, paper coatings, wood coatings, and leather finishing.`
- **THEN** Section 2 contains Danger signal word, H360 hazard statement, and full P201~P501 precautionary statements
- **THEN** Section 9 contains all 23 properties matching the source translation
- **THEN** Section 11 contains NMP toxicological preamble and endpoints
- **THEN** Section 12 contains rainbow trout ecotoxicity data
- **THEN** both Guanzhi EN and Guocai EN deliverables pass all 5 QA gates
