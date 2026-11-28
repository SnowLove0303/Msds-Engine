# Proposal: Unlock Workflow Scenario Hardcoding (`unlock-workflow-scenario-hardcoding`)

## Why
Even after adding Stage 0 requirement gates, `web/src/production-orchestrator.js` still locks execution to a single legacy scenario during Stage 1, Stage 4, and Stage 6:
1. **Stage 6 Audit Lock-In**: Unconditionally calls `runMasterMsdsAudit` (159-item 8-file audit), `runBipolarBilayerAudit` (8-file matrix), and `audit16SectionsBilingualFidelity` (16-section CN+EN pair). Any run with `< 8` deliverables (e.g., 1 preset × 1 language × DOCX only) or `!= 16` sections fails Stage 6!
2. **Product-Model & Naming Lock-In**: Forces `extractModelCodeFromPath` (`PU/PA` regex) and `${effectiveModel} msds_${langTag} ${safeLabel}.docx` instead of a generic `documentId` and configurable `outputNamePattern`.
3. **Language List Lock-In**: `validateWorkflowRequirements` artificially drops languages outside `['zh', 'en']`.

## What Changes
1. **Generic `documentId` & `outputNamePattern`**: Support `documentId` (defaulting to source filename stem) and `outputNamePattern` (default `{docId}_{lang}_{preset}`), keeping `modelCode` as an alias.
2. **Any-Language Support in `validateWorkflowRequirements`**: Accept any non-empty language code list (e.g., `zh`, `en`, `ja`, `de`, etc.) and any preset combination (including `'none'` for template-only runs).
3. **Universal Scenario-Agnostic Stage 6 Audit**:
   - Default Stage 6 audits **every actual produced deliverable** using L2 `recognizeDocumentUniversal` (content & table count conservation) + L2 `recognizeTemplateTopology` (9/9 completeness check) + PDF `%PDF-` header verification.
   - Legacy `runMasterMsdsAudit` / `runBipolarBilayerAudit` / `audit16SectionsBilingualFidelity` are gated behind opt-in `legacy8FormatAudit: true`.
4. **Update Kit Runner & Test Coverage**: Add `--documentId`, `--outputNamePattern`, `--legacy8FormatAudit` to `run_standard_production.mjs`, sync both Kit folders, and verify a single-deliverable arbitrary run passes Stage 6 audit (`skipAudit: false`)!
