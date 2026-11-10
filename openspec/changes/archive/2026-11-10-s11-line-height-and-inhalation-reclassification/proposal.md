# Proposal: Section 11 Empty Line Height Calibration & Acute Toxicity Inhalation Reclassification

## 1. Background & Problem Statement
In the latest deliverables review, the user identified two distinct refinements:
1. **Empty Line Height Calibration**:
   The empty paragraph spacer (`<w:p>`) between distinct experimental studies was rendered with default line spacing (`w:line="300" w:lineRule="auto"`), which produces an excessively tall blank gap (approximately 15pt~18pt). The user requested that the empty line height be calibrated to approximately match the prescribed font size height of the cell value (12pt / 240 dxa in Chinese, 9.5pt / 190 dxa in English).
2. **Section 11.1 vs 11.3 Value Misclassification**:
   In the source document (`PU-2346A msds_CN 冠志.docx`), under `急性毒性，经口`, the author accidentally combined ethanol's oral toxicity (`LD50 经口 - 10,470 mg/kg`) with its inhalation toxicity (`LC50 吸入 - 大鼠 - 雄性和雌性 - 4 h - 124.7 mg/l (OECD测试导则403)`). Because the engine previously extracted endpoints by slicing contiguous text blocks between section headers, this entire mixed block was assigned to `11.1 急性毒性，经口`. Consequently, an inhalation test value appeared under oral toxicity.

## 2. Statutory Scope & Spec-Kit Alignment
This proposal implements the 3 Spec-Kit items agreed upon in Gate 1:
- **REQ-LH-01**: 试验与段落间空白行高度精准收敛为规定字号等高 (Empty Line Height Tightened to Prescribed Value Font Size Height)
- **REQ-LH-02**: Section 11 毒理学测试数据分类归口精准纠偏 (Section 11.1 Oral & 11.3 Inhalation Toxicity Classification Correction)
- **REQ-LH-03**: 全局不变量与既有功能防退化保护 (Global Invariants & Zero Regression Protection)

## 3. Impact Assessment & Blast Radius
- **Affected Core Files**:
  - `web/src/docx-engine.js`:
    - `writeStructuredToxicologyCellValue`: set exact line height for empty line paragraphs (`w:line="240"` for CN, `w:line="190"` for EN with `w:lineRule="exact"`).
    - `extractToxicologicalEndpointsFromSource`: universally separate inhalation and dermal toxicity data out of `acute_oral` and reclassify them to `acute_inhalation` and `acute_dermal`.
  - `web/src/pipeline-engine.js`: ensure English translation and table generation symmetrically render the reclassified endpoints.
- **Strictly Unaffected (Leave-as-is Invariants)**:
  - Section 14 dynamic table topology (9 rows, 420 dxa hanging indent on sub-labels, MARPOL conventions, 14.3 hazard class `3`).
  - Section 11 Tier B table typography (2800 / 6981 column widths, 560 dxa / 87.28 pt alignment, font Arial 9.5pt / SimSun 12pt regular weight).
  - Section 2 seamless full-width card container.
  - Master MSDS Audit 170/170 assertions.
  - Zero warnings, zero errors on `npm run lint`.
