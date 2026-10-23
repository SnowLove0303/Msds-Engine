# Design Document: Section 13 Three-Row Standard Structure and Non-Splitting

## Context

The official MSDS template for Section 13 (`正式模板_MSDS_CN_冠志(1).docx`) defines a clean 3-row layout:
- Row 0: `13. 处理注意事项` (Table header, non-editable)
- Row 1: Single cell across all columns, containing both national standard compliance and European Waste Catalogue (EWC) directives formatted as two paragraphs separated by a newline (`\n`).
- Row 2: Two cells: Cell 0 label `处理方法：`, Cell 1 multi-line disposal instructions.

In previous iterations, `web/src/smart-matching.js` mistakenly attempted to separate the two statutory sentences into two separate table rows via `addNoteRowAfter(editorEngine, tRecord, 1, sentence2)`. This mutated the template table into 4 rows and generated an unwanted border around the EWC text. Additionally, a typo (`必需遵守`) was introduced into matching logic, and downstream rendering utilities had incomplete regular expressions for detecting the single-column value row.

## Design Decisions

### 1. Abolish `addNoteRowAfter` for Section 13
In `web/src/smart-matching.js`, Section 13 must strictly preserve the 3-row structure. `addNoteRowAfter` is completely removed from Section 13 matching and injection logic.

### 2. Idempotent Table Auto-Pruning
Because historical ground truths or cached drafts might already have been mutated into 4 rows with an isolated row at index 2 (`在欧盟领域内废弃...`), the matching engine will inspect `tRecord.rows.length`:
```javascript
if (tRecord.rows.length === 4 && tRecord.rows[2].cells.length === 1 && /在欧盟领域内废弃/i.test(tRecord.rows[2].cells[0]?.text || '')) {
  try {
    const updated = deleteRow(editorEngine, tRecord, 2);
    if (updated) tRecord = updated;
  } catch (e) {}
}
```
This guarantees that regardless of whether the incoming document is a clean template or a legacy mutated file, the resulting Section 13 structure is idempotently restored to exactly 3 rows.

### 3. Consolidated Multi-Line Injection & Typo Standardization
The text injected into `row1.cells[0]` is consolidated:
```javascript
let val = wasteItem.value.trim().replace(/必需遵守/g, '必须遵守');
if (val.includes('必须遵守适用的国标') && val.includes('在欧盟领域内废弃')) {
  val = '必须遵守适用的国标、国家或当地法规进行废弃。\n在欧盟领域内废弃，应根据欧洲废弃物分类（EWC）的适当法规。';
}
```
This ensures statutory phrasing (`必须遵守`) and unified paragraph formatting within the single cell.

### 4. Downstream Regex Robustness
In `web/src/docx-engine.js` (line 616) and `web/src/render-utils.js` (line 146), update the `isSingleColValueRow` / `isValueOnly` matcher:
```javascript
(info.sectionNumber === 13 && /必须遵守适用的国标|必需遵守适用的国标|在欧盟领域内废弃|处理方法|废弃/i.test(cell.text))
```
This guarantees proper font role assignment (`fontRole = 'value'`) and prevents synthetic labels from being attached to Section 13 text.
