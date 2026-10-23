# Tasks

## 1. Engine Runtime Label Normalization

- [x] 1.1 In `web/generate_eight_deliverables.mjs`, dynamically ensure Section 5.4, Section 6.1, and Section 14.4 safe value binding and label protection according to docx-engine constraints, and verify via VS Code review
- [x] 1.2 In `web/generate_eight_deliverables.mjs`, ensure Section 13 clean formatting across bilingual outputs without fragmented row splits, and verify via VS Code review

## 2. Deliverables Recompilation & Verification

- [x] 2.1 Recompile all 8 deliverables for EP-1702 and EP-1704 via `node generate_eight_deliverables.mjs` and verify all 8 DOCX and 8 PDF files generate successfully
- [x] 2.2 Verify deliverables against inspection criteria (Zero Chinese in EN, normalized headers, intact CN facts) via automated audit script
- [x] 2.3 Run smoke tests and validate OpenSpec strictly via `openspec validate --all --strict`
