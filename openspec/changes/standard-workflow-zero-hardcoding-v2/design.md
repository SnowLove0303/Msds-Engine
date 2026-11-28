# Design: Mechanical Gates for Standard Workflow

```text
[Source DOCX]
   │
   ▼
[Stage 0: Requirement Confirmation Gate (Mechanical Lock)]
   - Fetch presets via GET /api/msds/presets (or msds-db listPresets)
   - Require confirmed: presets[] (multi), formats[] (docx/pdf), languages[] (zh/en)
   - Block with [WORKFLOW_REQUIREMENTS_CONFIRMATION_REQUIRED] if unconfirmed
   │
   ▼
[Stage 1: L2 Universal Recognition -> Context 1 Dual Artifacts]
   - recognizeDocumentUniversal() -> <MODEL>_context1_universal.json
   - serializeUniversalToMarkdown() -> <MODEL>_context1_recognition.md
   │
   ▼
[Stage 2: Context 1 MD -> Context 2 Governance & Agent Translation]
   - If languages includes 'en': assist with TM/mapping + require Agent proofreading (--prepareOnly -> --approveContext2)
   │
   ▼
[Stage 3: Parameterized Output & Enforced PDF Gate]
   - Generate DOCX per selected presets[] x languages[]
   - If formats includes 'pdf': MUST invoke web/src/pdf-converter.js after DOCX generation (never bypass)
```
