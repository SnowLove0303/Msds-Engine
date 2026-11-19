# Spec: EP-1501 标准生产与交付质量规范

## 1. 交付物矩阵与目标路径 (Deliverables Matrix)
The system SHALL generate exactly 8 standard MSDS deliverable files in `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1501\测试产出\`:
- `EP-1501 msds_CN 冠志.docx`
- `EP-1501 msds_CN 冠志.pdf`
- `EP-1501 msds_CN 国彩.docx`
- `EP-1501 msds_CN 国彩.pdf`
- `EP-1501 msds_EN Guanzhi.docx`
- `EP-1501 msds_EN Guanzhi.pdf`
- `EP-1501 msds_EN Guocai.docx`
- `EP-1501 msds_EN Guocai.pdf`

## 2. 16 章节核心化学事实与局部覆写契约 (Chemical Facts & Overwrite Rules)
- **Section 1 (Identification)**:
  - In Chinese: Row 1 `1.1 产品名称：` SHALL be left empty (`""`), Row 2 `中文名称：` SHALL contain `水性环氧乳液 EP-1501`, Row 3 `化学品分类：` SHALL contain `环氧水分散体`.
  - In English: Row 1 `1.1 Product name:` SHALL contain `Waterborne epoxy emulsion EP-1501`, Row 2 `Chemical category:` SHALL contain `Epoxy aqueous dispersion`.
- **Section 2 (Hazards Identification)**:
  - SHALL classify product as: Hazardous to the aquatic environment - chronic hazard, Category 3 (H412) / 对水环境有慢性危害, 类别 3 (H412).
  - Hazard statements SHALL include: H412.
  - Precautionary statements SHALL include: P273, P501.
  - The deliverable SHALL NOT fabricate GHS pictograms or signal words (`INV-ZERO-EXOGENOUS`).
- **Section 3 (Composition)**:
  - Row 4: Modified epoxy polymer / 改性环氧聚合物, Trade secret / 商业机密, 55-65%.
  - Row 5: Water / 水, CAS 7732-18-5, 35-45%.
  - Both rows SHALL have CAS and concentration columns centered horizontally and vertically.
- **Section 8 (Exposure Controls / PPE)**:
  - Section 8.1 SHALL state: No exposure limit information available according to EC Directive 2006/121/EC / 根据EC指令2006/121/EG,无可用的接触限值信息.
  - Section 8.2 PPE: FKM ≥0.4mm (≥480min), IIR ≥0.5mm (≥480min), NBR ≥0.35mm (≥480min).
- **Section 9 (Physical & Chemical Properties)**:
  - Appearance: Milky white liquid / 乳白液体.
  - Initial boiling point: Approx. 100 °C / 约100℃.
  - Flash point: No flash point below initial boiling point / 初沸点以下无闪点.
  - Relative density: Approx. 1.06 g/cm3 / 约1.06g/cm3.
  - Viscosity: 200-5000 mPa·s / 200-5000mPa.s.
  - Solid content: 60±2%.
- **Section 14 (Transport Information)**:
  - Non-dangerous goods for road, sea, air transport.

## 3. 标准 PDF 转译通道与排版几何 (PDF Standards)
- PDF generation SHALL be performed via Windows COM (`wps.application` / `Word.Application`) using `convertBatchDocxToPdf`.
- Native Word/WPS formatting, font kerning, margins, and page breaks SHALL be preserved 100%.

## 4. 机械主审计与终审门禁 (Verification Gates)
- `run_master_msds_audit.mjs` SHALL pass all assertions with exit code 0.
- `audit_bipolar_bilayer.mjs` SHALL pass with 0 failures, including Section 9 label alignment at 80.28pt.
