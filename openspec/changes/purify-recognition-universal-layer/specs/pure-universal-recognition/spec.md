# Pure Universal Recognition Specification

## ADDED Requirements

### Requirement: Zero Domain Hardcoding in L2 `recognition-engine.js`
`web/src/recognition-engine.js` SHALL contain zero `1..16` section limits, zero `SECTION_KEYWORDS` or chemical/company dictionaries, zero `parseSection1..16` functions, and zero imports from `smart-matching.js`; all MSDS-specific semantic parsing SHALL live in `web/src/msds-source-semantic-adapter.js`.

#### Scenario: `LINT-RECOG-PURE-01` verifies universal purity
- **WHEN** `npm run lint:code --prefix web` runs
- **THEN** `LINT-RECOG-PURE-01` SHALL verify `web/src/recognition-engine.js` is free of `SECTION_KEYWORDS`, `parseSection`, `smart-matching`, `GHS`, `CAS`, `冠志`, `国彩`, and `> 16` section caps.

#### Scenario: Existing callers continue working via L3 adapter
- **WHEN** `mcp-server.js`, `production-orchestrator.js`, and `test_recognition_engine.mjs` invoke `recognizeSourceDocx` or `serializeFactsToMarkdown` via `msds-source-semantic-adapter.js`
- **THEN** all existing tests and universal recognition tests SHALL pass with exit code `0`.
