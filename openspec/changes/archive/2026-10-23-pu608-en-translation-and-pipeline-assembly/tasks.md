# Tasks

## 1. Translation Ingestion Engine & Template Cleansing

- [x] 1.1 Implement `parseTranslationDocx` in `web/src/pipeline-engine.js` to parse 16 sections from reference translation DOCX, and verify parsing output via test script
- [x] 1.2 Update `buildBaseEnglishEngine` in `web/src/pipeline-engine.js` to bind translation facts across all 16 sections and clean up template artifact `[F]` in Section 2 row 3
- [x] 1.3 Submit `pipeline-engine.js` changes for VS Code review via `review_diff_in_vscode` and confirm editor integration

## 2. English Assembly Pipeline Execution & QA Gates

- [x] 2.1 Run official MSDS assembly pipeline (`executeEightDeliverablesPipeline`) with PU-608 Chinese baseline and translation document
- [x] 2.2 Verify that all 5 QA gates (Gate 1~5: hanging indent, table topology, preambles conservation, zero-Chinese, revision date) pass with zero errors

## 3. Deliverables Verification & Audit

- [x] 3.1 Verify that English deliverables (`PU-608 msds_EN Guanzhi.docx`, `PU-608 msds_EN Guanzhi.pdf`, `PU-608 msds_EN Guocai.docx`, `PU-608 msds_EN Guocai.pdf`) are generated and completely valid in target directory
- [x] 3.2 Update CHANGELOG.md with problem analysis and solution, and produce final execution audit report
