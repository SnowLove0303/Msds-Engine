# Design: Unified Kit Workflow (L2 Universal Recognition + L2 Topology + L3 Execution)

```text
run_standard_production.mjs (Unified Kit CLI Entrypoint)
 ├── --recognizeOnly --source=<DOCX> [--outDir=...]
 │      └─> L2 recognizeDocumentUniversal() + serializeUniversalToMarkdown()
 │          -> <name>_universal_recognition.json + <name>_recognition_result.md
 ├── --buildTopology --template=<DOCX> [--outDir=...]
 │      └─> L2 createTopologyPluginSlot().mountTemplate() -> exportTopologyBundle()
 │          -> <name>_built_topology.json (9/9 completenessCheck)
 └── Standard 7-Phase Production (--prepareOnly / --approveContext2)
        └─> L3 produceStandardDeliverables() + optional --template / --topology

run_three_task_audit_prep.mjs (Unified Audit Prep)
 ├── Task 1 (Content Audit Input): L2 recognizeDocumentUniversal + serializeUniversalToMarkdown (Source vs Output)
 └── Task 2 (Topology Audit Input): L2 recognizeTemplateTopology (Template 9-layer vs Output 9-layer)
```
