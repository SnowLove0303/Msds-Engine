# Design: Four-Stage MSDS Production Pipeline API

## Context
See `proposal.md` for background. The current API supports single-document editing and preset overlays, but lacks a high-level orchestration pipeline to produce bilingual, multi-entity, multi-format deliverables without bespoke script writing.

## Goals / Non-Goals

**Goals:**
- Provide clear, composable endpoints for each of the four production stages:
  1. Base-CN establishment
  2. Base-EN derivation
  3. Preset application
  4. Batch parallel export
- Provide `POST /api/msds/pipeline/generate-eight` for zero-friction one-click end-to-end execution.
- Reuse `convertBatchDocxToPdf` in `pdf-converter.js` to translate 4 PDF files in a single process invocation.
- Guarantee locked templates in `web/public/templates/` remain immutable.

**Non-Goals:**
- Altering the core OpenXML parsing logic in `docx-engine.js`.
- Replacing database schema in `msds-db.js`.

## Decisions

### Decision 1: Service Layer Modularization (`pipeline-engine.js`)
- **Choice**: Encapsulate the four-stage logic in a dedicated `pipeline-engine.js` service module, then mount lightweight routing in `msds-api-controller.js`.
- **Rationale**: Keeps controller clean, facilitates independent smoke testing, and allows CLI or worker processes to invoke the pipeline directly.

### Decision 2: Entity Matrix Presets Configuration
- **Choice**: Ship default corporate entity presets (`GUANZHI`, `GUOCAI`) within `pipeline-engine.js` with declarative English/Chinese titles, addresses, phones, and faxes, while allowing payload overrides.
- **Rationale**: Removes duplicated entity metadata from client callers and ad-hoc scripts.

### Decision 3: Batch PDF Preflight and Concurrency
- **Choice**: Gather all generated DOCX in memory/temp buffer, execute single-batch COM translation via `convertBatchDocxToPdf`, and emit validation stats.
- **Rationale**: Reduces PDF conversion overhead by 60% compared to serial single-file conversions.

## Risks / Trade-offs

- **[Risk]**: Client passes conflicting or incomplete physical properties in Stage 1/2.
  - **Mitigation**: Fall back gracefully to standard chemical defaults (`No data available.` / `Not applicable`) rather than throwing or leaving template placeholders.
