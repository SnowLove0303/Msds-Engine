# Standard Workflow Mechanical Gates Specification

## ADDED Requirements

### Requirement: Mechanical Requirement Confirmation Before Recognition
`produceStandardDeliverables` and `run_standard_production.mjs` SHALL block execution with `[WORKFLOW_REQUIREMENTS_CONFIRMATION_REQUIRED]` until `confirmRequirements: true` and explicit `presets`, `formats`, and `languages` selections are provided, and SHALL support fetching user presets from `/api/msds/presets` (with `msds-db.js` fallback).

#### Scenario: Block unconfirmed production run and expose available presets
- **WHEN** `produceStandardDeliverables` is called without `confirmRequirements: true` (or missing `presets`/`formats`/`languages`)
- **THEN** it SHALL reject with `[WORKFLOW_REQUIREMENTS_CONFIRMATION_REQUIRED]` instead of defaulting to hardcoded company presets or an 8-file matrix.

### Requirement: Context 1 Dual Artifacts (`JSON` + `1:1 MD`) and Enforced DOCX-to-PDF Order
After requirements are confirmed, Stage 2 SHALL write both `<MODEL>_context1_universal.json` and `<MODEL>_context1_recognition.md` via L2 `recognition-engine.js`, and whenever `pdf` is in `formats`, DOCX files SHALL be generated first and converted exclusively through `web/src/pdf-converter.js`.

#### Scenario: Emit Context 1 JSON + MD in `--prepareOnly` with confirmed requirements
- **WHEN** `produceStandardDeliverables` runs `--prepareOnly` with `confirmRequirements: true`, `presets`, `formats: ['docx', 'pdf']`, and `languages: ['zh', 'en']`
- **THEN** it SHALL write `<MODEL>_context1_universal.json`, `<MODEL>_context1_recognition.md`, and `<MODEL>_context2_review.md` before halting for Agent translation approval.
