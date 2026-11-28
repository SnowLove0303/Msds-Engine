# Spec: Parameterized Audit and Externalized Dictionary

## ADDED Requirements

### Requirement: Template-Profile-Driven Mechanical Audit
`auditPhase1Context1` and `auditPhase2Context2` SHALL accept an optional `templateProfile` and validate section coverage and item invariants against `templateProfile.sections` when provided, defaulting to sections `1..16` when omitted.

#### Scenario: Custom 5-section template passes Phase 1 and Phase 2 audits
- **WHEN** `auditPhase1Context1` and `auditPhase2Context2` are invoked with a 5-section `templateProfile` and matching 5-section `context1`/`context2`
- **THEN** both return `ok: true` without requiring sections 6 through 16.

### Requirement: Externalized Base Translation Dictionary
`CHEMICAL_TRANSLATION_DICT` in `web/src/context-governor.js` SHALL be loaded from `web/src/base-translation-dict.json` and remain frozen for backward compatibility.

#### Scenario: Base translation dictionary loads from JSON
- **WHEN** `context-governor.js` is imported
- **THEN** `CHEMICAL_TRANSLATION_DICT` is a frozen non-empty object matching `web/src/base-translation-dict.json`.
