# Spec: Zero-Hardcoding Parameterized Engine

## ADDED Requirements

### Requirement: Parameterized Typography Extraction from Template
`recognizeTemplateTopology` SHALL extract `typographyProfile` (including `roles` font/size/bold/indent and `ruler` `tierA`/`tierB`) directly from any target DOCX template without hardcoding `420/560 dxa`, `16` sections, or `宋体/Arial` sizes.

#### Scenario: Custom template with 360/720 dxa and Calibri 10pt is extracted accurately
- **WHEN** `recognizeTemplateTopology` parses a custom 6-section DOCX using `Calibri` 10pt (`sz="20"`) and `360/720 dxa` indentation
- **THEN** the returned `typographyProfile` reflects `Calibri`, `sz="20"`, and `ruler` derived from the template rather than hardcoded defaults.

### Requirement: Zero-Hardcoding Editor and Parameterized Audit
`template-editor.js` and `staged-mechanical-audit.js` SHALL operate on dynamic template paths, externalized presets, `typographyProfile`, and `expectedDeliverables` without requiring `Guanzhi`/`Guocai` or an 8-deliverable matrix.

#### Scenario: Custom 6-section single-DOCX pipeline passes E2E execution and audit
- **WHEN** a 6-section custom template with a custom company preset `Acme` produces 1 DOCX
- **THEN** `auditPhase1Context1` and `auditPhase5DocxFiles` pass with `ok: true` using the custom `templateProfile` and `expectedDeliverables`.
