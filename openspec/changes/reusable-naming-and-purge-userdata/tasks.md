# Tasks: Reusable Naming Patterns & Purge Workflow/Primitive Hardcoding

- [ ] 1. Add `naming_patterns` table and CRUD functions (`listNamingPatterns`, `saveNamingPattern`, `deleteNamingPattern`, `setDefaultNamingPattern`) to `web/src/msds-db.js` and expose `/api/msds/naming-patterns` routes in `web/src/msds-api-controller.js`.
- [ ] 2. Integrate `fetchAvailableNamingPatterns`, `namingPatternId`, and `{date}` token into `web/src/production-orchestrator.js` and `run_standard_production.mjs` (`--listNamingPatterns`, `--namingPatternId`), and remove all `"8 格式"` / `"4 份"` strings from both files (syncing both Kit directories).
- [ ] 3. Remove `/广州冠志|英德国彩/i` hardcoding in `web/src/universal-editor-primitives.js` (line 1008) and add `LINT-ORCH-PURE-01` & `LINT-PRIM-PURE-01` to `web/scripts/lint_code_invariants.mjs`.
- [ ] 4. Add tests in `web/tests/test_standard_workflow_gates.mjs` for reusable naming pattern CRUD + `{date}` formatting, and run all tests, `npm run lint --prefix web`, and `openspec validate reusable-naming-and-purge-userdata --strict`.
