# Design

## Context

See `proposal.md` for the motivation. `main.js` holds independent `inspector.engine` and `editor.engine` instances; recognition has no handoff action. The editor's selector currently contains CN/EN Guanzhi only. `docx-engine.js` already retains the original ZIP/XML and supports guarded value writes, but it exports only `word/document.xml`; recognized header/footer parts are currently not written back if edited. The project has no durable main specs and no Git metadata. The verified rollback snapshot and manifest hashes are recorded in `proposal.md`.

## Goals / Non-Goals

**Goals:**

- Keep the source recognition model immutable while creating a fresh editor/template working copy.
- Make source-to-template mapping observable and fail closed for ambiguous, unsupported, or unreviewed content.
- Suppress template-only example values and source-absent display rows after source mapping, repairing only affected merge continuations and then renumbering visible items.
- Use the existing CN/EN formal templates as the structural source for all four company/language outputs.
- Change only the explicitly approved Section 1 supplier values and footer company name for a company overlay; update the shared product-model slots for every variant.
- Persist only intended value/header/footer XML changes and package the four canonical DOCX files for a single local download.

**Non-Goals:**

- No remote file transfer, remote translation service, or server-side document storage.
- No table reconstruction, label/sequence editing, global restyling, or changes to the embedded template bytes.
- No silent best-effort export when any source item, English translation, image, or structural route is unresolved.
- No changes to the existing desktop Python modules.

## Decisions

### 1. Separate immutable recognition evidence from editable output engines

Retain the imported source engine in the inspector state. A handoff action builds a source-fact draft and mapping review against a newly loaded CN or EN Guanzhi template; it never reuses the imported source engine as an output template and never changes `originalBytes`. The review identifies every source row/fact, intended target slot, disposition, and any source locator that could not be uniquely matched.

Alternative considered: let the existing template selector load the source DOCX directly. Rejected because that edits the source structure instead of the formal template and cannot guarantee the requested standardized geometry.

### 2. Match by normalized semantic labels, with explicit per-section adapters

Normalize label punctuation, whitespace, numbering, and known Chinese/English aliases, then resolve against a registered slot map. Section 3 component records use the dedicated name/CAS/content columns; structured multi-cell rows such as Sections 8 and 11 use their declared value cells and locked sublabels. Row index, nearest available slot, or text similarity alone never authorizes a write. Unmatched facts remain in a review queue; only a user-reviewed mapping may proceed.

Alternative considered: reuse the old row-shape prototype matcher in `覆写模块/standardize_from_template.py`. Rejected as the production web mapping because it selects a row prototype using shape/paragraph scores and writes source cells by paired positions; that can misroute fields when source and template structures differ.

### 3. Use one reviewed semantic model for the four variants

Create fresh CN and EN working engines from the existing embedded Guanzhi templates. CN values retain the reviewed source wording; EN values are entered as reviewed translations tied to the corresponding source fact and remain blocked until reviewed. Produce the Guanzhi and Guocai outputs from those language models so company does not become a second content branch.

Alternative considered: independently edit four documents. Rejected because content can drift between company copies and the same source mapping would need to be repeated four times.

### 4. Derive Guocai from the same-language Guanzhi template with a narrow profile overlay

Use the confirmed structural equivalence: CN/EN Guocai share the corresponding Guanzhi template structure. Apply the approved profile only to Section 1 supplier name/address/telephone/fax and the footer company name. Keep the product model, safety values, labels, numbering, geometry, and other metadata identical within a language pair.

### 5. Add a controlled XML boundary for existing header/footer slots

Keep original part XML strings unless a controlled overlay explicitly changes a header/footer value. Retain parsed header/footer DOMs for the duration of the working copy, replace only the text nodes in the existing model/company slots while preserving run and paragraph properties, mark only those package parts as modified, and serialize only marked parts during export. Extend round-trip tests to reopen the DOCX and compare all untouched package parts and format anchors.

Alternative considered: write header/footer values into the browser-side view only. Rejected because the exported DOCX would keep the sample model/company values. Writing all supporting XML unconditionally is also rejected because it causes unnecessary package drift.

### 6. Package the batch as one ZIP download

Use the existing JSZip dependency to create one ZIP with exactly four canonical DOCX basenames. This avoids four concurrent browser downloads and makes the output matrix completeness check atomic. Each DOCX is independently audited before it is added to the ZIP.

### 7. Apply omissions only after the mapping plan is approved

After value writes, compare the reviewed semantic presence set with template slots. Clear or suppress unsupported and pure missing-data items as whole rows before renumbering; retain explicit structural/parent rows only when their mapped children require them. For a deleted vertical-merge restart row, promote the next continuation cell and move the unchanged locked label run tree into that cell. Delete continuation rows without rebuilding the table. Recompute only affected visible numeric prefixes and verify the resulting grid/merge geometry against the fresh template clone.

Alternative considered: leave unmatched template example values or blank labeled rows in place. Rejected because that can publish unrelated product facts or empty safety fields.

## Risks / Trade-offs

- **A normalized label can have multiple plausible targets** → require a reviewed alias/slot rule; keep the item unresolved and block export otherwise.
- **Section 11 merged rows or image relationships can be misrouted** → map only registered physical slots; preserve image evidence and block export when an image has no safe template target.
- **English translation can lose qualifiers or evidence level** → bind each EN value to a source fact and require explicit translation review before the batch can pass.
- **Serializing header/footer XML can alter unrelated package details** → serialize only explicitly modified parts and compare unaffected package-part hashes and template format anchors.
- **Company overlays can leak into safety content** → audit same-language Guanzhi/Guocai outputs after excluding only the named Section 1 supplier cells and footer company field.

## Migration Plan

1. Add the reviewed handoff model, alias/slot registry, unresolved-item view, and clean-template creation path.
2. Add Guocai profile overlays plus model/company header/footer writers and modified-part-only DOCX export.
3. Add four-variant assembly, per-file audit, ZIP packaging, and smoke tests for the two embedded language templates.
4. Exercise a Chinese source through the local recognition page, review all 16 sections and translations, export the four-file ZIP, extract/reopen each DOCX, render every page, and verify company/language parity.

Rollback is to restore affected files from the verified snapshot in `proposal.md`; re-check both snapshot manifest hashes, template SHA-256 values, `npm run build`, and `npm run test:smoke` after restoration.
