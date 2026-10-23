# Proposal: Four-Stage MSDS Production Pipeline API

## Why
Currently, generating eight-format MSDS deliverables across dual languages (CN/EN), dual corporate entities (Guanzhi/Guocai), and dual file formats (DOCX/PDF) requires writing bespoke node scripts for each product model. This change upgrades the MSDS Studio editor API into a structured four-stage production pipeline (`Base-CN` -> `Base-EN` -> `Preset Derivation` -> `Batch Export`), eliminating ad-hoc script authoring, preventing template corruption, and achieving sub-5-second end-to-end deliverables generation.

## What Changes
- **Four-Stage Pipeline Endpoints**:
  - `POST /api/msds/pipeline/base-cn`: Ingest raw source materials or bind existing authoritative ground truth to establish the validated Chinese baseline document.
  - `POST /api/msds/pipeline/base-en`: Derive the official English baseline from Base-CN facts into the locked English template with 23 standard physical properties, zero Chinese residual characters, and zero placeholder letters.
  - `POST /api/msds/pipeline/apply-presets`: Concurrently derive entity variants (e.g., Guocai Chinese and Guocai English) from Base-CN and Base-EN via modular entity presets.
  - `POST /api/msds/pipeline/export-all`: Orchestrate high-speed parallel DOCX writing and batch COM/LibreOffice PDF translation directly into target workspace folders or streamed zip packages.
- **Unified Pipeline Facade**: Provide `POST /api/msds/pipeline/generate-eight` to execute all four stages in a single deterministic atomic API call.
- **Zero Scripting Invariant**: Expose declarative JSON payload options so callers (Web UI, CLI, agents) never need to author or modify `.mjs` scripts to produce deliverables.

## Capabilities

### New Capabilities
- `pipeline-four-stage-generation`: Defines the formal contract, state transitions, payload schema, and verification invariants for the four-stage MSDS generation pipeline.

### Modified Capabilities
None.

## Impact
- Affected code: `web/src/msds-api-controller.js`, `web/src/pipeline-engine.js` (new service module)
- Affected endpoints: Mounted under `/api/msds/pipeline/*`
- Preserved assets: `web/public/templates/*` remain strictly read-only and unmutated
