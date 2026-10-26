# Design: Adaptive Full-Width Exemption Workflow & Four-Dimensional Deep Audit

## 1. Overview & Architectural Goals

The goal of this design is to resolve the fundamental architectural clash identified during the PA-3223 benchmark investigation:
1. **Content Invariance**: Content MUST be 100% inherited from source documents without black-box truncation.
2. **Format Invariance**: Word template formatting and OOXML table geometry must be 100% preserved.
3. **Targeted Modifications**: Work is strictly localized to 4 designated modules (`smart-matching.js`, `docx-engine.js`, `pipeline-engine.js`, `run_four_dimensional_audit.mjs`), with `styles.css` and `index.html` 100% frozen.
4. **Deep Auditing**: Transition from blind exit-code-only checking to an automated four-dimensional deep audit matrix.

---

## 2. Target Component Interaction & Data Flow

```text
[Source DOCX (e.g. PA-3223)]
        │
        ▼
[1. web/src/smart-matching.js]
  ├── extractSection3ExemptionNotes(record) ──► facts.section3ExemptionNotes
  ├── detectNonHazardousComposite(engine, facts) ──► facts.isNonHazardousComposite
  └── parsePrecautionaryStatements() ──► 100% full 4-phase statements (unpruned)
        │
        ▼
[2. AST Bridge in Editor] (0-byte change to CSS/HTML, native AST cell rendering)
        │
        ▼
[3. web/src/pipeline-engine.js]
  ├── Abolish: `while (s2.rows.length > 4) deleteRow`
  ├── buildFullWidthSection2(engine, facts) ──► Mode B single full-width cell
  ├── buildThreeTierSection11(engine, facts) ──► [Disclaimer] -> [Preamble] -> [Details]
  ├── assertDeliverableQuality() ──► Gate 1~9 in-line enforcement
  └── Output 4 DOCX deliverables
        │
        ▼
[4. web/src/docx-engine.js]
  ├── renderFullWidthCell(row, text) ──► <w:gridSpan w:val="2"/> + 9781 dxa width
  ├── formatSection13Cell() ──► <w:vAlign w:val="center"/> + <w:jc w:val="center"/>
  └── normalizeRowGeometry() ──► 6262 dxa + gridSpan="3" + strip vMerge
        │
        ▼
[5. web/scripts/run_four_dimensional_audit.mjs]
  ├── Dim 1: Semantic Fact Conservation (Keyword penetration)
  ├── Dim 2: OOXML Geometry & Alignment (Flush-left, indents, font-weights)
  ├── Dim 3: Legal Topology & Routing (Mode B, clean S3, 3-tier S11)
  └── Dim 4: Deliverables Parity & Zero Loss (SHA-256 backup, 8 deliverables, zero Chinese)
```

---

## 3. Four Concrete Modification Details

### Component 1: `web/src/smart-matching.js`
- **Function**: `extractSection3ExemptionNotes(record)`
  - Scans Section 3 paragraph text for keywords: `中和`, `成盐`, `游离胺`, `低于分类限值`, `DMEA`, `二甲基乙醇胺`.
  - Extracts the exact exemption sentences and stores them in `facts.section3ExemptionNotes`.
- **Function**: `detectNonHazardousComposite(sourceEngine, facts)`
  - Evaluates whether Section 2 classification is non-hazardous AND contains detailed precautionary procedures or special environmental notes (e.g. sewer clogging).
  - Returns boolean `facts.isNonHazardousComposite`.

### Component 2: `web/src/docx-engine.js`
- **Function**: `renderFullWidthRow(table, rowIdx, content, options)`
  - Converts a multi-column row into a single full-width cell spanning all table columns.
  - Injects `<w:tcPr><w:tcW w:w="9781" w:type="dxa"/><w:gridSpan w:val="2"/><w:vAlign w:val="center"/></w:tcPr>`.
  - Formats internal paragraphs with `<w:jc w:val="left"/>`, stripping all hanging indents and `<w:tabs>`.
- **Function**: `enforceSection13DoubleCenter(cellNode)`
  - Explicitly adds `<w:vAlign w:val="center"/>` to `tcPr` and `<w:jc w:val="center"/>` to `pPr` for the `Disposal methods:` label cell.

### Component 3: `web/src/pipeline-engine.js`
- **Removal**: Delete lines performing brute-force deletion of rows > 4 in Section 2.
- **Function**: `buildFullWidthSection2(engine, facts)`
  - Row 0: Section header (unchanged).
  - Row 1: GHS Classification + elevated Section 3 salt exemption statement.
  - Row 2: Complete 4-phase precautionary procedures (`Prevention:`, `Response:`, `Storage:`, `Disposal:`) with bold subheaders and regular text.
  - Row 3: Special environmental hazards (e.g., high viscosity polymer emulsion sewer clogging warning).
- **Function**: `buildThreeTierSection11(engine, facts)`
  - Row 1: Mixture disclaimer full-width row ("本混合物产品未进行整体毒理学试验。").
  - Row 2: Component preamble row ("以下数据为主要组分/原料的毒理学参考数据：").
  - Row 3+: Detailed component-level endpoints formatted without collapsing into slots 11.1~11.3.
- **Assertion**: Add Gate 9 in `assertDeliverableQuality(engine, docName, isEnglish, sourceFacts)`.

### Component 4: `web/scripts/run_four_dimensional_audit.mjs`
- Standalone CLI inspector that loads generated DOCX archives via `JSZip`, parses `word/document.xml`, `word/footer*.xml`, and generates an itemized pass/fail audit card covering:
  - Dim 1: Keyword penetration matrix (Target: 100%).
  - Dim 2: Non-left paragraph count (Target: 0), illegal tabs (Target: 0), hanging indents (420/565 dxa).
  - Dim 3: Topology validation (S2 Mode B, S3 3-column, S11 3-tier, S13 double-centered).
  - Dim 4: Hash verification of `_源文件留存.docx`, 8 deliverables completeness, 5-item Guanzhi/Guocai diff, zero Chinese in English docs.
