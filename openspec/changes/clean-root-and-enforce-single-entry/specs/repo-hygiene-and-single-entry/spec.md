# Repo Hygiene and Single-Entry Specification

## ADDED Requirements

### Requirement: Clean Root & `web/` Root Allowlist
Repository root and `web/` root SHALL contain only sanctioned configuration, governance, launcher, and entrypoint files; all historical one-off scripts SHALL be archived under `archive/legacy-scripts/web/` and specialized reports under `docs/`.

#### Scenario: Lint blocks stray ad-hoc scripts in root or `web/` root
- **WHEN** `npm run lint:code --prefix web` runs
- **THEN** `LINT-ROOT-HYGIENE-01` SHALL verify that no unallowlisted `.js`, `.mjs`, or `.py` scripts exist in repo root or `web/` root, exiting non-zero if any stray script is found.

#### Scenario: Unified entrypoints remain intact after cleanup
- **WHEN** the cleanup completes
- **THEN** `web/server.mjs`, `web/index.html`, `web/package.json`, `web/src/*`, `web/tests/*`, and `标准化流程/run_standard_production.mjs` SHALL remain functional and pass all tests and lint checks.
