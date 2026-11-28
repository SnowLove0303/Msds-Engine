# Spec: Anti-Drift Provenance Gate

## ADDED Requirements

### Requirement: Canonical Entrypoint Convergence
The system documentation (`AGENTS.md`, `.agents/skills/msds-studio/SKILL.md`, `README_FOR_AGENT.md`) SHALL designate `run_standard_production.mjs` as the single canonical production runner for full MSDS production, with `msds_mcp_gateway.mjs` designated strictly as the underlying atomic MCP tool gateway.

#### Scenario: Documentation references a single canonical production runner
- **WHEN** an Agent reads `AGENTS.md`, `SKILL.md`, or `README_FOR_AGENT.md`
- **THEN** `run_standard_production.mjs` is declared as the sole canonical production runner and direct ad-hoc pipeline scripts are marked deprecated.

### Requirement: Execution Provenance Ledger
The standard production runner SHALL generate and update `<targetDir>/.run_manifest.json` with SHA-256 hashes for `PHASE_1_CONTEXT1`, `PHASE_2_CONTEXT2`, `PHASE_5_EXPORT`, and every exported DOCX/PDF deliverable.

#### Scenario: Standard runner records full provenance chain
- **WHEN** `run_standard_production.mjs` executes Phases 1 through 6
- **THEN** `.run_manifest.json` is written to `targetDir` with SHA-256 fingerprints for all required phases and deliverables.

### Requirement: Provenance and Anti-Adhoc-Script Audit Gate
`auditPhase0Provenance` in `web/src/staged-mechanical-audit.js` SHALL reject any target directory missing a valid `.run_manifest.json`, containing deliverables whose SHA-256 mismatches the manifest, or containing unauthorized ad-hoc script files (`.mjs`, `.js`, `.py`, `.ps1`, `.sh`).

#### Scenario: Bypassed output or ad-hoc script triggers CRITICAL block
- **WHEN** `auditPhase0Provenance` runs on a directory without `.run_manifest.json`, with tampered deliverable hashes, or with ad-hoc `.py`/`.mjs` scripts
- **THEN** it returns `ok: false` with `P0_PROVENANCE_CHAIN` or `P0_NO_ADHOC_SCRIPTS` CRITICAL findings.
