# Design

## Context

See `proposal.md` for motivation. The source project has no web project or existing OpenSpec capability. `识别模块/msds_table_search.py` already defines the recognition contract (`schema_version: 1.0`, records, field candidates, coverage, warnings and source OOXML), while `覆写模块/msds_template_editor.py` defines the editable/locked roles, template library, Section 9 alignment, row guards, renumbering and audit rules. The web implementation must use those existing resources without mutating the Python modules or the read-only DOCX templates.

## Goals / Non-Goals

**Goals:**

- Deliver a self-contained browser prototype under `web/` with a navigation bar and two clearly separated workspaces.
- Parse DOCX XML locally into a display model that is rich enough for 16-section tables, paragraphs, merges, images, direct run/paragraph/table properties, warnings and JSON export.
- Use the original DOCX bytes for preview and export so layout/style evidence is not recreated from a simplified table model.
- Keep editing constrained to value runs by default and implement the core protections and audits visible in the Python editor.
- Make the result runnable with a standard Node install and verifiable through a production build.
- Keep the primary UI minimal and white, with the DOCX template as the visual source of truth for structured/editor table geometry and direct styles.

**Non-Goals:**

- Reimplement Windows COM conversion for `.doc`, Word/WPS PDF export, or server-side document processing.
- Guarantee pixel-identical rendering across every browser/Word version; the source preview is the browser's rendering of the unchanged DOCX and the exported file remains the final authority for Word layout.
- Replace the existing Python modules or claim that browser parsing covers unsupported OOXML elements; unsupported elements remain in the source ZIP and are reported as warnings where detectable.

## Decisions

### 1. Use a dependency-light Vite browser app

Create `web/package.json`, `web/index.html`, `web/src/` and `web/public/templates/`. Use Vite for a reproducible dev/build loop, plain JavaScript modules and CSS for the UI, `jszip` for DOCX ZIP reads/writes, and `docx-preview` for source/template rendering.

Alternative considered: a React application. It would add component/runtime complexity without an existing React codebase; the prototype benefits more from a small, inspectable DOM and a direct mapping to the source records.

### 2. Keep a dual representation of every document

The app maintains (a) the original `ArrayBuffer`/JSZip package and XML DOM parts for lossless preview/export and (b) a normalized `DocumentModel` for navigation, uniform tables, search, fields, format badges and editing. `word/document.xml`, `word/styles.xml`, `word/settings.xml`, `word/numbering.xml` when present, and relevant relationship/media metadata are retained for JSON evidence. The normalized model never becomes the sole source for DOCX export.

### 3. Parse only the stable OOXML surface needed by the two modules

The parser walks body tables and paragraphs, plus header/footer parts when present. It records `w:tblGrid`, `w:tr`, `w:tc`, grid spans, vertical merges, text/break nodes, images through relationships, direct `w:rPr`/`w:pPr` values, cell shading/borders/margins, row properties and table properties. Unsupported or non-normalized nodes are counted as warnings; their original XML stays untouched in the package.

### 4. Render the inspector as source evidence plus normalized tables

`docx-preview` renders the original bytes into a contained preview pane. The structured pane uses one consistent MSDS table skin with section tabs, merged-cell-aware `rowspan`/`colspan`, paragraph breaks, image thumbnails, format chips and warning/coverage cards. Selecting a record updates both panes and keeps the source preview context visible. Search filters the model, not the source ZIP.

The application shell uses a white canvas and only essential labels/actions. Structured and editor table cells derive inline CSS from the normalized DOCX evidence: row height converts Word twips to CSS pixels, cell width/grid spans map to table geometry, `w:tcBorders`/`w:shd` map to borders and fills, and the first direct run/paragraph format maps to font, size and alignment. When a direct property is absent, the browser preview remains the authoritative fallback.

The recognition workspace deliberately omits the old coverage panel. Its three desktop columns are a bounded grid with a shared height; the directory list, structured table scroll area, and preview shell each own their overflow so no column stretches the page or breaks the shared bottom edge.

Structured cells are rendered from paragraph and run nodes. A run-level renderer applies direct OOXML properties and resolves each run's image relationships in sequence; cell/table border layers are combined so table-level outer lines and cell-level internal dotted lines both remain visible.

For the recognition result surface, line rendering is intentionally normalized to an Excel-style grid: every visible cell and the outer table frame use the same solid border, independent of source `nil`, `dotted`, or `dashed` hints.

Recognition tables use collapsed shared edges like Excel: cells do not draw independent four-sided boxes; adjacent cells share one common border, logical source rows share one horizontal rule, columns share one vertical rule, and the table owns one outer frame. Paragraphs and line breaks inside a value cell do not create grid rows.

Continuation merging is structural: it requires an empty first source column plus a populated later value column and a previous row with label/value evidence. Non-bold but delimiter-terminated text in the first column is treated as an independent label candidate, so Section 8 material rows remain separate while the Section 5 blank-label continuation is merged.

Paragraph numbering is resolved from `w:numPr` and `numbering.xml` before the structured renderer is built, so automatic Word list labels are displayed as synthetic prefixes while the original text runs remain untouched.

The structured renderer derives role typography once per imported document. Bold/non-empty runs provide the label profile; non-bold/non-empty value runs provide the value profile. Run-level rendering merges the role profile over the source run for the recognition result only, while the right-side original preview still shows the untouched DOCX formatting.

### 5. Edit the document XML through role-aware field bindings

Each editor field stores its section/table/row/cell coordinates, run nodes, bold role, label/value classification and original text. Value changes distribute text across existing non-bold `w:r`/`w:t` nodes, preserving their `w:rPr`; labels and sequence prefixes are disabled until the explicit exception switch is enabled. Section 9 label writes keep a fixed prefix width of five characters. Add/delete operations clone/remove `w:tr` nodes, clear only non-bold text in new rows, and re-number the selected table using the existing section rules (including repeated Section 11/12 items).

### 6. Export by replacing only the edited package parts

On export, serialize the modified `word/document.xml` (and any directly edited supporting XML) back into the original ZIP, then download a new filename. Embedded/source files are never written. A pre-export audit checks section numbering and structural guards; failing audits block the download and identify the section/row.

### 7. Keep the UI usable without an imported document

The recognition workspace starts with an empty dropzone and a sample explanation. The editor can open the embedded CN template immediately. The top navigation switches workspaces without discarding the inactive workspace's model; a dirty editor prompts before replacing its working copy.

## Risks / Trade-offs

- **[Risk]** DOCX layout depends on browser support and fonts, so an HTML preview can differ from Word/WPS. → Keep the original bytes intact, label the preview as source evidence, and retain a download path for Word verification.
- **[Risk]** Arbitrary OOXML structures, nested tables, fields and drawing anchors may not map cleanly to a normalized table. → Preserve all package parts, surface coverage/warnings, and show unclassified/body records rather than dropping them.
- **[Risk]** Browser-only ZIP/XML mutation can introduce invalid packages if a namespace or relationship is mishandled. → Use JSZip without touching unrelated entries, serialize only known XML parts, and validate the build plus a round-trip open/parse smoke test before delivery.
- **[Risk]** Large documents can make synchronous DOM work feel slow. → Parse after a progress state, avoid base64 duplication for non-visible images, and render only the selected structured record while preserving the package for export.
- **[Risk]** A prototype editor may expose fewer editable fields than the Python GUI for unusual templates. → Make the role classification and locked-state visible, keep source preview alongside the fields, and report unsupported/structure rows instead of silently enabling unsafe edits.

## Migration Plan

1. Copy the two read-only templates into `web/public/templates/`, build the browser parser/editor around the existing contracts, and add a README with run/build instructions.
2. Run the web production build, a DOCX parser/export round-trip smoke check, and the existing Python editor self-check without modifying source templates.
3. Review the generated UI and downloaded DOCX manually. Rollback is to remove only the newly created `web/` implementation and restore the pre-change state from `F:\Skill\MSDS-baseline-20260930.zip` (SHA-256 recorded in `proposal.md`).

