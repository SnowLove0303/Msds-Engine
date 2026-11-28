# Proposal: Purify Recognition Module into Zero-Hardcoding Universal Layer (`purify-recognition-universal-layer`)

## Why
`web/src/recognition-engine.js` is intended to sit in the **Universal Layer (L2)** alongside `template-topology-recognizer.js`, yet it still contains ~1,200 lines of MSDS-specific hardcoding:
- `SECTION_KEYWORDS` (hardcoded 1..16 Chinese/English section titles)
- `secNum < 1 || secNum > 16` caps and `for (let s = 1; s <= 16; s++)` loops
- `parseSection1..16`, `facts.ghs`, `CAS` / `OEL` / `化学品名称` regexes
- Direct import of `smart-matching.js` (`decomposeCellPairToFacts`)

## What Changes
1. **Extract MSDS 16-Section Domain Adapter to L3 (`web/src/msds-source-semantic-adapter.js`)**:
   - Move `SEMANTIC_TYPES`, `classifyRowSemanticType`, `SECTION_KEYWORDS`, `detectSectionHeaderInText` (legacy 1..16), `extractMultiParagraphCellPairs`, `parseSection1..16`, `recognizeSourceDocx`, and `serializeFactsToMarkdown` into `web/src/msds-source-semantic-adapter.js` (L3 Business Domain).
   - `msds-source-semantic-adapter.js` consumes `recognizeDocumentUniversal` from `recognition-engine.js` (L2) and derives MSDS domain facts on top.
2. **Purify `web/src/recognition-engine.js` (100% Pure L2)**:
   - Remove all `smart-matching.js` imports, `1..16` caps, `SECTION_KEYWORDS`, `parseSection1..16`, and MSDS content dictionaries.
   - Keep ONLY universal, lossless document recognition (`STRUCTURE_TYPES`, `detectSectionHeaderUniversal`, `extractCellTypography`, `classifyRowStructure`, `extractStructuralFieldCandidates`, `recognizeDocumentUniversal`, `serializeUniversalToMarkdown`).
3. **Update Callers (`mcp-server.js`, `production-orchestrator.js`, `web/tests/`)**:
   - Point L3/L4 callers of `recognizeSourceDocx` and `serializeFactsToMarkdown` to `./msds-source-semantic-adapter.js`.
4. **Enforce Purity Gate (`LINT-RECOG-PURE-01`)**:
   - Add `LINT-RECOG-PURE-01` in `web/scripts/lint_code_invariants.mjs` to block `SECTION_KEYWORDS`, `parseSection`, `smart-matching`, `GHS`, `CAS`, `冠志`, `国彩`, or `secNum > 16` from ever re-entering `web/src/recognition-engine.js`.
