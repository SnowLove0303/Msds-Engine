# Design

## Context

The editor exposes `cell.valueText` as one `contenteditable` value, but the underlying OOXML may store that value in several non-bold runs across multiple `<w:p>` elements. The current writer divides new text across the old `<w:t>` nodes according to their original lengths. `refreshCellText` then reconstructs `valueText` with paragraph separators, and DOCX export preserves those paragraph elements. See `proposal.md` for the user-visible failure and `specs/editor-cell-atomic-values/spec.md` for the behavior contract.

The verified pre-change baseline is `F:\Skill\MSDS\rollback\template-editor-export-typography-20261005-before.zip`, SHA-256 `1D461C115C64B3DF00352CB430F394D812DCCE90BCD77CF02EBE7C6EA95864B2`. The archive contains the full `web` tree and all 1,692 entries decompressed successfully.

## Goals / Non-Goals

**Goals:**

- Store a replacement cell value in one destination run and paragraph regardless of how many editable text nodes the source used.
- Serialize only user-entered line breaks as `<w:br>` inside that destination paragraph.
- Remove source paragraphs that become empty after replacement, while retaining protected text, images, and other non-text content.
- Refresh the in-memory paragraph, run, and cell models after the OOXML nodes change so editor re-renders show the same continuous value as the exported DOCX.
- Preserve role typography on the destination run.

**Non-Goals:**

- Merging or splitting table cells or table rows.
- Removing or editing locked bold labels or embedded images.
- Changing Section 11 data interpretation, field order, or the editor's cell-level edit permissions.

## Decisions

- Replace the old weighted `distributeText` path for cell values with atomic OOXML replacement. The first editable value run in document order becomes the destination because it already carries the template paragraph/run style; all other editable text, soft breaks, and tabs are cleared from value runs.
- Keep the destination paragraph and remove only other paragraphs that have no remaining text, image, field, or other meaningful OOXML content. This prevents empty source paragraphs from turning into blank lines while retaining paragraphs with protected content.
- Convert explicit newline/tab characters from the editor into `w:br` / `w:tab` in the destination run. A plain string such as `123` therefore creates one text node and no line break.
- Reparse only the affected cell's surviving paragraphs and rebuild its editable-node lists after the DOM update. This prevents later input events or editor renders from using detached nodes or stale paragraph values.
- Classify explicit textual numbering only when it appears as a label in the first column; still honor Word automatic numbering attached to any paragraph. A numeric-only value, including a note/value occupying the first cell, is data and must remain editable after reopening.
- Leave `writeCellLabel` and its Section 9 prefix logic unchanged; the reported defect is whole-cell value replacement.

## Risks / Trade-offs

- [A source paragraph contains both editable value and protected content] → Clear only non-bold editable run text and preserve all other run content; keep the paragraph if meaningful content remains.
- [The value includes intentional user newlines] → Serialize those exact breaks inside one paragraph rather than creating new paragraph records.
- [A table cell must retain at least one paragraph] → Always preserve the destination paragraph even when the replacement is empty.
- [The editor model becomes stale after paragraph deletion] → Rebuild run, segment, value-node, and cell-text data from the surviving cell XML before returning from the write operation.
- [A numeric value is mistaken for a sequence after export/reopen] → Require label evidence for literal sequence detection and retain actual Word numbering evidence.

## Migration Plan

1. Implement atomic replacement in `writeCellValue` and refresh the affected model.
2. Add a Section 11 regression assertion that replaces a multi-paragraph value with `123` and confirms one logical paragraph in the model and exported/reopened DOCX.
3. Run `npm run test:smoke` and `npm run build`.

Rollback by restoring the complete verified `web` snapshot at `F:\Skill\MSDS\rollback\template-editor-export-typography-20261005-before.zip`. Verify its SHA-256 before extraction; after restoration, confirm key source files exist and the snapshot entries open, then rerun the production build.
