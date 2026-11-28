# Design: Scenario-Agnostic Standard Workflow

```text
Inputs: sourceFilePath, documentId (optional), presets[] (or ['none']), formats[], languages[], outputNamePattern
   │
   ├─ Stage 0: fetchAvailableUserPresets() + validateWorkflowRequirements()
   ├─ Stage 1-2: L2 recognizeDocumentUniversal() -> <docId>_context1_universal.json + <docId>_context1_recognition.md
   ├─ Stage 3: Context 2 governance + Agent translation gate (when non-source languages requested)
   ├─ Stage 4-5: Dynamic presets[] × languages[] DOCX -> (if 'pdf' in formats) pdf-converter.js
   └─ Stage 6: Universal Deliverable Audit (default, works for ANY 1..N files & 1..M sections):
        - Each .docx: recognizeDocumentUniversal (tableCountMatches, cells > 0) + recognizeTemplateTopology (9/9)
        - Each .pdf: non-empty + %PDF- signature + pdfConverterModule === 'web/src/pdf-converter.js'
        - Optional legacy8FormatAudit === true: runs 159-item / 8-file / 16-section legacy suite
```
