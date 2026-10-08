# Design

## Context

The editor creates `roleStyles` with a 12 pt profile, but `writeCellValue` and `writeCellLabel` currently distribute text through the original Word `<w:t>` nodes without updating their `<w:rPr>`. In the CN template, an edited value run can have `w:sz=24` and `w:hAnsi=Arial`, while its `w:rFonts` has no explicit `w:eastAsia` and no `w:szCs`. The package `docDefaults` declares East Asian 宋体, but relying on inheritance does not materialize the requested text attributes on the edited run. Export copies the changed `word/document.xml` and the rest of the original package unchanged.

The pre-change rollback baseline is `F:\Skill\MSDS\rollback\template-editor-export-typography-20261005-before.zip`, SHA-256 `1D461C115C64B3DF00352CB430F394D812DCCE90BCD77CF02EBE7C6EA95864B2`. It contains the complete `web` tree; all 1,692 archive entries were decompressed successfully.

## Goals / Non-Goals

**Goals:**

- Materialize 宋体 in the East Asian font slot and 小四 (`w:sz=24`, `w:szCs=24`) on edited Word runs.
- Keep edited value runs regular and editable label runs bold.
- Preserve existing ASCII, high ANSI, complex-script font selections and all unrelated run properties from the template.
- Keep source template bytes and all unedited runs untouched.

**Non-Goals:**

- Applying global formatting to every run in the document during export.
- Replacing the source template, rebuilding tables, or changing paragraph/table/page layout.
- Changing template editor permissions or interaction behavior.

## Decisions

- Apply the role profile directly to the runs that own the edited text nodes in `writeCellValue` / `writeCellLabel`. This is the last point where the editor knows whether the edited text is a value or label, and it keeps the change localized to edited cells.
- Add or update only `w:rFonts/@w:eastAsia`, `w:sz`, `w:szCs`, `w:b`, and `w:bCs`. Keep `ascii`, `hAnsi`, `cs`, language, color, underline, superscript/subscript, and other source run properties intact. This lets Latin text continue using the template's own font mapping while Chinese glyphs use 宋体.
- Pass the active `engine.roleStyles.value` or `.label` from the editor. Retain a CN 小四 fallback for direct API callers and tests that omit a profile.
- Insert missing run properties in WordprocessingML order so the exported XML remains valid.
- Extend the existing smoke check to reopen the exported DOCX and assert the edited value and label typography, including that a template-owned Latin font mapping remains unchanged.

## Risks / Trade-offs

- [A value cell contains several source runs with differing non-typographic styles] → Apply the role typography to each run carrying an editable text node, and leave every other run property unchanged.
- [The font or size profile is absent] → Use the established CN fallback of 宋体, 24 half-points, and the requested role weight.
- [A malformed insertion order could make `document.xml` invalid] → Run the existing DOCX export/reopen smoke suite for both embedded templates.

## Migration Plan

1. Add a focused helper that materializes the role typography on edited runs.
2. Pass value/label profiles from the editor input handler.
3. Verify exported CN and EN DOCX run properties through the existing smoke suite, then run the production build.

Rollback by extracting the verified snapshot over `F:\Skill\MSDS\web`. Verify the snapshot hash first; after restoration, confirm the ZIP can be opened and all entries decompress, confirm key source files exist, then run the production build.
