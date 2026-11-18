# Design

## Context

See proposal.md for the request and scope. The verified OpenSpec root is F:/App Location/Guanzhi Tong/Skill/MSDS-Engine. The official gateway is present and starts the native MCP server over stdio. The local REST health endpoint on port 5174 is unavailable, so the production route will use the native gateway.

The source is a 16-section Chinese MSDS. The existing atomic batch MCP tool invokes executeEightDeliverablesPipeline with modelCode, sourceFilePath and targetDir. That pipeline builds the base Chinese and English versions, derives the Guocai variants, exports DOCX/PDF, and preserves the source file and paired PDF. Calling isolated msds_execute_editor_ops would create a separate template session and its saved file is not consumed by the batch tool. The batch tool is therefore the coherent existing end-to-end editor/pipeline path for eight outputs.

The four registered template identities resolve as CN_Guanzhi, CN_Guocai, EN_Guanzhi, and EN_Guocai. The English keys are language en; the company variants are derived through the pipeline's Guocai preset. The existing code maps both Guocai identities to the Guanzhi base template paths, then derives Guocai through the preset. This implementation fact will be checked against actual output headers and company details.

The static ADD contract for BL-8129A records isHazardous=false, but also defaults a missing signal word to 危险 and lists inhalation and dermal endpoints as mandatory. The source has no signal word and supplies only an oral endpoint. The current verifyAuditContract implementation checks file names/count, timestamps, trailing PDF content, and CN/EN fidelity, but does not enforce the signalWord or endpointsMustExist fields. These unused contract fields are a measured contract gap. They will not be used to invent content or to claim a test passed. The source comparison tools and independent output inspection will verify facts directly. If any mandatory pipeline audit fails, completion remains blocked.

## Goals / Non-Goals

**Goals:**

- Produce exactly the eight standard BL-8129A filenames listed in the acceptance matrix.
- Preserve all 16-section source facts and keep Chinese and English content aligned.
- Preserve the source DOCX and paired PDF through the pipeline's existing backup behavior.
- Keep the target directory to exactly eight MSDS deliverables.
- Verify output files directly and report measured, inferred, or unknown evidence honestly.

**Non-Goals:**

- Change engine source, template masters, API, MCP implementation, or audit rules.
- Add facts absent from the source or reinterpret the product's GHS status.
- Edit the TDS documents in the source folder.
- Remove or replace any pre-existing project files.

## Decisions

### Generation route

Use the existing atomic MCP batch operation after the user's second gate:

- Tool: msds_batch_export_eight
- modelCode: BL-8129A
- sourceFilePath: F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/BL-8129A/BL-8129A/中文版/BL-8129A msds_CN 冠志.docx
- targetDir: F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8129A

This route uses the official MCP JSON-RPC gateway and the engine's generation/editor pipeline. No hand-written DOCX or XML editing is allowed.

### Output matrix

1. BL-8129A msds_CN 冠志.docx
2. BL-8129A msds_CN 冠志.pdf
3. BL-8129A msds_CN 国彩.docx
4. BL-8129A msds_CN 国彩.pdf
5. BL-8129A msds_EN Guanzhi.docx
6. BL-8129A msds_EN Guanzhi.pdf
7. BL-8129A msds_EN Guocai.docx
8. BL-8129A msds_EN Guocai.pdf

### English content preview for gate review

This is a source-grounded translation preview. The pipeline's exact rendered text remains subject to output inspection.

- Section 1. Product name: BL-8129A. Chinese name: Waterborne blocked isocyanate curing agent. Category: Blocked polyisocyanate water dispersion (the current pipeline mapping). Recommended use: adhesives and coatings. Supplier: Guangzhou Guanzhi New Materials Technology Co., Ltd. Address: Room 1106, Area A, Guangzhou International Enterprise Incubator, No. 3 Juquan Road, Science City, Luogang District, Guangzhou. Telephone: 86-20-82567990. Fax: 86-20-32214789.
- Section 2. Not classified as hazardous under GHS. The source contains a GHS pictogram label and says it is not hazardous under GHS. No hazard category, signal word, H statement, or P statement was recognized.
- Section 3. Mixture. Blocked aliphatic polyisocyanate | Confidential | 35-45%. Acetone | 67-64-1 | 0.1-1%. Acetic acid | 64-19-7 | 0.2-2%. Water | 7732-18-5 | 55-65%.
- Section 4. Immediately remove all contaminated clothing. Do not induce vomiting after ingestion; seek medical attention. For eye contact, hold eyelids open and rinse with lukewarm water for at least 10 minutes; consult an ophthalmologist. For skin contact, wash immediately with soap and plenty of water; seek medical attention if a skin reaction occurs. If inhalation causes respiratory tract irritation, seek medical attention.
- Section 5. Suitable extinguishing media: carbon dioxide (CO2), foam, dry chemical powder; for large fires, water spray. Unsuitable media: high-volume water jet. Combustion may release carbon monoxide, carbon dioxide, nitrogen oxides, and small amounts of hydrogen cyanide. Do not breathe smoke during a fire or explosion. Firefighters must wear self-contained breathing apparatus. Prevent contaminated extinguishing water from entering soil, groundwater, or surface water.
- Section 6. Wear protective equipment. Ensure adequate ventilation/exhaust. Keep unauthorized persons away. Do not discharge into drains, wastewater, or soil. Collect with chemical absorbent or dry sand as necessary and store in a sealed container.
- Section 7. Follow customary chemical handling precautions. Avoid skin and eye contact. Keep away from food, beverages, and tobacco. Wash hands before breaks and at the end of work. Store work clothes separately. Change contaminated or wet clothing. Keep containers tightly closed and store in a dry, ventilated place. Follow the product information sheet's storage conditions to maintain quality.
- Section 8. No exposure-limit information is available under EC Directive 2006/121/EC. Respiratory protection is required during spraying. Suitable glove material standard: EN 374-3. Fluoroelastomer (FKM), thickness >=0.4 mm, breakthrough time >=480 min. Butyl rubber (IIR), thickness >=0.5 mm, breakthrough time >=480 min. Nitrile rubber (NBR), thickness >=0.35 mm, breakthrough time >=480 min. Discard contaminated gloves. Wear goggles/face shield and suitable protective clothing.
- Section 9. Appearance: milky white liquid. Odour threshold: no data. pH: 4-6. Ionicity: cationic. Initial boiling point: approximately 100°C. Flash point: no flash point below the initial boiling point. Evaporation rate: no data. Flammability (solid/gas): not applicable. Burning value: not applicable. Relative vapour density: no data. Density: 1.0-1.1 g/cm3. Water solubility: completely miscible. Surface tension: no data. Logarithm of octanol/water partition coefficient: no data. Auto-ignition temperature: not applicable. Ignition temperature: no data. Dynamic viscosity: <1000 mPa.s. Solid content: 40±2%. Other information: the above data are not product specifications; see the product technical information sheet for product specifications.
- Section 10. No decomposition occurs when used as prescribed. Dimethylpyrazole is released under baking conditions; gases released during baking must be extracted. No hazardous reactions occur when stored or handled correctly.
- Section 11. No toxicological studies are available for this product. Risk assessment data for similar products: acute oral toxicity, rat LD50 >2,000 mg/kg; primary skin irritation: not irritating; primary mucous membrane irritation: slight irritation; sensitization: not sensitizing by skin contact; mutagenicity: no mutagenic effects in the Ames test. No inhalation or dermal endpoint was recognized.
- Section 12. No ecotoxicological studies are available for this product. Do not discharge into drains, wastewater, or soil. The product is not readily biodegradable. Based on ecotoxicological data, the product is classified as harmless to fish and daphnia.
- Section 13. Dispose of waste in accordance with applicable national or local regulations. In the EU, follow applicable European Waste Catalogue (EWC) requirements. Empty containers as far as possible, for example by pouring, scraping, or draining until drip-dry. Send them to an appropriate collection point under existing chemical-industry recycling schemes. Recycle containers in accordance with national law and environmental regulations. Do not discharge waste through wastewater.
- Section 14. Road/rail: not dangerous goods under ADG. Sea: not dangerous goods under IMDG. Air: not dangerous goods under IATA. Not dangerous goods. Temperature must not exceed +40°C or fall below 5°C. Keep away from food, acids, and alkalis.
- Section 15. Relevant safety, health, and environmental regulations for the substance or mixture. Complies with: Regulations on the Safety Management of Hazardous Chemicals, State Council Decree 344; GB/T 16483-2008, Safety Data Sheet for Chemical Products—Content and Order of Sections; GB 13690-2009, General Rules for Classification and Hazard Communication of Chemicals; source reference GB 20576-GB 20598, Safety rules for classification, warning labels, and warning statements for chemicals.
- Section 16. To the best of our knowledge and information, the information in this Safety Data Sheet is correct as of its publication date. The information is provided only as guidance for safe handling, use, production, storage, transport, disposal, and release, and does not constitute a warranty or quality specification. It applies only to the specified material and may not be valid when the material is mixed with other materials or used in other processes, unless specifically stated in the text.

### Verification plan

- Compare the current output directory before and after; it must contain only the eight named files.
- Hash the source DOCX and PDF before and after to verify they remain byte-identical; verify preservation copies are outside the target directory.
- Run msds_compare_source_with_output for generated DOCX files, including source-to-output 1:1 checks.
- Run msds_audit_deliverables and the project bipolar-bilayer audit. Inspect both their raw results and real process exit codes.
- Inspect each DOCX/PDF for all 16 sections, the four separate Section 3 components and their aligned values, GHS status, Section 11 source-only endpoints, Section 14 temperature range, company identity, English zero-Chinese content, PDF text, and page/layout issues.
- If an engine or audit hard gate fails, do not modify engine code or claim acceptance. Record the failure and its evidence in tasks.md.

## Risks / Trade-offs

- The MCP planAuditTargets output includes a default Danger signal word and requires oral, inhalation, and dermal endpoints even though this source is non-hazardous and includes only oral data. These fields are currently not enforced by verifyAuditContract, so they cannot be treated as validation evidence. [Measured]
- The batch pipeline's current product-category mapping produces “Blocked polyisocyanate water dispersion,” which is literal but less idiomatic than “Waterborne blocked polyisocyanate dispersion.” The requested payload has no custom facts field. The approved translation must be compared with the actual output; if the pipeline produces different wording, the discrepancy will be reported and not silently rewritten outside the controlled channel. [Measured / Unknown output]
- The current template library points both Guocai identities at Guanzhi base template files and then applies a Guocai preset. Actual output company fields and headers must be inspected. [Measured implementation mapping / Unknown output]
- The source folder has an original DOCX and paired PDF but no existing preservation copies. The official batch operation will create copies beside the source if they do not exist. [Measured]
- A failed hard audit may leave generated files in the target directory. They will be reported as unverified, and the run will not be called complete. [Inference]

## Rollback

No source or system files are modified. If the run fails before writing, the target remains empty. If it produces files but fails validation, preserve them for inspection and clearly mark them unverified; remove them only if the user asks for cleanup.

## Pre-export template inspection (measured)

The MCP row peeks found residual sample data in the official bases: CN Section 3 row 4 contains a sample ingredient, CN Section 9 row 1 contains a sample appearance, and EN Section 3/9 contains Chinese sample text. The selected batch code calls cleanSlateTemplate on both base-CN and base-EN engines before writing source facts. Acceptance therefore checks the actual outputs for zero template residue and zero Chinese in English.

The standalone msds_execute_editor_ops tool creates a separate template session and writes to its own outputPath; msds_batch_export_eight does not consume that session. For this approved run, the batch MCP tool is the integrated equivalent. Its existing pipeline builds editor engines, clears their template values, applies source facts, derives the company variants, and exports all eight files. No claim will be made that the standalone msds_execute_editor_ops MCP tool was called.

## Production result and system deficiency report (measured)

The official batch MCP call produced the exact 8-file matrix twice. The first run exited 1 because the child process PATH did not expose Python; after adding the detected LibreOffice Python runtime, the second run reached the real G-38 checker and still exited 1. Current output files remain present and are not accepted.

- G-38 actual check: 9 misaligned rows per Chinese PDF (Section 9.10–9.19 start at x0=101.35pt; expected 80.28pt) and 19 per English PDF (labels mostly start at 82.02pt; expected 80.28pt; 9.10 at 87.27pt). The official check script reports these measured positions.
- G-40: both Chinese and English Section 2 contain 3 rows, while the project gate requires 2. Recognition shows the pipeline split one full-width source content row into separate classification and GHS label rows.
- Bilingual audit: 107/112 assertions pass, 5 fail. The CN/EN hand-protection parent heading is absent; each Section 8 is 11 rows rather than the required 12; English eye-protection wording differs from the expected phrase.
- CN Section 1 row 1.1 Product name is blank. The source has BL-8129A in that slot; the output places BL-8129A only in the separate Chinese-name value. The matching guard at smart-matching.js around line 3375 skips 1.1 when a separate Chinese-name row exists.
- Section 3 component values are all present as four distinct rows, but msds_compare_source_with_output reports COMPONENT_COUNT_MISMATCH because its check at mcp-server.js around line 366 compares physical row counts (source 5, output 8) instead of ingredient count. This is an audit defect, not missing ingredient data.
- Section 15 differs by the protected modernization invariant. pipeline-engine.js around line 2368 replaces Decree 344 with 591 and GB 20576 with the GB 30000 series. The Ministry of Emergency Management documents Decree 591 as the revision of Decree 344; SAMR lists GB 30000.2-2013 as replacing GB 20576-2006. SAMR also lists GB 30000.30-2025 as current from 2026-07-01, so the project shorthand GB 30000.2-29 merits a policy review before the next release. Sources: [Ministry of Emergency Management](https://www.mem.gov.cn/gk/gwgg/xgxywj/wxhxp_228/201103/t20110312_232614.shtml), [SAMR GB 30000.2-2013 record](https://std.samr.gov.cn/gb/search/gbDetailedCNF?id=71F772D7E605D3A7E05397BE0A0AB82A), [SAMR GB 30000.30-2025 record](https://std.samr.gov.cn/gb/search/gbDetailed?id=%2Fpww8vjCdbE%3D&mode=p).

The pipeline and editor protections remain untouched. The generic causes are in the production matcher, Section 2/8 assembly, Section 9 label geometry, and comparison/audit logic. Repairing them requires an explicit change to protected system behavior, followed by a new OpenSpec requirement and regression evidence.

## Detailed findings and evidence (measured)

- Section 1: CN output row 1.1 Product name is blank. The source value BL-8129A appears only in the separate Chinese-name row. smart-matching.js around line 3375 skips the 1.1 parent row when a separate Chinese-name row exists.
- Section 2: CN/EN output has title + 2.1 + 2.2 (3 rows); the hard gate expects 2 rows. smart-matching.js compound GHS extraction around lines 1373-1423 splits the single source content row into separate classification and label-element slots.
- Section 8: Source hand-protection parent row has no value but its children hold glove details. pipeline-engine.js around line 2160 deletes the parent when its own value is empty, producing 11 rows and omitting Hand protection / 手部防护. Bilingual audit additionally expects the English eye-protection value “Wear safety glasses/face shield.”; generated value is “Wear protective goggles/face shield.”
- Section 9: actual PDF geometry fails the project checker. CN labels 9.10-9.19 start at x0=101.35pt versus 80.28pt expected; EN labels are mostly x0=82.02pt, with 9.10 at 87.27pt. The checker measured 9 failures in each CN PDF and 19 in each EN PDF.
- Section 3 compare: all four ingredient names, CAS values, and concentrations are present. The source packs four ingredient lines into one physical row; output expands them to four ingredient rows. mcp-server.js around line 366 flags physical row-count delta as COMPONENT_COUNT_MISMATCH. This is a false-positive comparator rule for this valid structural expansion.
- Source preservation: original DOCX SHA-256 751ea97af73f49ae14e7c23e4c6f99dd874028a533243123714495e711553098 is unchanged; original PDF SHA-256 4b821f2faa728044521d0be4d9ad1b7db3a719d1de4daf895d76d55ad77a5088 is unchanged. Pipeline preservation copies beside the source have matching hashes.
- PDF text extraction: CN PDFs are 10 pages each; EN PDFs are 6 pages each; all contain BL-8129A and Section 15; EN PDFs contain zero CJK characters. The MCP audit passes G-01 exact count/names, G-36 timestamps (16.6s), and trailing-page text checks.

### Output artifact hashes

| File | Bytes | SHA-256 |
| :--- | ---: | :--- |
| BL-8129A msds_CN 冠志.docx | 30307 | 1fa88a11415204016f7b97baf678511c7ca57dcd15f27702ef2c573e373b8c3c |
| BL-8129A msds_CN 冠志.pdf | 363357 | 7e3be544c60c4be6c61e83ebe87d0fb0902535c6a9fce22866d2d2e2cdf2a041 |
| BL-8129A msds_CN 国彩.docx | 30296 | 28b382d7478fdc8fc78f5f5c807ca3695f1bf241feed4f20bcd1cff31a434551 |
| BL-8129A msds_CN 国彩.pdf | 362941 | 86468a06ae6b86805555e8d0b3c4daf32fb5183646d72f9118f130df36a836a7 |
| BL-8129A msds_EN Guanzhi.docx | 28918 | 79ac3d0a5e7c25cbf282bba081bf4ce614ba56b46bddb6399561c61ad17d646e |
| BL-8129A msds_EN Guanzhi.pdf | 284261 | 448bbfd54807a0f8b78243a789a5d2a7fce8a74e3df78c49f0d459ee64d497d3 |
| BL-8129A msds_EN Guocai.docx | 28885 | 4915b27d32bcc71a1f02b82039449d510d34face7ec50af1b56125fe54c6fe6e |
| BL-8129A msds_EN Guocai.pdf | 283265 | e10123cb96dca6d3d1cbbb876ffff327de1d7f0add91a2e5f918a6e42c982f88 |

### Section 15 policy treatment

The source cites State Council Decree 344 and the GB 20576-GB 20598 series. The pipeline intentionally maps these to Decree 591 and the GB 30000 series under INV-S15-01. The Ministry of Emergency Management describes Decree 591 as the 2011 revision of the original Decree 344; an official government service records a later Decree 645 amendment in 2013. The SAMR portal lists GB 30000.2-2013 as replacing GB 20576-2006 and GB 30000.30-2025 as current from 2026-07-01. The pipeline’s shorthand “GB 30000.2-29” is the current project rule, but should be reviewed for current series wording before a system-level update.
