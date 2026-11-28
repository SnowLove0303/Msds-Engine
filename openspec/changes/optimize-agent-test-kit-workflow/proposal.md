# Proposal: Optimize Agent Test Kit Standard Workflow (`optimize-agent-test-kit-workflow`)

## Why
1. **Duplicate Kit Directories**: Both `标准化流程/MSDS_Studio_Agent_Test_Kit` and `体系交接文档/MSDS_Studio_Agent_Test_Kit` exist with slight drift (`run_three_task_audit_prep.mjs` is missing in `标准化流程/`).
2. **Disconnected from New Universal L2 Engines**:
   - `run_standard_production.mjs` does not yet expose `--recognizeOnly` (L2 `recognizeDocumentUniversal` + `serializeUniversalToMarkdown`), `--buildTopology` (L2 `createTopologyPluginSlot` 9-layer bundle export), or `--template` / `--topology` injection.
   - `run_three_task_audit_prep.mjs` and `README_FOR_AGENT.md` still describe legacy Context 1/3 preparation without leveraging the purified L2 content recognizer (`recognizeDocumentUniversal` + `serializeUniversalToMarkdown`) for Task 1 (1:1 lossless content audit) and L2 `recognizeTemplateTopology` (9-layer completeness & parameter comparison) for Task 2 (topology audit).

## What Changes
1. **Upgrade `run_standard_production.mjs` (Unified Kit Entrypoint)**:
   - Add `--recognizeOnly` mode: runs L2 `recognizeDocumentUniversal` + `serializeUniversalToMarkdown` on `--source` and writes `<model>_universal_recognition.json` + `<model>_recognition_result.md` (1:1 faithful table/paragraph output).
   - Add `--buildTopology` & `--template=<path>` / `--topology=<bundleJson>` options: mounts arbitrary templates via `topology-plugin-slot.js` and exports/consumes `MsdsEngineStandardTopology` (9/9 completeness check).
2. **Upgrade `run_three_task_audit_prep.mjs`**:
   - Add `--universalAudit` (or enrich default prep) to run L2 `recognizeDocumentUniversal` on source & delivered DOCX for Task 1 content conservation and L2 `recognizeTemplateTopology` for Task 2 9-layer topology/parameter diffing.
3. **Sync Canonical Kit & Update `README_FOR_AGENT.md`**:
   - Synchronize `体系交接文档/MSDS_Studio_Agent_Test_Kit` and `标准化流程/MSDS_Studio_Agent_Test_Kit` so both have identical `run_standard_production.mjs`, `run_three_task_audit_prep.mjs`, and updated `README_FOR_AGENT.md` documenting the L2 universal recognition + 9-layer topology workflow.
4. **Add Integration Test (`web/tests/test_kit_unified_workflow.mjs`)**:
   - Verify `--recognizeOnly` on a test DOCX produces 1:1 Markdown + JSON, and `--buildTopology` produces a 9/9 `MsdsEngineStandardTopology` bundle.
