# Tasks: Optimize Agent Test Kit Standard Workflow

- [ ] 1. Upgrade `run_standard_production.mjs` to support `--recognizeOnly` (L2 `recognizeDocumentUniversal` + `serializeUniversalToMarkdown`), `--buildTopology` (L2 `createTopologyPluginSlot`), and `--template` / `--topology` parameters.
- [ ] 2. Upgrade `run_three_task_audit_prep.mjs` to generate L2 universal content + 9-layer topology comparison JSON/MD inputs for Task 1 (content audit) and Task 2 (topology audit).
- [ ] 3. Synchronize `体系交接文档/MSDS_Studio_Agent_Test_Kit` and `标准化流程/MSDS_Studio_Agent_Test_Kit` (including updated `README_FOR_AGENT.md`).
- [ ] 4. Add `web/tests/test_kit_unified_workflow.mjs` and run all tests, `npm run lint --prefix web`, and `openspec validate optimize-agent-test-kit-workflow --strict`.
