# Tasks

## 1. Pipeline & Engine Refinement

- [x] 1.1 Update `generate_eight_deliverables.mjs` to call `updateHeaderFooterData` for physical XML rewriting and verify header/footer outputs
- [x] 1.2 Implement dynamic row pruning for Section 2 (5 rows) and Section 8 (12 rows) and verify elimination of placeholder letters `G~Q` and HDI tables
- [x] 1.3 Fix Section 5 priority matching to ensure `5.2` is accurately populated with `High-volume water jet.`
- [x] 1.4 Converge Section 11 to 2-row standard and Section 12 to 4-row standard, eliminating all DMAc/DEGBE and Chinese residues
- [x] 1.5 Update Section 9 Solid Content matching and Section 14/15/16 full English terminology coverage

## 2. Deliverable Generation & Quality Verification

- [x] 2.1 Re-run 8-deliverable generator pipeline for EP-1702 and EP-1740 producing 8 DOCX and 8 PDF files
- [x] 2.2 Execute zero-Chinese and zero-placeholder automated audit script across all 16 sections
- [x] 2.3 Run full regression smoke tests (`npm run test:smoke`) and 20 annotations tests (`npm run test:annotations`)
