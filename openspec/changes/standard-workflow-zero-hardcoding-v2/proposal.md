# Proposal: Zero-Hardcoding Standard Workflow with Mechanical Gates (`standard-workflow-zero-hardcoding-v2`)

## Why
Currently `web/src/production-orchestrator.js` and the Agent Test Kit (`run_standard_production.mjs`, `SKILL.md`, `README_FOR_AGENT.md`) still carry legacy workflow hardcodings:
1. **No Mechanical Requirement Confirmation Gate**: `produceStandardDeliverables` silently assumes a fixed 8-deliverable matrix (`Guanzhi/Guocai × CN/EN × DOCX/PDF`) and even hardcodes `E:\冠志\TDS MSDS (2)\...`, instead of fetching user presets via API (`/api/msds/presets` / DB) and mechanically blocking until the user confirms **presets (multi-select)**, **formats (`docx`, `pdf`, or both)**, and **languages (`zh`, `en`, or both)**.
2. **Incomplete Context 1 Dual Artifacts**: Stage 2 only runs `recognizeSourceDocx` in memory and does not emit the required Context 1 pair (`<MODEL>_context1_universal.json` + 1:1 `<MODEL>_context1_recognition.md`) to drive Context 2.
3. **PDF Bypass Risk**: When `pdf` is requested, the pipeline must mechanically enforce **DOCX first -> standard `pdf-converter.js` conversion** (never bypassing `pdf-converter.js`).
4. **Translation Governance**: When `en` is requested, Context 2 must combine mapping libraries (`translation-map.json` / `translation-memory.json`) with mandatory Agent contextual translation (never relying 100% on mechanical dictionary replacement).

## What Changes
1. **Stage 0 Mechanical Requirement Gate & API Preset Fetching (`production-orchestrator.js` + `run_standard_production.mjs`)**:
   - Add `fetchAvailableUserPresets({ apiBase })` (queries `GET /api/msds/presets` with `msds-db.js` `listPresets()` fallback) and `--listPresets`.
   - Require explicit `confirmRequirements: true` plus `presets[]`, `formats[]`, `languages[]` before running Context 1 -> Context 2 -> Output; otherwise throw `[WORKFLOW_REQUIREMENTS_CONFIRMATION_REQUIRED]` with the live preset list.
   - Remove hardcoded `E:\冠志\...` default path in `production-orchestrator.js`.
2. **Stage 1 Context 1 Dual Output (`JSON` + `1:1 MD`)**:
   - After requirements confirmation, run L2 `recognizeDocumentUniversal` + `serializeUniversalToMarkdown` and write `<MODEL>_context1_universal.json` and `<MODEL>_context1_recognition.md` as the canonical Context 1 inputs for Context 2.
3. **Stage 2/3 Parameterized Languages, Multi-Presets & Enforced DOCX -> `pdf-converter.js` Gate**:
   - Support arbitrary `presets[]`, `languages[]`, and `formats[]` combinations.
   - Whenever `formats` includes `pdf`, mechanically enforce DOCX generation first followed by `convertBatchDocxToPdf` / `convertDocxToPdf` from `web/src/pdf-converter.js`, recording `pdfConverterModule: 'web/src/pdf-converter.js'` in stage evidence.
   - Whenever `languages` includes `en`, enforce `--prepareOnly` -> Agent translation review -> `--approveContext2` gate (allowing mapping dictionary assistance without purely mechanical pass-through).
4. **Sync Kit Docs & Add Gate Tests**:
   - Update `README_FOR_AGENT.md` in both Kit directories and add `web/tests/test_standard_workflow_gates.mjs`.
