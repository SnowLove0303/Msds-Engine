# Tasks: Universal Full-Content Source Recognition

- [ ] 1. Implement `recognizeDocumentUniversal(docxPathOrBuffer, options)` in `web/src/recognition-engine.js` with full header/footer, bodyParagraphs, all-table (`1..N`), structural `fieldCandidates`, `sourceOoxml`, `coverage`, and `recognitionWarnings` extraction (zero `1..16` or industry keyword hardcoding).
- [ ] 2. Refactor `recognizeSourceDocx` in `web/src/recognition-engine.js` to delegate full-content extraction to `recognizeDocumentUniversal` (removing `1..16` truncation) and support `{ universalOnly: true }` to bypass legacy MSDS `parseSection1..16` domain adapters.
- [ ] 3. Add `web/tests/test_universal_recognition.mjs` verifying full lossless extraction on a rich 20-section DOCX (headers/footers, body paragraphs, `vMerge`, `instrText`, `sourceOoxml`, `coverage`) and on the repository CN template.
- [ ] 4. Run `node web/tests/test_universal_recognition.mjs`, `npm run lint --prefix web`, all existing topology/editor tests, and `openspec validate universal-source-recognition --strict`.
