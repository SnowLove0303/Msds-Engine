# Tasks

## 1. Pipeline Engine Core Service

- [x] 1.1 Implement `web/src/pipeline-engine.js` encapsulating Base-CN, Base-EN, Preset Derivation, and Batch Export logic, and verify via VS Code review
- [x] 1.2 Mount `/api/msds/pipeline/*` routes (`base-cn`, `base-en`, `apply-presets`, `export-all`, `generate-eight`) in `web/src/msds-api-controller.js`, and verify via VS Code review

## 2. API Verification & Zero-Scripting Benchmark

- [x] 2.1 Add automated test `web/tests/test_pipeline_api.mjs` verifying step-by-step and atomic generation of EP-1702/EP-1704 deliverables via HTTP API
- [x] 2.2 Verify generated 8-format files match quality criteria (Zero Chinese in EN, 3-row Section 13, intact empirical CN values)
- [x] 2.3 Run smoke test suite and archive OpenSpec change strictly via `openspec archive`
