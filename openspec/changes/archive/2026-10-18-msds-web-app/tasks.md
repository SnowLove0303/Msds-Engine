# Tasks

## 1. Web project and protected assets

- [x] 1.1 Create the Vite browser project under `web/` with a reproducible `package.json`, `index.html`, source directory, and build scripts; verify `npm install` and the initial `npm run build` complete successfully.
- [x] 1.2 Copy the CN 冠志 and EN 冠志 DOCX files into `web/public/templates/` without changing the originals; verify both copied files open as ZIP packages and their SHA-256 values match `覆写模块/内嵌模板/`.
- [x] 1.3 Add `web/README.md` with local run/build instructions, browser-only limitations, and the rule that embedded/source templates are never overwritten; verify the instructions reference the actual scripts and paths.

## 2. DOCX package parser and document model

- [x] 2.1 Implement local `.docx` ZIP loading and validation with a normalized `schema_version: 1.0` document model; verify unsupported extensions and malformed packages produce recoverable errors.
- [x] 2.2 Parse body/header/footer tables and paragraphs into records with section numbers/titles, row/column order, grid spans, vertical merges, paragraph breaks, images, and unclassified records; verify a template produces records for all available MSDS sections.
- [x] 2.3 Extract direct run, paragraph, cell, row, and table properties plus field candidates and GHS aliases, and calculate coverage/warnings while retaining source XML strings; verify the model contains format evidence and warning counts without dropping original ZIP entries.
- [x] 2.4 Implement normalized search and JSON export that removes transient DOM/package references while retaining records, warnings, coverage, and source-format evidence; verify exported JSON parses and includes the schema version.

## 3. Recognition workspace and navigation shell

- [x] 3.1 Build the application shell with branded header navigation, two workspace routes/states, responsive layout, status/toast region, and empty states; verify navigation switches workspaces without losing the inactive workspace state.
- [x] 3.2 Build the DOCX dropzone/file picker, progress state, file metadata card, and recoverable error handling; verify dropping a supported DOCX populates the recognition model and dropping a non-DOCX preserves the previous result.
- [x] 3.3 Build the consistent 16-section navigation and structured table renderer with merged cells, paragraphs, images, labels/values, section counts, and coverage cards; verify the CN and EN templates render the same table skin and expose their recognized sections.
- [x] 3.4 Add source DOCX preview beside the structured view and a format/coverage evidence panel; verify selecting a record updates the structured detail and preview context while leaving the source bytes unchanged.
- [x] 3.5 Add keyword/section filtering, GHS alias matching, warning display, and JSON download controls; verify a search for `GHS07`/`感叹号` or a label narrows visible records and the download contains the current recognition result.

## 4. Protected template editor

- [x] 4.1 Implement embedded CN/EN template loading and editor state reset/switch handling, including source-style preview and section navigation; verify the editor opens CN by default and switching to EN resets dirty state without mutating either template file.
- [x] 4.2 Implement role-aware editable field bindings that write only into existing non-bold runs, keep labels/sequence/structure rows locked by default, and show lock reasons; verify a normal value edits successfully and a locked label mutation is refused.
- [x] 4.3 Implement explicit label-edit mode with Section 9 fixed-width prefix alignment and preserved style metadata; verify an authorized Section 9 label edit keeps the `9.n` prefix spacing and marks the document dirty.
- [x] 4.4 Implement safe row clone/delete operations, protected row guards, section-scoped continuous renumbering, repeated Section 11/12 handling, and audit output; verify add/delete changes retain row layout, protect title rows, and surface audit errors.
- [x] 4.5 Implement style-preserving DOCX export by replacing only edited XML parts in a copy of the original ZIP; verify export creates a new download, leaves embedded/source files unchanged, and blocks when the audit fails.

## 5. Verification and delivery polish

- [x] 5.1 Add focused browser-side smoke tests or a scripted round-trip harness for import → model → edit → export → re-open, including value writing, row operations, and audit behavior; verify the exported DOCX remains a readable ZIP with valid `word/document.xml`.
- [x] 5.2 Run the production build, the focused browser smoke checks, and `python 覆写模块/test_editor.py`; verify all checks pass and original template hashes remain unchanged.
- [x] 5.3 Review the built page at desktop and narrow viewport widths, fix visible layout/accessibility issues, and verify the final `web/` folder contains only the intended app, templates, documentation, and build configuration.

## 6. Minimal white template-aligned visual pass

- [x] 6.1 Reduce the primary UI copy to navigation, essential actions, section navigation, status badges, table and preview content; verify no long explanatory paragraphs or decorative dark panels remain in either workspace.
- [x] 6.2 Convert the application surfaces to a white visual system with restrained grey borders and text hierarchy; verify page, panels, structured tables, editor tables, controls, and empty states all render with white backgrounds.
- [x] 6.3 Map normalized DOCX evidence into inline table styles for row heights, column widths, borders, shading, font, font size, paragraph alignment, and merged cells in both structured and editor tables; verify CN and EN template sections visually follow their source geometry.
- [x] 6.4 Rebuild, run the DOCX smoke round-trip and existing editor self-check, and inspect the live browser at desktop and narrow widths; verify the minimal white UI remains usable and the templates/hash checks are unchanged.

## 7. Bounded recognition layout

- [x] 7.1 Remove the document coverage panel and any redundant recognition-side explanatory block; verify the recognition workspace contains only directory, structured result, and source preview columns.
- [x] 7.2 Give the three recognition columns a shared viewport-bounded height with aligned bottoms and independent vertical scrolling; verify a long Section does not increase document height and the source preview column remains the same height as the result table.
- [x] 7.3 Rebuild and inspect a populated recognition sample at desktop and narrow widths; verify the coverage panel is absent, bottom edges align on desktop, internal scrolling works, and existing DOCX/hash/smoke checks still pass.

## 8. Full DOCX-format rendering

- [x] 8.1 Render structured cells from paragraph/run nodes with per-run font, size, weight, italic, color, underline, line breaks, paragraph alignment, spacing, and indentation; verify mixed-format source runs are not flattened.
- [x] 8.2 Resolve DOCX image relationships into actual inline image elements in the original run order and retain table/cell outer/internal border layers; verify a source image appears in the structured result and dotted internal lines remain visible.
- [x] 8.3 Rebuild, run the DOCX smoke round-trip and self-checks, and inspect a representative Section 1/Section 9 table against the provided MSDS screenshot; verify structure, text formatting, images, borders, and template hashes remain intact.

## 9. PU-1107 source compatibility

- [x] 9.1 Recognize legacy Section 1 headings written as `v1.` as Section 1, then parse the supplied PU-1107 DOCX and verify the section navigation exposes Sections 1–16 without changing its source table borders or content.

## 10. Solid recognition grid lines

- [x] 10.1 Normalize recognition-table outer and internal horizontal/vertical borders to one solid line style, including source cells whose OOXML border value is `nil`, `dotted`, or `dashed; verify the supplied PU-1107 table has no dotted or dashed rules.
- [x] 10.2 Rebuild, run smoke/self-checks, and inspect the PU-1107 recognition result; verify all visible table rules are solid and template assets remain unchanged.

## 11. Excel-style solid grid

- [x] 11.1 Render every visible recognition cell and the outer table frame with one uniform solid Excel-style border, ignoring source border line styles; verify the PU-1107 table has a continuous grid with no dotted/dashed lines.

## 12. Shared collapsed edges

- [x] 12.1 Replace independent cell boxes with collapsed shared table edges: one outer frame, one shared border per adjacent row/column boundary, and no doubled neighboring borders; verify the PU-1107 grid visually matches an Excel table.

## 13. Text-role and logical-row grouping

- [x] 13.1 Revert text-line row splitting and render the source logical rows while classifying bold runs as labels and non-bold runs as values; verify label/value cells remain on one row.
- [x] 13.2 Keep multi-paragraph and multi-line values in the same cell without internal grid lines, while preserving run formatting, paragraph spacing, and images; verify a multi-line PU-1107 value remains one value cell.

## 14. Source-row-aware continuation merge

- [x] 14.1 Restrict continuation merging to blank-first-column rows whose later value cell follows a previous label-value row; keep non-bold delimiter-terminated first-column labels as independent rows.
- [x] 14.2 Verify the supplied PU-1107 Section 5 continuation merges while Section 8 FKM/IIR/NBR rows remain separate, then rebuild and run smoke validation.

## 15. Automatic sequence restoration

- [x] 15.1 Resolve `w:numPr`/`numbering.xml` multi-level numbering and render missing automatic prefixes before their original labels without mutating source runs; verify PU-1107 Section 1 displays `1.1` for the automatically numbered item.
- [x] 15.2 Rebuild, run smoke/self-checks, and verify the supplied PU-1107 source now exposes Section 1–16 with restored sequence text.

## 16. Display-layer sequence normalization

- [x] 16.1 Normalize legacy `v1.` title-cell prefixes and render automatic numbering prefixes in the recognition table display layer for all sections; verify the rendered table shows `1.` and `1.1` instead of the raw/empty sequence.
- [x] 16.2 Rebuild and verify PU-2341E Section 1/3/7/9 displays normalized sequence text while source preview remains unchanged.

## 17. Inline sequence-label rendering

- [x] 17.1 Merge the normalized sequence prefix into the first label run so sequence and label render as one same-column text flow; verify the DOM/text output is `1.1  产品名称：` inside the first table cell.
- [x] 17.2 Rebuild and inspect PU-2341E Section 1/3/7/9, then run smoke validation.

## 18. Role typography normalization

- [x] 18.1 Derive document-level label and value typography profiles from representative bold/non-bold runs and apply the profiles to structured recognition rendering without changing the source preview.
- [x] 18.2 Rebuild and inspect PU-2341E labels/values across Sections 1, 3, 7, and 9; verify label font/size parameters are uniform, value font/size parameters are uniform, and smoke/self-checks pass.

## 19. Handoff documentation

- [x] 19.1 Create the Chinese project handoff document with architecture, runbook, recognition/editor rules, validation commands, rollback baseline, known limitations, and maintenance checklist; verify every command/path matches the current project.
