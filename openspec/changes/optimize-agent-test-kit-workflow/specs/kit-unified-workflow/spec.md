# Kit Unified Workflow Specification

## ADDED Requirements

### Requirement: Unified Kit CLI Modes for Universal Recognition & Topology Build
`run_standard_production.mjs` SHALL support `--recognizeOnly` (invoking L2 `recognizeDocumentUniversal` and `serializeUniversalToMarkdown`) and `--buildTopology` (invoking L2 `createTopologyPluginSlot`) in addition to the two-stage `--prepareOnly` / `--approveContext2` production flow.

#### Scenario: Run Kit `--recognizeOnly` on a source DOCX
- **WHEN** `node run_standard_production.mjs --recognizeOnly --source=<DOCX> --targetDir=<OUT>` is executed
- **THEN** it SHALL exit 0 and write both `<name>_universal_recognition.json` and 1:1 `<name>_recognition_result.md`.

#### Scenario: Run Kit `--buildTopology` on a template DOCX
- **WHEN** `node run_standard_production.mjs --buildTopology --template=<DOCX> --targetDir=<OUT>` is executed
- **THEN** it SHALL exit 0 and write `<name>_built_topology.json` with `completenessCheck.ok === true`.
