# Tasks: Adaptive Full-Width Exemption Workflow & Four-Dimensional Deep Audit

## 1. Engine Source Feature Extraction & Exemption Elevation (`web/src/smart-matching.js`)

- [x] 1.1 In `web/src/smart-matching.js`, implement `extractSection3ExemptionNotes(record)` to parse tail exemption notes (neutralization salt, concentration, threshold) and attach to `facts.section3ExemptionNotes`.
- [x] 1.2 In `web/src/smart-matching.js`, implement `detectNonHazardousComposite(sourceEngine, facts)` to flag non-hazardous products containing extensive precautionary procedures and environmental risks (`facts.isNonHazardousComposite`).
- [x] 1.3 Ensure `parsePrecautionaryStatements()` in `web/src/smart-matching.js` extracts all 4-phase precautionary procedures without black-box truncation or premature omission.

## 2. Underlying OOXML Full-Width & Geometry Support (`web/src/docx-engine.js`)

- [x] 2.1 In `web/src/docx-engine.js`, implement `renderFullWidthRow(table, rowIdx, content, options)` injecting `<w:gridSpan w:val="2"/>`, width `9781 dxa`, and pure left alignment.
- [x] 2.2 In `web/src/docx-engine.js`, implement `enforceSection13DoubleCenter(cellNode)` injecting `<w:vAlign w:val="center"/>` and `<w:jc w:val="center"/>` for Section 13 Row 3 label cell.
- [x] 2.3 Verify `normalizeRowGeometry()` continues to safeguard 11.7 geometry (`6262 dxa`, `gridSpan="3"`, zero floating `vMerge`).

## 3. Pipeline Adaptive Assembly & Gate 9 (`web/src/pipeline-engine.js`)

- [x] 3.1 In `web/src/pipeline-engine.js`, remove hardcoded `while (s2.rows.length > 4) deleteRow` pruning logic.
- [x] 3.2 In `web/src/pipeline-engine.js`, implement `buildFullWidthSection2(engine, facts)`: assemble Section 2 into a single full-width cell incorporating GHS classification, elevated DMEA salt exemption notes, signal words, complete 4-phase precautionary procedures, and sewer clogging warnings, matching `PA-3223 手做改版材料.docx`.
- [x] 3.3 In `web/src/pipeline-engine.js`, implement `buildThreeTierSection11(engine, facts)`: assemble Section 11 into `[Disclaimer Row] -> [Preamble Row] -> [Component Details Full-Width Row]` isolating mixture liability from component experimental endpoints.
- [x] 3.4 In `web/src/pipeline-engine.js`, clean up Section 12 duplicate top-level disclaimer rows, preserving standard structure (12.1~12.3).
- [x] 3.5 In `web/src/pipeline-engine.js`, add Gate 9 (Semantic Fact Conservation) to `assertDeliverableQuality`: verify that prevention, response, storage, disposal, sewer hazard, and salt exemption facts from source document are 100% present in the output deliverable.

## 4. Four-Dimensional Deep Audit Tooling & Automated Regression Testing

- [x] 4.1 Create standalone deep audit tool `web/scripts/run_four_dimensional_audit.mjs` verifying Dimension 1 (Content Fidelity), Dimension 2 (OOXML Geometry), Dimension 3 (Legal Topology), and Dimension 4 (Deliverables & Retention).
- [x] 4.2 Write automated regression test `web/tests/test_adaptive_fullwidth_pa3223.mjs` executing PA-3223 matching and pipeline assembly, verifying exit code 0 on all Gate 1~9 checks and four-dimensional audit.

## 5. UI Zero-Mutation Verification & Acceptance

- [x] 5.1 Confirm that `web/src/styles.css` and `web/index.html` have 0 bytes of change.
- [x] 5.2 Verify in `http://127.0.0.1:5173/` that the Web Editor natively renders the full-width Section 2 and Section 11 without layout disruption, visual distortion, or broken controls.
- [x] 5.3 Submit all diffs for VS Code Review via `review_diff_in_vscode`, run `openspec validate --all`, and submit deliverables for final human acceptance.
