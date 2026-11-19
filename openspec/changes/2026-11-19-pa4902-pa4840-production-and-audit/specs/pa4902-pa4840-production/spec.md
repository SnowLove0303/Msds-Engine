# Spec: PA-4902 与 PA-4840 标准覆写生产与全要素交付质量规范

## ADDED Requirements

### Requirement: PA-4902 与 PA-4840 标准覆写生产与全要素交付
The system SHALL generate exactly 16 standard MSDS deliverable files (8 per model) in the respective designated directories, adhere to chemical facts and overwrite contracts, and pass all verification gates.

#### Scenario: 生产交付物并通过全景主审计与双极双层审计
- **WHEN** 执行 PA-4902 与 PA-4840 标准化覆写生产
- **THEN** 生成 16 份交付物（4 DOCX + 4 PDF 每型号），各项审计以退出码 0 通过

### Requirement: 核心化学事实与局部覆写行为契约
The system SHALL preserve chemical facts and overwrite contracts for PA-4902 and PA-4840.

#### Scenario: 事实保留与不变量保护
- **WHEN** 处理 PA-4902 与 PA-4840 源事实
- **THEN** 危险性分类、组分与限值严格对齐事实，无外生捏造

## 1. 交付物矩阵与目标路径规范 (Deliverables Matrix)

The system SHALL generate exactly 16 standard MSDS deliverable files (8 per model) in the respective designated directories:

### 1.1 PA-4902 交付矩阵
Target Directory: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-1 单组份水性丙烯酸乳液 PA\PA-4902\`
- `PA-4902 msds_CN 冠志.docx`
- `PA-4902 msds_CN 冠志.pdf` (Strictly 5 pages vector PDF)
- `PA-4902 msds_CN 国彩.docx`
- `PA-4902 msds_CN 国彩.pdf` (Strictly 5 pages vector PDF)
- `PA-4902 msds_EN Guanzhi.docx`
- `PA-4902 msds_EN Guanzhi.pdf` (Strictly 5 pages vector PDF)
- `PA-4902 msds_EN Guocai.docx`
- `PA-4902 msds_EN Guocai.pdf` (Strictly 5 pages vector PDF)

### 1.2 PA-4840 交付矩阵
Target Directory: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4840\`
- `PA-4840 msds_CN 冠志.docx`
- `PA-4840 msds_CN 冠志.pdf` (Strictly 5 pages vector PDF)
- `PA-4840 msds_CN 国彩.docx`
- `PA-4840 msds_CN 国彩.pdf` (Strictly 5 pages vector PDF)
- `PA-4840 msds_EN Guanzhi.docx`
- `PA-4840 msds_EN Guanzhi.pdf` (Strictly 5 pages vector PDF)
- `PA-4840 msds_EN Guocai.docx`
- `PA-4840 msds_EN Guocai.pdf` (Strictly 5 pages vector PDF)

---

## 2. 核心化学事实与局部覆写行为契约 (Chemical Facts & Overwrite Contracts)

### 2.1 PA-4902 核心契约 (Non-Hazardous Water-Borne Resin)
- **Section 1 (Identification)**:
  - Product identifier: `PA-4902`.
  - Chinese name: `水溶性羟基丙烯酸树脂 PA-4902`.
  - Chemical category: `水溶性丙烯酸聚合物树脂` / `Water-borne acrylic polymer resin.`
  - Emergency telephone: `0532-83889090` (CN) / `+86 532 83889090` (EN).
- **Section 2 (Hazards Identification)**:
  - SHALL classify as non-hazardous under GHS (`根据GHS不属于危险物` / `Not classified as a hazardous chemical according to GHS.`).
  - SHALL NOT fabricate pictograms or signal words (`INV-ZERO-EXOGENOUS`).
- **Section 3 (Composition)**:
  - 羟基丙烯酸酯聚合物 (>48%, CAS: 26985-11-5)
  - 水 (>20%, CAS: 7732-18-5)
  - 乙二醇丁醚 (20%, CAS: 111-76-2)
  - N,N-二甲基乙醇胺 (3-4%, CAS: 108-01-0)
- **Section 8 (Exposure Controls)**:
  - OELs: OEL for Ethylene glycol monobutyl ether (`PC-TWA: 20 ppm / 97 mg/m3` or ACGIH `20 ppm`) and EC Directive note.
  - Engineering controls: Provide adequate ventilation.
  - PPE: FKM (≥0.4 mm, ≥480 min), IIR (≥0.5 mm, ≥480 min), NBR (≥0.35 mm, ≥480 min).
- **Section 9 (Physical Properties)**:
  - Appearance: `透明状液体` / `Clear liquid.`
  - Boiling point: `约120℃` / `Approx. 120 °C (solvent).`
  - Flash point: `63℃` / `63 °C.`
  - pH: `7-9（10%水溶液）` / `7 - 9 (10% aqueous solution).`
  - Relative density: `约1.06 g/cm3` / `Approx. 1.06 g/cm3.`
  - Viscosity: `3000-8000 mPa·s` / `3000 - 8000 mPa·s.`
- **Section 14 (Transport Information)**:
  - Non-dangerous goods for road, sea, and air.
  - SHALL eliminate Australian `ADG` regulation keyword (`REQ-04`).
  - Storage temperature: `温度不可高于+50℃，温度不可低于-5℃。远离食物、酸和碱。`

### 2.2 PA-4840 核心契约 (Aquatic Chronic 3 Water-Soluble Acrylic)
- **Section 1 (Identification)**:
  - Product identifier: `PA-4840`.
  - Chinese name: `水溶性丙烯酸树脂 PA-4840`.
  - Chemical category: `丙烯酸聚合物分散体` / `Acrylic polymer dispersion.`
  - Emergency telephone: `0532-83889090`.
- **Section 2 (Hazards Identification)**:
  - SHALL classify as: Hazardous to the aquatic environment - chronic hazard, Category 3 (H412) / `对水环境有慢性危害，类别 3（H412）`.
  - Hazard statement: H412 `对水生生物有害并具有长期持续影响。` / `Harmful to aquatic life with long lasting effects.`
  - Precautionary statements: P273, P501.
  - SHALL NOT fabricate pictograms or signal words (`INV-ZERO-EXOGENOUS`).
- **Section 3 (Composition)**:
  - 丙烯酸聚合物 (>20%, 商业机密 / Trade secret)
  - 水 (>40%, CAS: 7732-18-5)
  - 2-丁氧基乙醇 (5-10%, CAS: 111-76-2)
  - N,N-二甲基乙醇胺 (3-7%, CAS: 108-01-0)
- **Section 8 (Exposure Controls)**:
  - OELs: 2-丁氧基乙醇 OELs and EC directive note.
  - PPE: FKM (≥0.4 mm, ≥480 min), IIR (≥0.5 mm, ≥480 min), NBR (≥0.35 mm, ≥480 min).
- **Section 9 (Physical Properties)**:
  - Appearance: `黄色透明液体` / `Yellow transparent liquid.`
  - Boiling point: `约100℃` / `Approx. 100 °C.`
  - Flash point: `初沸点以下无闪点` / `No flash point below initial boiling point.`
  - pH: `7-9（1:1水稀释）` / `7 - 9 (1:1 aqueous dilution).`
  - Relative density: `约1.06 g/cm3` / `Approx. 1.06 g/cm3.`
  - Viscosity: `4000-15000 mPa·s` / `4000 - 15000 mPa·s.`
  - Solid content: `32 ± 2 %`.
- **Section 11 (Toxicological Information)**:
  - SHALL retain all source multi-component detailed experimental records for 2-Butoxyethanol and Polyacrylate dispersion (`LD50`, `NOAEL`, `Ames`, `OECD 404/429/408/413/451/414`).
- **Section 14 (Transport Information)**:
  - Non-dangerous goods. SHALL eliminate `ADG` regulation keyword.
  - Storage temperature: `温度不可高于+40℃，温度不可低于+5℃。远离食物、酸和碱。`

---

## 3. 标准 PDF 矢量转译与排版不变量 (PDF & Typography Invariants)
- The system SHALL use Windows COM (`wps.application`) via `convertBatchDocxToPdf` for native PDF printing.
- Page ceiling SHALL be strictly 5 pages (no 6-page blank overflow).
- Section 9 first character SHALL strictly align vertically at `80.28pt` in PDF.
- All numbered labels SHALL use `<w:tab/>` with Design Tokens (`sz="21/19"` for number, `sz="24/19"` for label text).

---

## 4. 机械主审计与终审门禁 (Verification Gates)
- `run_master_msds_audit.mjs` SHALL pass with exit code 0 (`🏆 AUDIT_PASSED`).
- `audit_bipolar_bilayer.mjs` SHALL pass with 0 failures (`Exit code 0`).
- `audit_translation_dual_display.mjs` SHALL pass with 0 alarms (`Exit code 0`).
