# Proposal: Universal Full-Content Source Recognition (`universal-source-recognition`)

## Why
Currently `web/src/recognition-engine.js` (`recognizeSourceDocx`) mixes universal document extraction with hardcoded 1..16 MSDS section assumptions (`SECTION_KEYWORDS`, `secNum < 1 || secNum > 16`, `parseSection1..16`). As a result:
1. Content outside sections 1..16, non-standard headings, body paragraphs outside tables, header/footer contents, nested tables, and raw OOXML parts (`sourceOoxml`) are either dropped or not surfaced with full coverage guarantees.
2. In contrast, the reference Python recognition module (`识别模块/msds_table_search.py`) extracts **all** document contents losslessly (`records` for headers/footers, body text, and every table, `fieldCandidates`, `sourceOoxml`, `coverage`, and `recognitionWarnings`) without hardcoded 16-section limits.

## What Changes
1. **Universal Full-Content Recognizer (`recognizeDocumentUniversal`) in `web/src/recognition-engine.js`**:
   - Extract **100% of target DOCX contents** in parity with the Python recognition schema:
     - `headerFooter` (all `word/header*.xml` & `word/footer*.xml` paragraphs, tables, images);
     - `bodyParagraphs` (all non-table body paragraphs);
     - `tables` & `records` (every table regardless of section number 1..N, preserving `rows`, `columns`, `gridWidthsTwips`, cell `colspan`/`rowspan`, `paragraphs`, `runs`, `images`, cell/row/table formatting, and structural `fieldCandidates`);
     - `dynamicSections` (arbitrary N sections discovered by heading structure, without 1..16 cap);
     - `sourceOoxml` (raw XML parts for `document.xml`, `styles.xml`, `settings.xml`, `numbering.xml`, `theme*.xml`, `header*.xml`, `footer*.xml`);
     - `coverage` & `recognitionWarnings` (XML `<w:tbl>` count vs normalized table count, nested table / unnormalized element detection such as `instrText`, `delText`, `sym`, `object`, `pict`).
2. **Decouple `recognizeSourceDocx`**:
   - Refactor `recognizeSourceDocx` to build on `recognizeDocumentUniversal` first so no document content is ever discarded by 1..16 filters.
   - Support `{ universalOnly: true }` to emit pure universal facts with zero MSDS-specific `SECTION_KEYWORDS` or `parseSection1..16`, while keeping an opt-in domain adapter for legacy callers (`smart-matching.js`, `production-orchestrator.js`).
3. **Verify Parity & Zero Silent Loss**:
   - Add automated tests (`web/tests/test_universal_recognition.mjs`) covering an arbitrary N-section DOCX (e.g., 20 sections + body paragraphs + headers/footers + nested table / field codes + `vMerge` + images) and the repository CN template.
