# Tasks: Section 13 Three-Row Standard Structure and Non-Splitting

## 1. Core Matching Engine Refactoring
- [x] 1.1 Remove `addNoteRowAfter` call in `web/src/smart-matching.js` Section 13 handling
- [x] 1.2 Implement automatic reconciliation of legacy 4-row tables (delete rogue split row 2) in `web/src/smart-matching.js`
- [x] 1.3 Consolidate multi-line injection into `row1.cells[0]` and correct typo `必需遵守` to statutory `必须遵守` in `web/src/smart-matching.js`

## 2. Docx Engine & Render Utils Alignment
- [x] 2.1 Update Section 13 single-column value row detection regex in `web/src/docx-engine.js`
- [x] 2.2 Update Section 13 value-only paragraph detection regex in `web/src/render-utils.js`

## 3. Verification & Regression Validation
- [x] 3.1 Verify smart-matching on EP-1702 and EP-1740 generates strictly 3 rows in Section 13
- [x] 3.2 Run `openspec validate --all --strict` and ensure change proposal validates cleanly
- [x] 3.3 Regenerate standard deliverables and verify Section 13 layout fidelity
