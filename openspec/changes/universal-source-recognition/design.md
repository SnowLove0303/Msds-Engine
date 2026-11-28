# Design: Universal Full-Content Source Recognition (L2)

## 1. Output Contract (`recognizeDocumentUniversal`)
```json
{
  "schemaVersion": "2.0.0",
  "sourceName": "example.docx",
  "sourceType": "docx",
  "recognizedAt": "...",
  "headerFooter": { "headers": [], "footers": [], "tables": [] },
  "bodyParagraphs": [],
  "tables": [],
  "records": [],
  "dynamicSections": [],
  "fieldCandidates": [],
  "sourceOoxml": { "word/document.xml": "...", "word/styles.xml": "..." },
  "coverage": {
    "bodyTableXmlCount": 0,
    "normalizedBodyTableCount": 0,
    "tableCountMatches": true,
    "normalizedCellCount": 0,
    "bodyParagraphCount": 0,
    "headerFooterPartsCount": 0
  },
  "recognitionWarnings": []
}
```

## 2. Zero Hardcoding in Universal Extraction
- **No `1..16` cap**: Heading detection (`detectSectionHeaderInText` with `{ universal: true }`) recognizes any numbered heading `^(\d+)[.、\s]+(.+)` regardless of whether `secNum` is 1, 18, or 99, and unnumbered tables are still preserved under `tables` and `records`.
- **Structural `fieldCandidates`**: Extracted purely from structural evidence (bold/colon label + adjacent value, multi-paragraph `key: value`, multi-column header + data rows) with source coordinates (`tableIndex`, `rowIndex`, `cellIndex`).
- **Lossless `sourceOoxml` & `coverage`**: Directly inspects the ZIP archive via `JSZip` to retain all `word/*.xml` parts and count raw `<w:tbl>` / unnormalized tags (`instrText`, `delText`, `sym`, `object`, `pict`) so nothing is silently dropped.
