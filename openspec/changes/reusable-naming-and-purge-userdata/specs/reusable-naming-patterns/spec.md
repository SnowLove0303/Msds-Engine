# Reusable Naming Patterns and Workflow Purity Specification

## ADDED Requirements

### Requirement: Persistent Reusable Output Naming Patterns
The system SHALL allow users to create, list, set default, and delete reusable output filename pattern presets in SQLite (`msds-db.js`) and via REST API (`/api/msds/naming-patterns`), and SHALL apply the selected `namingPatternId` or `outputNamePattern` during `produceStandardDeliverables`.

#### Scenario: Create and reuse a custom naming pattern
- **WHEN** a user saves a naming pattern `{date}_{docId}_{lang}_{preset}` via `saveNamingPattern` and passes its `namingPatternId` to `formatDeliverableBaseName` / `produceStandardDeliverables`
- **THEN** the generated deliverable filename SHALL expand `{date}`, `{docId}`, `{lang}`, and `{preset}` accordingly.

### Requirement: Zero User-Data or 8-Format Hardcoding in Workflow & Primitives
`production-orchestrator.js`, `universal-editor-primitives.js`, and `run_standard_production.mjs` SHALL contain zero references to `8 格式`, `4 份`, `冠志`, `国彩`, `Guanzhi`, or `Guocai`, enforced by `lint_code_invariants.mjs`.

#### Scenario: Lint verifies workflow and primitives purity
- **WHEN** `npm run lint:code --prefix web` executes
- **THEN** `LINT-ORCH-PURE-01` and `LINT-PRIM-PURE-01` SHALL verify zero user-data or fixed-matrix hits in those files.
