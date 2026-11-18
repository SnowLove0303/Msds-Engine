# Specification: Repository Synchronization & Workflow Release

## ADDED Requirements

### Requirement: SPEC-SYNC-01 Comprehensive Asset and Workflow Ingestion
The system SHALL ingest and track all MSDS Studio engineering assets, including core typography and parsing engines, workflow definitions (v9.0-ENTERPRISE SOP), agent configurations, unit/regression test suites, OpenSpec capabilities, and methodology handover documents.

#### Scenario: Workflow and core engine inclusion
- **WHEN** preparing the repository for release
- **THEN** the system ensures `.agents/skills/msds-studio/SKILL.md` is updated to the latest v9.0-ENTERPRISE specification and all core engine modules (`docx-engine.js`, `pipeline-engine.js`, `smart-matching.js`, `cas-validator.js`, `production-orchestrator.js`) are fully tracked.

#### Scenario: OpenSpec capabilities synchronization
- **WHEN** synchronizing specifications
- **THEN** the system includes all OpenSpec changes and active capability specs (including `cas-audit`) in the repository.

### Requirement: SPEC-SYNC-02 Strict Deliverables and Cache Exclusion
The system SHALL strictly exclude all concrete model-specific output deliverables (e.g. `*.pdf`, `* msds_CN *.docx`, `* msds_EN *.docx`, `算法训练材料/`, `识别结果/`) and temporary web runtime session directories (`temp_sessions/`) from git tracking.

#### Scenario: Deliverable ignore enforcement
- **WHEN** running `git status` or staging files
- **THEN** no model deliverable binary or document (Word/PDF) is staged, maintaining zero repository pollution.

#### Scenario: Temporary runtime cache suppression
- **WHEN** editor sessions produce temporary session documents
- **THEN** `.gitignore` blocks `temp_sessions/` from being tracked.

### Requirement: SPEC-SYNC-03 Structured Git Staging and Conventional Commit
The system SHALL organize all unstaged modifications and valid untracked engineering files into structured commits following the Conventional Commits standard.

#### Scenario: Staging verification
- **WHEN** staging engineering files
- **THEN** all core engines, scripts, tests, and documentation are added while respecting exclusion invariants.

#### Scenario: Atomic commit generation
- **WHEN** creating git commits
- **THEN** clear, descriptive commit messages summarizing the encompassed capabilities are recorded.

### Requirement: SPEC-SYNC-04 Remote Push and Bi-Directional State Verification
The system SHALL push the local branch to the authoritative GitHub remote (`origin/main`) and verify that the remote branch is in 100% synchronization with the local repository.

#### Scenario: Successful remote push
- **WHEN** executing `git push origin main`
- **THEN** the command returns exit code 0 and all commits are accepted by the remote.

#### Scenario: Branch synchronization assertion
- **WHEN** checking git status after push
- **THEN** `git status` reports that the local branch is up to date with `origin/main` and the working tree is clean (except for ignored deliverables).
