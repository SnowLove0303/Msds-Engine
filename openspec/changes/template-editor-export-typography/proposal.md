# Proposal

## Why

The browser editor applies the agreed typography profile for display, but the DOCX writer only replaces existing `<w:t>` text. The exported Word file therefore keeps incomplete or inconsistent run properties from the original placeholder, including missing explicit East Asian font data even when the editor profile resolves to 宋体 and 12 pt.

## What Changes

- Apply the template editor's typography profile to edited value runs before DOCX export.
- Apply the matching label profile to editable label runs while preserving other run formatting and the locked template structure.
- Ensure exported Chinese text records 宋体, 小四 (`w:sz=24`, `w:szCs=24`), and the required bold/non-bold role state in the run properties.
- Preserve the original DOCX package, source templates, table geometry, and untouched run formatting.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This repairs serialization for the existing template editor contract; it does not introduce a new user-facing capability.

## Impact

- `web/src/docx-engine.js`: write role typography into edited Word runs.
- `web/src/main.js`: pass the active editor role profile into value and label writes.
- `web/tests/smoke.mjs`: assert exported CN runs carry the expected font, size, and weight properties.
- Rollback snapshot: `F:\Skill\MSDS\rollback\template-editor-export-typography-20261005-before.zip`
- Snapshot SHA-256: `1D461C115C64B3DF00352CB430F394D812DCCE90BCD77CF02EBE7C6EA95864B2`
- Affected scope: the complete `F:\Skill\MSDS\web` tree captured before edits, including source, embedded templates, dependencies, and current build output.
- Rollback method: extract the verified snapshot over `F:\Skill\MSDS\web`.
- Rollback usability checks: verify the archive SHA-256, confirm its 1,692 entries decompress successfully, confirm `web/src/docx-engine.js` and `web/src/main.js` exist after extraction, and run the production build.
