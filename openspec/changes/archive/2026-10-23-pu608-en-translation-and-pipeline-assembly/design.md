# Design: PU-608 English MSDS Pipeline Assembly from Translation Document

## Context & Objectives

The user supplied two documents:
1. `PU-608 msds_CN 冠志 手动导出.docx`: Human-approved Chinese MSDS baseline.
2. `对照翻译.docx`: Complete, high-quality 16-section English translation reference for PU-608.

The system invariant requires all MSDS generation to go through MSDS Studio's editor engine and the locked official template (`正式模板_MSDS_EN_冠志(1).docx`). Ad-hoc python-docx or direct XML editing scripts are strictly prohibited.

## Architecture & Data Flow

```text
┌─────────────────────────────────┐       ┌───────────────────────────────┐
│ PU-608 msds_CN 冠志 手动导出.docx │       │         对照翻译.docx         │
└────────────────┬────────────────┘       └───────────────┬───────────────┘
                 │ (Chinese ground truth)                 │ (Human-verified translation)
                 ▼                                        ▼
┌─────────────────────────────────┐       ┌───────────────────────────────┐
│      buildBaseChineseEngine     │       │     parseTranslationDocx      │
│  - Loads CN template            │       │  - Extracts 16 sections       │
│  - Sets revision date           │       │  - Maps into translation facts│
└────────────────┬────────────────┘       └───────────────┬───────────────┘
                 │                                        │
                 └──────────────────┬─────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        buildBaseEnglishEngine                          │
│  1. Loads official English template: 正式模板_MSDS_EN_冠志(1).docx     │
│  2. Ingests translation facts for Sections 1 to 16                     │
│  3. Cleanses template artifact 'F' in S2 row 3                         │
│  4. Injects S9 23-property slot table with 420 dxa hanging indents     │
│  5. Preserves S11 & S12 double preambles and empirical endpoints       │
│  6. Runs healAllTableTopologies                                        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          derivePresetEngines                           │
│  - Generates Guocai preset English engine (enPresetEngine)             │
│  - Injects Yingde Guocai entity details                                │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        assertDeliverableQuality                        │
│  - Gate 1: S9 420dxa hanging indent, zero tabs                         │
│  - Gate 2: S11 topology 6262dxa width, gridSpan=3                      │
│  - Gate 3: S11 & S12 preambles count strictly 1:1                      │
│  - Gate 4: Zero Chinese characters in English deliverables             │
│  - Gate 5: Header/footer revision date adaptive synchronization        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ All Gates PASS
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        batchExportDeliverables                         │
│  - PU-608 msds_EN Guanzhi.docx & PU-608 msds_EN Guanzhi.pdf            │
│  - PU-608 msds_EN Guocai.docx & PU-608 msds_EN Guocai.pdf              │
└────────────────────────────────────────────────────────────────────────┘
```

## Detailed Component Specifications

### 1. `parseTranslationDocx(bufferOrPath)`
- Reads `word/document.xml` using `jszip`.
- Extracts paragraph texts and segments into sections by `### {N}. {Title}` headers.
- Parses key-value pairs or structured markdown bullet lists:
  - S1: Product Name, Chemical Classification, Relevant Identified Uses, Supplier info.
  - S2: 2.1 Classification, 2.2 Pictogram, 2.3 Signal Word, 2.4 Hazard Statements, 2.5 Precautionary Statements (Prevention, Response, Storage, Disposal), 2.6 Other Hazards.
  - S3: Product Type and Ingredients table (`Polyurethane dispersion`, `Deionized water`, `NMP`).
  - S4: 4.1 to 4.5 First Aid Measures.
  - S5: 5.1 to 5.4 Firefighting Measures.
  - S6: 6.1 to 6.3 Accidental Release Measures.
  - S7: Safe handling and storage conditions.
  - S8: Exposure controls, glove specs (FKM, IIR, NBR), eye and body protection.
  - S9: Full 23 physical-chemical properties.
  - S10: 10.1 to 10.3 Stability and Reactivity.
  - S11: Preambles 1 & 2, 11.1 to 11.10 Toxicological endpoints.
  - S12: Preambles 1 & 2, 12.1 Ecotoxicity (fish & daphnia/algae), 12.2 Degradability, 12.3 Other effects.
  - S13: General advice, disposal methods.
  - S14: 14.1 to 14.4 Transport classifications.
  - S15: Regulatory lists.
  - S16: Other information paragraphs.

### 2. Template Editor Clean Slate and Slot Binding
- Clean up Section 2 Row 3 template remnant:
  ```javascript
  const labelElemRow = s2.rows.find(r => /GHS Label Elements/i.test(r.cells[0]?.text || ''));
  if (labelElemRow && labelElemRow.cells[1]) {
    safeWriteCellValue(labelElemRow.cells[1], '');
  }
  ```
- For Section 9: Bind 23 properties directly into the template table rows, keeping hanging indents at 420 dxa.
- For Section 11 & 12: Ensure preambles match source count and endpoints are populated with English translation.
