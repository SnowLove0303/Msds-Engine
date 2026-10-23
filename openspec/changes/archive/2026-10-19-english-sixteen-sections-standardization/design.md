# Design

## Context
See `proposal.md` for background and motivation. The generator pipeline in `generate_eight_deliverables.mjs` consumes template buffers and calls `docx-engine.js` APIs to produce synchronized CN/EN MSDS deliverables. Historically, English DOCX outputs retained legacy Chinese and placeholder symbols due to a lack of structural dynamic row pruning and a failure to invoke lower-level XML replacement for headers/footers.

## Goals / Non-Goals

**Goals:**
- Provide a robust English transformation and pruning pipeline in `buildEnglishDocx`.
- Guarantee zero Chinese characters (`/[\u4e00-\u9fa5]/`) and zero placeholder letters (`G~Q`, `AA~CC`) in English outputs.
- Synchronize Section 2 (5 rows), Section 8 (12 rows), Section 11 (2 rows), Section 12 (4 rows), and Section 13 (3 rows) with the gold standard.
- Ensure Header/Footer XML files (`header1.xml`, `footer1.xml`, `document.xml`) are physically updated via `updateHeaderFooterData`.

**Non-Goals:**
- Modifying the underlying Chinese matching algorithm or re-OCR processing.
- Changing the schema of the SQLite database (`msds_repo.db`).

## Decisions

### Decision 1: Direct Physical XML Overwrite for Headers and Footers
- **Approach**: Call `updateHeaderFooterData(engine, patch)` instead of simply mutating `engine.headerFooterData`.
- **Rationale**: The DOCX ZIP container stores header/footer XMLs under `word/header1.xml` and `word/footer1.xml`. Mutating the in-memory JavaScript object does not alter the underlying XML unless `updateHeaderFooterData` is executed, which parses, replaces DOM nodes, and serializes back to `engine.supportingXml`.
- **Alternatives Considered**: Modifying XML via regex string replacement. Rejected due to XML malformation risks.

### Decision 2: Dynamic Row Pruning for Structural Synchronization
- **Approach**: Use `deleteRow(engine, record, index)` in a `while` loop to trim excess template rows (Section 2 pruned to 5 rows, Section 8 pruned to 12 rows, Section 11 pruned to 2 rows, Section 12 pruned to 4 rows).
- **Rationale**: The legacy English template was drafted with multiple placeholder rows (e.g., DMAc/DEGBE toxicology and HDI exposure limits). Deleting the unneeded rows is the cleanest method to eliminate template hallucinations and achieve exact parity with the approved Chinese baseline.
- **Alternatives Considered**: Overwriting unused rows with blank strings or "N/A". Rejected because empty rows create visual and structural clutter that violates corporate quality standards.

### Decision 3: Priority Matching for Conflicting Extinguishing Media
- **Approach**: In Section 5, test for `/Unsuitable/i` prior to `/Suitable/i`.
- **Rationale**: In JavaScript regex, `/Suitable/i.test("5.2 Unsuitable extinguishing agents：")` evaluates to true because the substring "Suitable" is contained within "Unsuitable". Testing `Unsuitable` first eliminates this false positive.

## Risks / Trade-offs

- **[Risk]**: Calling `writeCellLabel` on locked cells throws `LOCKED_LABEL`.
  - **Mitigation**: Introduce `safeWriteLabel` which explicitly passes `allowLabelEdit = true` for allowable structural updates in Section 2.
- **[Risk]**: Re-numbering records altering manual row prefixes.
  - **Mitigation**: Align Section 2 labels precisely to `2.1`, `2.2`, `2.3`, `2.4` so `renumberRecord` preserves canonical sequence.
