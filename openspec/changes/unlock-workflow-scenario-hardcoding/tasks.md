# Tasks: Unlock Workflow Scenario Hardcoding

- [ ] 1. Generalize `documentId`, `outputNamePattern`, arbitrary `languages`, and `presets: ['none']` in `web/src/production-orchestrator.js` (no forced `PU/PA` model regex or hardcoded 8-file matrix).
- [ ] 2. Implement universal Stage 6 audit (`runUniversalDeliverableAudit`) in `web/src/production-orchestrator.js` using L2 `recognizeDocumentUniversal` + `recognizeTemplateTopology` (9/9) + PDF signature check, gating legacy 8-format/16-section audits behind `legacy8FormatAudit: true`.
- [ ] 3. Add `--documentId`, `--outputNamePattern`, and `--legacy8FormatAudit` to `run_standard_production.mjs` and synchronize both Kit directories.
- [ ] 4. Extend `web/tests/test_standard_workflow_gates.mjs` to test arbitrary language/none-preset validation and a full Stage 6 (`skipAudit: false`) single-deliverable run, then run all tests, `npm run lint --prefix web`, and `openspec validate unlock-workflow-scenario-hardcoding --strict`.
