# Proposal: PU-608 English MSDS Pipeline Assembly from Translation Document

## Why

The user provided a verified Chinese MSDS (`PU-608 msds_CN 冠志 手动导出.docx`) and an expert reference translation document (`对照翻译.docx`) for PU-608. In accordance with the system's "Exclusive Domain Engine Routing Axiom", English MSDS deliverables must be assembled strictly using MSDS Studio's editor engine and the locked official template (`正式模板_MSDS_EN_冠志(1).docx`), rather than ad-hoc document modifications. We need to enable the engine to ingest translation documents/facts and assemble high-fidelity English MSDS deliverables (both Guanzhi and Guocai) meeting all 5 hard quality gates.

## What Changes

- Add structured translation ingestion capability (`parseTranslationDocx` / `translationDocxPath` / `facts.customTranslations`) to extract 16-section translations directly from `对照翻译.docx`.
- Enhance `buildBaseEnglishEngine` in `pipeline-engine.js` to prioritize translation document facts for all 16 sections (including S1 product usage, S2 reproductive hazard & precautionary statements, S4-S8 controls, S9 full 23 properties, S10-S12 endpoints, and S13-S16 regulatory terms).
- Clean up residual template artifact `[F]` in Section 2 row 3 (`2.3 GHS Label Elements`).
- Execute the pipeline to produce the full set of English deliverables:
  - `PU-608 msds_EN Guanzhi.docx` and `PU-608 msds_EN Guanzhi.pdf`
  - `PU-608 msds_EN Guocai.docx` and `PU-608 msds_EN Guocai.pdf`
- Verify that 5 QA gates (Gate 1~5) all pass with zero errors and zero Chinese residue.

## Capabilities

### Modified Capabilities
- `english-sixteen-sections-standardization`: Extend English standardization to support ingesting section-level translated facts from reference translation documents, ensuring complete 16-section synchronization with verified human translations and elimination of template placeholder residuals.

## Impact

- `web/src/pipeline-engine.js`: Ingestion of translation document facts, Section 2 placeholder cleanup, Section 9 23-property mapping.
- `web/src/msds-api-controller.js`: Support optional `translationDocxPath` in pipeline endpoints.
- Deliverables directory: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\PU-608\`
