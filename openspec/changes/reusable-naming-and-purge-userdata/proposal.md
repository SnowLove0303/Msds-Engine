# Proposal: Reusable Output Naming Patterns & Purge Workflow/Core User-Data (`reusable-naming-and-purge-userdata`)

## Why
1. **Leftover "8 格式 / 4 份" Help & DocStrings**: `run_standard_production.mjs` (lines 101–103) and `production-orchestrator.js` (line 163) still mention `"8 格式"` and `"同步 4 份 DOCX / 4 份 PDF"`, contradicting the scenario-agnostic dynamic output matrix.
2. **Adversarial Scan Findings Across `web/src/`**: An exhaustive adversarial scan of `web/src/*.js` revealed remaining company/user-data references (`冠志`/`国彩`/`Guanzhi`/`Guocai`/`8 格式`/`4 份`) in `universal-editor-primitives.js` (2 hits), `production-orchestrator.js` (2 hits), `audit-planner.js` (10 hits), `editor-writer.js` (11 hits), `mcp-server.js` (11 hits), `msds-api-controller.js` (27 hits), `template-editor.js` (36 hits), `pipeline-engine.js` (45 hits), `main.js` (61 hits), `msds-db.js` (69 hits), and `docx-engine.js` (72 hits).
3. **Reusable User-Defined Output Naming Formats**: Currently `outputNamePattern` is an ephemeral CLI string; users need persistent, reusable naming pattern presets (e.g. `{docId}_{lang}_{preset}`, `{date}_{docId}_{lang}`, `{docId} - {preset} ({lang})`) stored in DB, managed via API, and selectable in the workflow.

## What Changes
1. **Reusable Naming Patterns (`msds-db.js` + `msds-api-controller.js` + `production-orchestrator.js` + Kit Runner)**:
   - Add `naming_patterns` table and CRUD helpers (`listNamingPatterns`, `saveNamingPattern`, `deleteNamingPattern`, `setDefaultNamingPattern`) in `web/src/msds-db.js` (with generic `{docId}_{lang}_{preset}` default, zero company names).
   - Expose `GET/POST/DELETE /api/msds/naming-patterns` and `POST /api/msds/naming-patterns/:id/default` in `web/src/msds-api-controller.js`.
   - Support `namingPatternId` / `--namingPatternId`, `--listNamingPatterns`, and `{date}` token in `formatDeliverableBaseName` + `production-orchestrator.js` + `run_standard_production.mjs`.
2. **Immediate Purge of Remaining Workflow & Universal-Primitive Hardcodings**:
   - Remove all `"8 格式"` / `"4 份"` strings from `run_standard_production.mjs` (both Kit folders) and `production-orchestrator.js`.
   - Remove `/广州冠志|英德国彩/i` company regex in `universal-editor-primitives.js:1008` (replace with generic entity-preset matching against `preset` fields).
   - Add `LINT-ORCH-PURE-01` & `LINT-PRIM-PURE-01` in `web/scripts/lint_code_invariants.mjs` to enforce 0 company/8-format hits in `production-orchestrator.js`, `universal-editor-primitives.js`, `render-utils.js`, and `run_standard_production.mjs`.
3. **Externalize Legacy Seed Data Notice**: Document the remaining `docx-engine.js` / `msds-db.js` / `main.js` / `template-editor.js` user-data inventory for follow-up phased extraction to `profiles/`.
