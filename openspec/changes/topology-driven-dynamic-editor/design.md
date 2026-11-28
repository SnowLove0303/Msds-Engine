# Design: Topology-Driven Dynamic Editor

## 1. End-to-End Flow: Topology Build -> Dynamic Editor -> Export
```text
[Uploaded .docx OR Exported MsdsEngineStandardTopology JSON]
        |
        v
[topology-plugin-slot.js]  (mountTemplate / mountTopologyBundle / unmountTemplate)
        |  Produces immutable 9-layer MsdsEngineStandardTopology + completenessCheck (9/9)
        +-------------------------------------------+
        |                                           |
        v                                           v
[Web UI State (main.js)]                    [Session Engine (template-editor.js)]
- state.editor.topologyBundle               - createWorkSession({ topologySlot | topologyBundle, docxBuffer })
- Dynamic Section Nav (1..N from topology)  - reshapeTableRows uses rowTemplates.kvCloneRowIndex / dataCloneRowIndex
- Dynamic BodyFlow (preamble / trailing)    - applyTopologyTypographyLock uses topology.typographyProfile & pageFormat
- Dynamic Header/Footer Slots (0, 1, 2)     - saveSession preserves/syncs Layer 1-3 (docDefaults, sectPr, headers/footers)
- Dynamic Table & Cell Editor (render-utils)
```

## 2. Web UI Dynamic Editor Architecture (`main.js` + `render-utils.js`)
1. **Dynamic Template & Bundle Mounting**:
   - Add a Web UI "载入模板 / 挂载拓扑包 / 卸载恢复默认" entry in `editor` view alongside `TEMPLATE_OPTIONS`.
   - When a `.docx` file is uploaded or selected in the Web UI, call `defaultTopologySlot.mountTemplate(buf)` directly in-browser (or via API) and store `state.editor.currentTopology = defaultTopologySlot.exportTopologyBundle()`.
   - When unmounted, reset `state.editor.currentTopology = null`, `state.editor.engine = null`, restoring clean default state.
2. **Dynamic Structure Construction (Zero Hardcoded `16` or Fixed Columns)**:
   - Section count badges (`${sections.length}`) and sidebar navigation (`sectionNav`) iterate `topology.sections` (or fallback to `tableRecords(engine)`), supporting any N sections (e.g., 5, 12, 16, 20) and any M columns (`columnWidths.length`).
   - Add sidebar/editor entries for `bodyFlow.preambleBlocks` / `trailingBlocks` when present in `topology.bodyFlow`.
   - Render `headerFooterTopology.headers` & `footers` dynamically by discovered slot keys (`default`, `first`, `even` / `0`, `1`, `2`) with field & drawing awareness.
3. **Topology-Aware Table & Row Editing (`render-utils.js`)**:
   - `renderEditorTable` accepts `topologySection` (`sections[i]`) + `typographyProfile` + `docDefaults`:
     - Column `<colgroup>` widths come directly from `topologySection.columnWidths`.
     - Locked rows (`rowTemplates.lockedRowIndices`, e.g., header row 0) disable accidental deletion/structural overwrite unless explicitly unlocked.
     - Vertical merges (`vMergeGroups`) render with accurate `rowspan` in the Web UI table instead of showing broken/duplicated cells.
     - WYSIWYG cell CSS reflects `typographyProfile.roles` (4-slot fonts, `sz`, `bold`, `color`, `lineSpacing`, `indentDxa`, `hangingDxa`).
   - Row mutation actions (`+ 追加行`, `+ 说明行`, delete row) consult `rowTemplates.kvCloneRowIndex` / `dataCloneRowIndex` and respect `lockedRowIndices`.

## 3. Session & Primitive Layer Optimization (`template-editor.js` + `universal-editor-primitives.js`)
1. **`createWorkSession` Topology Support**:
   - Accept `{ topologyBundle, topologySlot, docxBuffer }` in addition to legacy `templateKey`/path.
   - Attach `session.topology = topologyBundle` and derive `session.templateProfile` directly from `topologyBundle` without re-guessing.
2. **Parameterized Primitives**:
   - `GLOBAL_ROLE_STYLE_TOKENS.getProfile(isEn, typographyProfile)` and `applyGlobalTypographyProjection` prioritize `topologyBundle.typographyProfile` and `topologyBundle.docDefaults` rather than hardcoded `MSDS_DESIGN_TOKENS` or `9781` / `420/560`.
   - `reshapeTableRows` reads `rowTemplates` from `session.topology.sections` when available.
   - Legacy GuanZhi/Guocai section quirks (`secNum === 3/6/8/9/11`) are guarded behind `options.legacyCompat !== false` (and disabled when operating in pure dynamic topology mode).
