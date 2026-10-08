# Proposal

## Why

An editor field represents the value of one table cell, but the DOCX writer distributes replacement text across the cell's pre-existing text nodes. In Section 11, those nodes can live in multiple paragraphs, so typing a continuous value such as `123` becomes `1` / `23` or three separate lines in both the editor model and exported Word file.

## What Changes

- Treat replacement text as one value for one cell, independent of how many paragraphs or runs the source cell used.
- Store continuous input as one continuous text run in the cell; create line breaks only when the user entered them.
- Remove obsolete empty source paragraphs created by replacing a multi-paragraph value while retaining non-editable labels, images, paragraph content and the cell itself.
- Keep numeric content in value columns classified as data rather than sequence prefixes after DOCX reopen.
- Verify Section 11 multi-paragraph value cells remain continuous in the editor model and after DOCX export/reopen.

## Capabilities

### New Capabilities

- `editor-cell-atomic-values`: editable cell text is replaced as one logical value rather than proportionally distributed over source text nodes.

### Modified Capabilities

None.

## Impact

- `web/src/docx-engine.js`: cell value replacement, paragraph/model refresh, and sequence detection by cell role.
- `web/tests/smoke.mjs`: Section 11 multi-paragraph replacement and DOCX round-trip coverage.
- Rollback snapshot: `F:\Skill\MSDS\rollback\template-editor-export-typography-20261005-before.zip`
- Snapshot SHA-256: `1D461C115C64B3DF00352CB430F394D812DCCE90BCD77CF02EBE7C6EA95864B2`
- Affected scope: the complete `F:\Skill\MSDS\web` tree captured before this implementation, including source, templates, dependencies, and build output.
- Rollback method: extract the verified snapshot over `F:\Skill\MSDS\web`.
- Rollback usability checks: verify the snapshot SHA-256, confirm all 1,692 entries decompress, confirm the affected source files exist after extraction, and run the production build.
