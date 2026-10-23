# Spec Delta: pipeline-four-stage-generation

## Purpose
Defines the formal API contract and behavior for the four-stage MSDS generation pipeline (`Base-CN` -> `Base-EN` -> `Preset Derivation` -> `Batch Export`), enabling automated zero-scripting delivery of eight-format documents.

## ADDED Requirements

### Requirement: Four-Stage MSDS Production Pipeline API Contract
The MSDS Studio server SHALL expose a four-stage pipeline API mounted under `/api/msds/pipeline/*` supporting both step-by-step invocation and atomic one-click execution.

#### Scenario: Stage 1 Base Chinese Establishment
- **WHEN** a client sends `POST /api/msds/pipeline/base-cn` with product model and source facts or ground-truth document path
- **THEN** the server returns `sessionId`, validated Chinese baseline facts, and caches the in-memory Base-CN engine

#### Scenario: Stage 2 Base English Derivation
- **WHEN** a client sends `POST /api/msds/pipeline/base-en` referencing the session from Stage 1
- **THEN** the server binds English facts into the locked English template with 23 physical property rows, zero Chinese residual characters, and zero template placeholder letters (`G~Q`, `AA~CC`)

#### Scenario: Stage 3 Preset Derivation
- **WHEN** a client sends `POST /api/msds/pipeline/apply-presets` with target preset IDs (e.g. `guocai`)
- **THEN** the server derives the corresponding entity-specific variants from Base-CN and Base-EN without mutating the base engines

#### Scenario: Stage 4 Batch Parallel Export
- **WHEN** a client sends `POST /api/msds/pipeline/export-all` with output destination or stream request
- **THEN** the server outputs 4 DOCX and 4 PDF files within 5 seconds using batch conversion, returning file paths, sizes, and validation summaries

### Requirement: Unified Atomic Eight-Deliverable Facade
The server SHALL expose `POST /api/msds/pipeline/generate-eight` that executes all four stages in a single deterministic atomic API call.

#### Scenario: Full Eight-Format Generation via Single Call
- **WHEN** a client posts model `EP-1702`, facts, and target directory to `/api/msds/pipeline/generate-eight`
- **THEN** exactly 8 files (4 DOCX + 4 PDF) are written to the target directory
- **THEN** the response reports `success: true` and all deliverables pass semantic and zero-Chinese verification
