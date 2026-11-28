# Scenario-Agnostic Standard Workflow Specification

## ADDED Requirements

### Requirement: Scenario-Agnostic Stage 6 Deliverable Audit
Stage 6 of `produceStandardDeliverables` SHALL audit every actual generated deliverable using L2 `recognizeDocumentUniversal` and L2 `recognizeTemplateTopology` (9/9 completeness) regardless of how many presets, languages, formats, or sections were selected, and SHALL NOT require 8 files or 16 sections unless `legacy8FormatAudit: true` is explicitly set.

#### Scenario: Single-preset single-language DOCX run passes Stage 6 audit
- **WHEN** `produceStandardDeliverables` runs with `presets: [presetId]`, `formats: ['docx']`, `languages: ['zh']`, `confirmRequirements: true`, `approveContext2: true`, and `skipAudit: false`
- **THEN** Stage 6 SHALL pass using universal content + 9-layer topology checks without failing on missing 8-format files.

### Requirement: Generic Document Identity & Arbitrary Languages
`produceStandardDeliverables` SHALL derive `documentId` from `documentId || modelCode || sourceStem` without forcing chemical model regexes, and SHALL accept any non-empty `languages` list.

#### Scenario: Accept non-chemical filename and custom language code
- **WHEN** `validateWorkflowRequirements` is called with `confirmRequirements: true`, `presets: ['none']`, `formats: ['docx']`, and `languages: ['ja']`
- **THEN** it SHALL succeed and return `{ presets: ['none'], formats: ['docx'], languages: ['ja'] }`.
