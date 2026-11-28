# Tasks: Standard Workflow Zero-Hardcoding & Mechanical Gates

- [ ] 1. Add `fetchAvailableUserPresets` (API `/api/msds/presets` + `msds-db.js` fallback), Stage 0 `[WORKFLOW_REQUIREMENTS_CONFIRMATION_REQUIRED]` mechanical gate (`confirmRequirements`, `presets[]`, `formats[]`, `languages[]`), and remove hardcoded `E:\冠志\...` in `web/src/production-orchestrator.js`.
- [ ] 2. Emit Context 1 dual artifacts (`<MODEL>_context1_universal.json` + `<MODEL>_context1_recognition.md`) via L2 `recognition-engine.js` in `production-orchestrator.js`, enforce Agent translation gate when `en` is requested, and enforce DOCX -> `pdf-converter.js` order whenever `pdf` is requested.
- [ ] 3. Update `run_standard_production.mjs` and `README_FOR_AGENT.md` in both Kit directories to support `--listPresets`, `--presets`, `--formats`, `--languages`, `--confirmRequirements`, and `--apiBase`.
- [ ] 4. Add `web/tests/test_standard_workflow_gates.mjs` verifying Gate 0 rejection, preset fetching, Context 1 dual JSON+MD emission, and run all tests, `npm run lint --prefix web`, and `openspec validate standard-workflow-zero-hardcoding-v2 --strict`.
