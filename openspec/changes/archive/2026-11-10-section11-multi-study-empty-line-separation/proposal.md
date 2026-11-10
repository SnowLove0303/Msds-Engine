# Proposal: Universal Multi-Study & Multi-Paragraph Line-Break and Empty-Line Preservation

## 1. Background & Problem Statement
Across MSDS deliverables, table cells and narrative sections frequently contain multi-paragraph or multi-study information that requires semantic visual separation (blank lines / empty paragraphs). For instance:
1. In **Section 11 (Toxicological information)**, endpoints like **11.6 致敏性** report distinct scientific studies (Buehler test vs LLNA test), and **11.11 体外遗传毒性** reports Ames test vs In vitro mammalian chromosome aberration test. In the source file (`PU-2346A msds_CN 冠志.docx`), these distinct studies are separated by empty lines (`\n\n`).
2. In **Section 12 (Ecological information)**, multi-study toxicity data (Toxicity to fish, daphnia, algae, etc.) require structured paragraph breaks.
3. In other sections (Sections 4, 6, 7, 8, 10, 14), multiple distinct items or paragraphs are passed through `decomposeCellPairToFacts` and `writeCellValue`.

However, the current codebase exhibits several systemic weaknesses where line breaks and empty lines are aggressively destroyed:
1. **Generic Cell Writing (`writeCellValue` in `web/src/docx-engine.js`)**:
   `valStr.replace(/\r\n?/g, '\n').replace(/\n\s*\n+/g, '\n')` forcibly strips all double newlines `\n\n` into a single `\n`, making it impossible for any cell to retain an intentional blank separation line.
2. **Generic Cell Pair Deconstruction (`decomposeCellPairToFacts` in `web/src/smart-matching.js`)**:
   `ps1.map(p => p.text.trim()).filter(Boolean).join('\n')` indiscriminately removes empty paragraphs from the source file, losing paragraph separation before facts reach downstream modules.
3. **Structured Cell Writer (`writeStructuredToxicologyCellValue` in `web/src/docx-engine.js`)**:
   `.split('\n').map(l => l.trim()).filter(Boolean)` removes all empty line items, and the paragraph emitter never outputs a blank `<w:p>`, fusing independent studies together.
4. **Dynamic English Translation (`translateToxicologyValueToEnglish` and Section 12 translation functions)**:
   `t = t.replace(/\s+/g, ' ')` in line 2952 collapses all whitespace, including vertical newlines (`\r\n` / `\n`), into a single space, destroying all paragraph and empty line structure in English deliverables.

## 2. Statutory Scope & Spec-Kit Alignment
Following the user's directive ("以全局通用的思路去解决问题，不局限于 Section 11"):
- **REQ-LB-01**: 通用多段落与多试验研究空行保真 (Universal Multi-Study & Multi-Paragraph Empty Line Fidelity)
- **REQ-LB-02**: 通用单元格写入与结构化渲染引擎防抹杀修复 (Anti-Stripping Fix in writeCellValue & writeStructuredToxicologyCellValue)
- **REQ-LB-03**: 通用多段解构与翻译引擎换行保真 (Newline & Paragraph Preservation in decomposeCellPairToFacts & English Translation)
- **REQ-LB-04**: 全局不变量与 170 项主审计硬保证 (Global Invariants & 170-Item Master Audit Hard Guarantee)

## 3. Impact Assessment & Blast Radius
- **Affected Core Files**:
  - `web/src/docx-engine.js`: `writeCellValue`, `writeStructuredToxicologyCellValue`.
  - `web/src/smart-matching.js`: `decomposeCellPairToFacts`, `decoupleSection11ToxicologyBlocks`.
  - `web/src/pipeline-engine.js`: `translateToxicologyValueToEnglish`, `translateEcotoxicityValueToEnglish`.
- **Strictly Unaffected (Leave-as-is Invariants)**:
  - Section 14 dynamic table topology (9 rows, 420 dxa hanging indent on sub-labels, MARPOL conventions, 14.3 hazard class `3`).
  - Section 11 Tier B table typography (2800 / 6981 column widths, 560 dxa / 87.28 pt alignment, font Arial 9.5pt / SimSun 12pt regular weight).
  - Section 2 seamless full-width card container.
  - Master MSDS Audit 170/170 assertions.
  - Zero warnings, zero errors on `npm run lint`.
