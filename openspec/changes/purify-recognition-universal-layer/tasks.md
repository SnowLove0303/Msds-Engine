# Tasks: Purify Recognition Module into L2 Universal Layer

- [ ] 1. Create `web/src/msds-source-semantic-adapter.js` (L3) containing the MSDS 16-section domain parser (`SEMANTIC_TYPES`, `SECTION_KEYWORDS`, `parseSection1..16`, `recognizeSourceDocx`, `serializeFactsToMarkdown`), calling `recognizeDocumentUniversal` from `recognition-engine.js`.
- [ ] 2. Strip all MSDS-specific hardcoding (`SECTION_KEYWORDS`, `1..16` loops/caps, `parseSection1..16`, `smart-matching.js` import) from `web/src/recognition-engine.js` so it becomes a 100% pure L2 universal recognizer.
- [ ] 3. Update `mcp-server.js`, `production-orchestrator.js`, `web/tests/test_recognition_engine.mjs`, and `web/tests/test_universal_recognition.mjs` imports cleanly.
- [ ] 4. Add `LINT-RECOG-PURE-01` to `web/scripts/lint_code_invariants.mjs` and run all tests, `npm run lint --prefix web`, and `openspec validate purify-recognition-universal-layer --strict`.
