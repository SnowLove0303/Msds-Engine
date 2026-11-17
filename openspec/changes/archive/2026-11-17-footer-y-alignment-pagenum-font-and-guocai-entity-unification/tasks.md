# Tasks: Footer Layout and Entity Unification

- [x] **Task 1: Unify Guocai Presets in `msds-db.js` (REQ-01)**
  - Update `preset_guocai_cn` so that `company` is "英德市国彩精细化工有限公司" (matching `name_zh` and `supplier_name`).
  - Update `preset_guocai_en` so that `name_en`, `company`, and `supplier_name` are "Yingde Guocai Fine Chemical Co., Ltd.".
  - *Verification Command*: `node web/tests/test_guocai_preset_unification.mjs`

- [x] **Task 2: Enhance Footer Topology Recognition in `template-topology-recognizer.js` and Calibrate Y-axis Alignment in `docx-engine.js` (REQ-02)**
  - In `template-topology-recognizer.js`: enhance `recognizeFooterTopology` to extract `vAlign` and paragraph spacing for table cells.
  - In `docx-engine.js`: harmonize Row 0 Cell 1 `tcPr` with `vAlign="center"` and zero paragraph spacing so that Revision Date Y position strictly matches the company entity baseline.
  - *Verification Command*: `node web/tests/test_footer_y_alignment.mjs`

- [x] **Task 3: Topological Recognition and Correction of Footer Page Number Font Size in `docx-engine.js` (REQ-03)**
  - In `template-topology-recognizer.js`: recognize the template's footer font size tokens.
  - In `docx-engine.js`: eliminate hardcoded `fontSize: 24` (12pt), inherit template style or set to recognized 9pt (Word 18 half-points).
  - *Verification Command*: `node web/tests/test_footer_pagenum_fontsize.mjs`

- [x] **Task 4: End-to-End Deliverables Generation and PDF Coordinates Audit**
  - Generate a test sample (e.g. PU-202A or PU-6013BIO) across Guanzhi and Guocai CN/EN.
  - Run PyMuPDF physical coordinate audit asserting $|\Delta Y| \le 1.5\text{ pt}$ and page number font size $= 9.0\text{ pt}$.
  - Run Bipolar Bilayer full pipeline audit regression.
  - *Verification Command*: `node web/tests/test_adaptive_pipeline.mjs`

