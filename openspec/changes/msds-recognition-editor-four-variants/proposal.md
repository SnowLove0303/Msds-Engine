# Proposal

## Why

The recognition workspace currently parses a DOCX independently from the template editor, so recognized content cannot be carried into a standard template. The editor also offers only CN/EN Guanzhi templates, preventing the requested CN/EN × Guanzhi/Guocai deliverable set from being produced in one reviewed workflow.

## What Changes

- Add a local, explicit handoff from the recognized 16-section model into a fresh template-editor working copy; preserve the recognition result and source bytes.
- Build a reviewed semantic mapping before writing. Exact/registered label matches may populate template value cells; ambiguous or unsupported source content remains visible as a blocker rather than being guessed or dropped.
- Support four output variants from the same reviewed content model: CN/EN × Guanzhi/Guocai. Use the maintained CN/EN Guanzhi DOCX as the immutable structural baseline; apply Guocai only as a controlled Section 1 supplier and footer-company overlay, as confirmed by the user.
- Include the product model in the correct shared title/header/footer positions, write the translated English layer only when its values have been reviewed, and export each variant as a new DOCX without modifying the imported source or embedded templates.
- Extend saved-package checks to confirm footer/header overlays survive export and that cross-company safety content is unchanged.

## Capabilities

### New Capabilities

- `msds-recognition-editor-handoff`: reviewed transfer of locally recognized source data into a fresh, protected template-editor working copy.
- `msds-company-language-variants`: four synchronized language/company outputs with a Guocai-only supplier/footer overlay.

### Modified Capabilities

None. The repository has no durable `openspec/specs/` capabilities yet; the two new capabilities will establish the contracts for these behaviors.

## Impact

- Affected application code: `web/src/main.js`, `web/src/docx-engine.js`, and focused mapping/profile modules as needed.
- Affected validation: `web/tests/smoke.mjs` plus focused source-to-template and company-parity tests.
- Embedded CN/EN Guanzhi DOCX files remain byte-identical and read-only. Guocai uses the same structure with only approved company fields changed.
- All processing remains in-browser/local; no source file is sent to a remote service. Existing unsaved work in another browser tab remains isolated.

## Rollback Baseline

- The project has no Git repository, so the recoverable baseline is the verified snapshot at `F:\Skill\MSDS\_rollback\web-recognition-editor-guocai-20261005`.
- Snapshot scope: the complete `web` source tree excluding reproducible `node_modules` and `dist` (15 files, 347,029 bytes) and the complete pre-change `openspec` tree (54 files, 129.4 KB). The source and snapshot file manifests matched exactly at capture.
- Snapshot manifest SHA-256: `web` `57b3bf7aa10ec823c99462db5a5bbf18b52810db55fdec25acc9cf8e3ef4bce6`; `openspec` `f164a6c3556f0fa5d866b7c12d87d67e2b90c2df4d73fe43555de7c8c3d790b9`.
- Rollback: restore the affected `web` files from the snapshot and remove only files created by this named change after verifying their exact paths. Confirm the restored snapshot manifests, run `npm run build` and `npm run test:smoke`, and verify the two embedded template hashes remain unchanged.
