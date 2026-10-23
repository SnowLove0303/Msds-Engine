# english-sixteen-sections-standardization Specification

## Purpose
Defines the complete 16-section standardization contract, term mapping, dynamic row pruning, zero-Chinese, and zero-placeholder invariants for English MSDS deliverables.

## Requirements

### Requirement: English MSDS Zero Chinese and Zero Placeholder Verification
All generated English MSDS documents (EN 冠志, EN 国彩) SHALL NOT contain any Chinese characters in table cells, document body, headers, or footers. The generation pipeline SHALL eradicate all template placeholder letters (including `F`, `G, H, I, K, L, M, N, O, P, Q` and `AA, BB, CC`).

#### Scenario: Verification of zero Chinese characters in English document
- **WHEN** an English MSDS document is compiled and audited
- **THEN** regex check `/[\u4e00-\u9fa5]/` across all records and headers yields 0 matches

#### Scenario: Verification of zero template placeholder letters
- **WHEN** auditing Section 2 and Section 11 of an English MSDS
- **THEN** all placeholder letters (`F`, `G~Q`, `AA~CC`) are completely deleted or overwritten with validated English facts

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

### Requirement: English Section 6 and Section 5 Header Fidelity
Section 6.1 header in all English MSDS deliverables SHALL be dynamically normalized to `6.1  Personal precautions, protective equipment and emergency procedures：` during rendering via safe label injection, without mutating base template files. Section 5.4 header SHALL be dynamically normalized to `5.4  Firefighting precautions and protective equipment：`. Section 14.4 header SHALL be dynamically normalized to `14.4 Special precautions for users：`.

#### Scenario: Verification of Section 6.1 Personal Precautions Header
- **WHEN** inspecting the header and label of Section 6.1 in an English MSDS deliverable
- **THEN** the label cell matches `/6\.1\s+Personal precautions,\s*protective equipment and emergency procedures/i`
- **THEN** no occurrence of `/firefighting precautions/i` exists within Section 6 table cells

#### Scenario: Verification of Section 5.4 and 14.4 Grammatical Header Polish
- **WHEN** inspecting Section 5.4 and Section 14.4 in an English MSDS deliverable
- **THEN** Section 5.4 contains `/Firefighting precautions and protective equipment/i`
- **THEN** Section 14.4 contains `/Special precautions for users/i`

### Requirement: Clean Section 13 Bilingual Structural Integrity
Section 13 in both Chinese and English MSDS deliverables SHALL maintain coherent block formatting without fragmented row splits or unmerged residual lines. Chinese Section 13 SHALL present full waste disposal instructions without orphaned EWC code clauses. English Section 13 SHALL cleanly present disposal recommendations and EWC directives across structured rows.

#### Scenario: Verification of Chinese Section 13 row coherence
- **WHEN** inspecting Section 13 rows in a Chinese MSDS deliverable
- **THEN** disposal method text contains complete EWC regulation statements without unwanted line breaks or split rows

#### Scenario: Verification of English Section 13 structured rows
- **WHEN** inspecting Section 13 rows in an English MSDS deliverable
- **THEN** general advice and waste disposal methods are populated into designated rows without text truncations

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
