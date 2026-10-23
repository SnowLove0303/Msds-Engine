# Spec Delta

## Purpose

Provides standardized AI Agent skills and operational specifications for invoking MSDS Studio capabilities, orchestrating the four-stage generation pipeline, applying template clearing and anti-pollution controls, and performing source-to-output discrepancy audits.

## ADDED Requirements

### Requirement: Agent Skill Definition and Metadata
The system SHALL provide an AI Agent Skill definition (`SKILL.md`) equipped with standard YAML frontmatter, operational triggers, and comprehensive capability catalogs for MSDS Studio.

#### Scenario: Skill discovery and trigger matching
- **WHEN** an AI Agent searches for skills or receives instructions regarding MSDS processing, generation, or template editing
- **THEN** the system matches and loads the `msds-studio` skill with complete API specifications and execution SOPs.

### Requirement: Four-Stage Pipeline Invocation Contract
The system SHALL define the normative HTTP REST API invocation sequence for MSDS generation: Base Chinese assembly (`/api/msds/pipeline/base-chinese`), Base English translation (`/api/msds/pipeline/base-english`), entity preset derivation (`/api/msds/pipeline/derive-presets`), and batch export (`/api/msds/pipeline/batch-export` or `/api/msds/pipeline/run-all`).

#### Scenario: Automated end-to-end pipeline run
- **WHEN** an Agent calls `/api/msds/pipeline/run-all` or executes the four-stage pipeline step-by-step
- **THEN** the system generates synchronized Chinese and English documents and derives the 8-deliverable matrix without manual intervention.

### Requirement: Template Clearing and Anti-Pollution Governance
The system SHALL define clear operational constraints for "Clear Values", "Reset Template", and "Special Clear (with label modification)" to prevent baseline template residue from contaminating deliverables.

#### Scenario: Clear template during smart matching
- **WHEN** an Agent or user prepares a document for slot injection or structural matching
- **THEN** the system clears template values or applies special clearing to dynamic sections (Sections 2, 9, 10, 11, 12) before writing new content.

### Requirement: Source vs Output Discrepancy Audit Standard
The system SHALL enforce a 16-section discrepancy audit standard that compares source document facts against generated outputs and categorizes deviations into normative types.

#### Scenario: Verification against source document
- **WHEN** an Agent completes generation of a product model's MSDS
- **THEN** the Agent generates a 16-section audit ledger classifying differences as exact match, normative enhancement, structural reorganization, typographical correction, or template residue elimination.

### Requirement: Eight-Deliverable Deliverable Matrix Assurance
The system SHALL mandate that completed standard MSDS generation outputs four DOCX and four high-fidelity PDF documents covering Guanzhi and Guocai in both Chinese and English.

#### Scenario: Batch export deliverable verification
- **WHEN** batch export completes
- **THEN** the system verifies the presence and integrity of all 8 files (CN Guanzhi DOCX/PDF, CN Guocai DOCX/PDF, EN Guanzhi DOCX/PDF, EN Guocai DOCX/PDF).
