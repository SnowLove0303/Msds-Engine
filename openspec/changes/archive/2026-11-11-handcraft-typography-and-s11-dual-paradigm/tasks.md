# Tasks: Handcrafted Typography Fidelity & Section 11 Dual-Paradigm Routing (Micro-Calibrated & 6-Defect Remediation)

## 1. Section 2 Micro-Typography & Paragraph Alignment (`web/src/docx-engine.js` & `pipeline-engine.js`)

- [x] 1.1 In `web/src/pipeline-engine.js` -> `buildFullWidthSection2`:
  - Split the storage precautionary statement into two exact paragraphs matching Gold:
    * Paragraph 29: `    请置于避光、阴凉干燥处存放，存储温度应保持在5-35℃，避免霜冻，保持产品` (with 4 leading spaces)
    * Paragraph 30: `装完整。每次取用之后立即密封，打开包装后尽快使用完毕。`
  - Remove artificial space injection after Chinese colons: ensure `象形图：无`, `警告词：警告`, `危害性说明:...`, `健康危害：无`, `物理化学危险:...` have no space between colon and value.
  - Preserve 8 leading spaces on standard operational procedures (`操作时穿戴...`, `吸入：...`, etc.).
  - Preserve 4 leading spaces on `使用后的空桶...`.
- [x] 1.2 In `web/src/docx-engine.js` -> `renderFullWidthRow`:
  - Align Section 2 paragraphs with Gold:
    * Paragraph 1 (`GHS危险性类别: 无`) -> `<w:jc w:val="left"/>`.
    * Paragraph 2 (`羟基丙烯酸酯聚合物GHS危险性分类：不适用；`) -> `<w:jc w:val="left"/>` and entire line Bold.
    * Paragraph 4~12 (成盐声明) -> `<w:ind w:firstLine="480"/>` and Regular weight (`bold: false`).
    * Paragraph 29 -> `<w:ind w:left="1199" w:hanging="720"/>`.
    * Paragraph 30 -> `<w:ind w:left="1198" w:hanging="240"/>`.
    * Paragraph 31 (`废弃处置：`) -> `<w:ind w:firstLine="482"/>` and Bold.
    * Paragraph 32 (`使用后的空桶...`) -> `<w:ind w:left="959" w:hanging="480"/>`.
    * Paragraph 35 (`环境危害：...`) -> `<w:jc w:val="left"/>`.

## 2. Section 11 Micro-Geometry & Dual-Paradigm Alignment (`web/src/docx-engine.js` & `pipeline-engine.js`)

- [x] 2.1 In `web/src/docx-engine.js` -> `renderFullWidthRow` or Section 11 assembly:
  - Row 1: Add `<w:jc w:val="left"/>`.
  - Row 2: Add `<w:jc w:val="left"/>` and `<w:ind w:left="34"/>`.
  - Row 3: All 4 detail paragraphs MUST have `<w:jc w:val="left"/>` and `<w:ind w:left="34"/>`.
  - Ensure font size is consistently 12pt (`sz="24"`), 宋体.
- [x] 2.2 Wire `detectSection11Paradigm` into pipeline (Multi-component -> Paradigm 1; Single-component -> Paradigm 2).

## 3. Six Defect Remediation: Section 11 Line Breaks, Punctuation & Global Periods

- [x] 3.1 (D-01, D-02, D-03) In `web/src/pipeline-engine.js` -> `buildThreeTierSection11` (English Mode):
  - Refactor English `detailParagraphs` into 4 distinct paragraphs matching Chinese 1:1:
    * P0: `Hydroxy polyacrylate dispersion: Toxicity: No data available;`
    * P1: `Irritation: No data available.`
    * P2: `Propylene glycol butyl ether: Toxicity: Dermal (Rat) LD50: > 2000 mg/kg; Inhalation (Rat) LD50: > 1997.718 mg/l/8hE; Oral (Rat) LD50: > 2000 mg/kg; Irritation: No data available.`
    * P3: `2-(2-Butoxyethoxy)ethanol: Toxicity: Dermal (Rat) LD50: > 2000 mg/kg; Oral (Rat) LD50: = 4500 mg/kg; Irritation: No data available.`
  - Eliminate trailing suspended colon `:` on P3; end with `.`.
  - Delimit internal endpoints with standard semicolon and space (`; `).
- [x] 3.2 (D-04) In `web/src/pipeline-engine.js` -> `buildThreeTierSection11` (Chinese Mode):
  - In P2 & P3: Fix `mg/kg刺激性：` text collision by injecting full-width semicolon `；` (`... mg/kg；刺激性：无资料。`).
  - Eliminate 6 continuous spaces, delimiting endpoints with full-width semicolon `；`.
  - End P1, P2, P3 with full-width period `。`.
- [x] 3.3 (D-05) In `web/src/docx-engine.js` -> `renderFullWidthRow`:
  - Implement G-11 bold state machine for Section 11:
    * Bold subheaders and labels: `羟基聚丙烯酸酯分散体：`, `丙二醇丁醚：`, `二乙二醇丁醚：`, `毒性：`, `刺激性：`, `Toxicity:`, `Irritation:`.
    * Regular font weight for experimental test values and conclusions: `无资料`, `No data available.`, `经皮（鼠）LD50...`, `Dermal (Rat) LD50...`.
- [x] 3.4 (D-06) In `web/src/pipeline-engine.js` -> `buildBaseChineseEngine` & `buildBaseEnglishEngine`:
  - Complete ending periods for standalone sentences after line breaks:
    * Section 4 (急救措施 - 皮肤接触): `立即用肥皂和大量的水冲洗。若发生皮肤反应，就医。`
    * Section 5 (消防措施 - 灭火介质): `二氧化碳（CO2），泡沫，灭火粉末，大火时应用喷洒水。`
    * Section 7 (操作处置与储存 - 安全操作防范): `...将工作服单独存放。更换被污染或浸湿的衣物。`
    * Section 2 P11 & P12: Ensure standard trailing semicolon `；` / `; `.

## 4. Verification & Regenerating Deliverables

- [x] 4.1 Regenerate PA-3223 standard 8 deliverables:
  - Command: `cd "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web" && node scripts/generate_pa3223_deliverables.mjs`
- [x] 4.2 Update `web/scripts/audit_bipolar_bilayer.mjs` and execute:
  - Verify English S11 paragraphs === 4.
  - Verify no trailing colon in English S11.
  - Verify Chinese S11 has no `mg/kg刺激性` text collision.
  - Verify S4, S5, S7, S11 end with periods.
  - Command: `cd "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web" && node scripts/audit_bipolar_bilayer.mjs` (Exit Code 0).
- [x] 4.3 Validate OpenSpec strict:
  - Command: `cd "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine" && npx openspec validate handcraft-typography-and-s11-dual-paradigm --strict` (Exit Code 0).
