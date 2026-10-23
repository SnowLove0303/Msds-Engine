# Change Proposal: Section 13 Three-Row Standard Structure and Non-Splitting

## Why

In the official standard template (`正式模板_MSDS_CN_冠志(1).docx`) and reference gold standards, **Section 13 (废弃处置 / Handling precautions)** strictly conforms to an immutable **3-row table structure**:
1. **Row 0 (Header)**: `13. 处理注意事项` / `13.Handling precautions`
2. **Row 1 (General Regulations & EWC)**: Single-column full-width cell (`cells.length === 1`), containing both general compliance and EU EWC provisions joined by newline (`\n`) in a single cell:
   ```text
   必须遵守适用的国标、国家或当地法规进行废弃。
   在欧盟领域内废弃，应根据欧洲废弃物分类（EWC）的适当法规。
   ```
3. **Row 2 (Disposal Methods)**: Two-column layout (`cells.length === 2`), Column 0 label `处理方法：` / `Disposal methods：`, Column 1 containing 4-item disposal guidelines.

However, the current MSDS-Engine codebase contains a systematic algorithm flaw:
- `web/src/smart-matching.js` (line 3910) improperly calls `addNoteRowAfter(editorEngine, tRecord, 1, sentence2)`, artificially splitting the second sentence (`在欧盟领域内废弃...`) into a standalone row with table borders, mutating the table into a non-compliant 4-row layout.
- The injection code hardcodes typo `必需遵守适用的国标` instead of the statutory term `必须遵守`.
- When loading legacy ground truths that were already mutated into 4 rows, the system lacks automatic reconciliation to merge and prune rogue split rows back to the 3-row baseline.

## What Changes

1. **Prune Rogue Row Insertion**: Completely remove `addNoteRowAfter` from Section 13 in `web/src/smart-matching.js`.
2. **Single-Cell Multi-Paragraph Injection**: Consolidate national compliance and EWC into `row1.cells[0]` separated by newline (`\n`), correcting all instances of `必需` to statutory `必须`.
3. **Rogue Row Auto-Pruning & Structure Reversion**: If a document table in Section 13 has 4 rows with a rogue split row (`在欧盟领域内废弃`), automatically prune the extra row via `deleteRow` and consolidate text into Row 1, guaranteeing strict 3-row compliance.
4. **Value-Only Recognition Robustness**: Update regexes in `web/src/docx-engine.js` and `web/src/render-utils.js` to match both `必须遵守` and `在欧盟领域内废弃`.
5. **English Template Parity**: Ensure Section 13 English generation strictly maps general advice to Row 1 Cell 0 and detailed methods to Row 2 Cell 1 without residual Chinese text.

## Impact

- **Affected files**:
  - `web/src/smart-matching.js`
  - `web/src/docx-engine.js`
  - `web/src/render-utils.js`
- **Output artifacts**:
  - All generated Chinese & English MSDS files will maintain uniform, compliant 3-row layout in Section 13 with zero visual table line splits.
