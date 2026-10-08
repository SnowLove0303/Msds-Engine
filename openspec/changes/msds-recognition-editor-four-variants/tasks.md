# Tasks

## 1. Recognition handoff and mapping review

- [ ] 1.1 Add a section/label semantic slot registry and source-fact mapping plan; verify unit tests cover exact alias matches, structured Section 3/8/11 rows, duplicate conflicts, and unresolved blockers.
- [ ] 1.2 Add a recognition-to-editor handoff that creates a fresh selected-language template copy without mutating the inspector source; verify the source engine and original bytes remain unchanged after transfer.
- [ ] 1.3 Add a concise mapping review for mapped, source-only/omitted, ambiguous, and image/structure evidence; verify batch export is blocked while any blocking item or required English translation is unreviewed.

## 2. Company overlays and DOCX package persistence

- [ ] 2.1 Add the Guanzhi/Guocai profile registry and apply Guocai only to Section 1 supplier name/address/telephone/fax and footer company text; verify same-language company parity tests find no other differences.
- [ ] 2.2 Track modified header/footer package parts and serialize only those parts on export; verify reopened DOCX files contain the selected model/company footer values while unchanged template package parts and formatting anchors remain identical.
- [ ] 2.3 Suppress source-absent/template-only rows after mapped writes with merge-safe continuation repair and post-omission numbering; verify Section 11 merged-row tests and fresh-template geometry checks pass.

## 3. Four-variant generation

- [ ] 3.1 Build CN/EN × Guanzhi/Guocai outputs from one reviewed content model using fresh template clones; verify all four engines pass structural audits and preserve equal semantic item-presence sets per language.
- [ ] 3.2 Add four-file ZIP export with canonical basenames and per-variant audit results; verify the ZIP contains exactly the four expected DOCX files and leaves embedded templates/source bytes unchanged.

## 4. End-to-end verification

- [ ] 4.1 Extend `web/tests/smoke.mjs` with handoff, unresolved mapping, company overlay, footer round-trip, language review, and four-file ZIP checks; verify `npm run test:smoke` and `npm run build` pass.
- [ ] 4.2 Exercise the randomly selected PA-4816 Chinese MSDS through recognition, mapping review, and four-variant export; reopen and render every DOCX, verify the company-only differences and 16-section coverage, and retain the tested files for delivery.
