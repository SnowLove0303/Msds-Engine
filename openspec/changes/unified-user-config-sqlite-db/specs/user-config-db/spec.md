# User Config SQLite Database Specification

## ADDED Requirements

### Requirement: Dedicated SQLite Persistence for Templates, Presets, and Naming Patterns
`web/src/user-config-db.js` SHALL persist `user_templates` (including raw DOCX bytes and built 9-layer `MsdsEngineStandardTopology` JSON), `user_presets`, and `user_naming_patterns` in SQLite (`node:sqlite`), with zero hardcoded company/user-data seeds.

#### Scenario: Persist template with 9-layer topology and bind preset + naming pattern
- **WHEN** a `.docx` template, a custom `user_preset` referencing it, and a custom `user_naming_pattern` are saved to `user-config-db.js`
- **THEN** they SHALL be retrievable by ID and listable with `topology` parsed, `completenessOk === true`, and zero hardcoded company names in the DB schema/seed.
