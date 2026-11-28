# Design: L2 Pure Universal Recognition vs L3 MSDS Semantic Adapter

```text
[L3 / L4 Callers: mcp-server.js, production-orchestrator.js]
        │
        ▼ (needs MSDS 16-section domain facts)
[L3: web/src/msds-source-semantic-adapter.js]
  - SEMANTIC_TYPES, SECTION_KEYWORDS, parseSection1..16
  - recognizeSourceDocx, serializeFactsToMarkdown
        │
        ▼ (calls L2 pure universal recognizer)
[L2: web/src/recognition-engine.js]  <--- Guarded by LINT-RECOG-PURE-01
  - ZERO 1..16 caps, ZERO SECTION_KEYWORDS, ZERO GHS/CAS/smart-matching imports
  - recognizeDocumentUniversal() -> lossless headers, footers, bodyParagraphs, tables (with cell.paragraphs), fieldCandidates, sourceOoxml, coverage, recognitionWarnings
  - serializeUniversalToMarkdown() -> 1:1 faithful HTML-in-MD tables
```
