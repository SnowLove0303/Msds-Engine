# Proposal: Topology-Driven Dynamic Editor (`topology-driven-dynamic-editor`)

## Why
Currently, the MSDS-Engine Web UI editor (`web/src/main.js`, `web/src/render-utils.js`) and Node session editor (`web/src/template-editor.js`, `web/src/universal-editor-primitives.js`) are still partially hardcoded around legacy templates:
1. **Static Web UI Assumptions**: `main.js` hardcodes `TEMPLATE_OPTIONS` (`CN 冠志` / `EN 冠志`), `16` section counters (`/16`, `16 sections ready`), and `SECTION_KEYWORDS` (1..16). `state.editor.currentTopology` is only fetched for a read-only inspection modal and never drives the live editor structure.
2. **Disconnected 9-Layer Topology**: `template-topology-recognizer.js` and `topology-plugin-slot.js` now emit a complete 9-layer `MsdsEngineStandardTopology` bundle (`9/9` completeness check passed), including `docDefaults`, `pageFormat.sectionsPageFormat`, `headerFooterTopology`, `bodyFlow`, `sections` (`columnWidths`, `vMergeGroups`, `rowTemplates`, `stylePrototypes`), and `typographyProfile`, but the editor does not consume this bundle to dynamically construct or constrain editable views.
3. **Hardcoded Formatting & Special Cases**: `template-editor.js` and `universal-editor-primitives.js` still contain hardcoded defaults (`9781`, `[3519, 6262]`, `420/560`, `MSDS_DESIGN_TOKENS`) and legacy section special cases (`secNum === 3/6/8/9/11`), which violate the "template is the single source of structural & visual truth" principle.

## What Changes
1. **Pluggable Topology → Editor Bridge**:
   - Add a `topologySlot` / `MsdsEngineStandardTopology` consumption path in `template-editor.js` (`createWorkSession`) and `main.js` (`state.editor`), enabling users to upload any `.docx` template (or load an exported `MsdsEngineStandardTopology` JSON bundle), mount it into the editor, edit dynamically, and unmount back to clean default state.
2. **Dynamic Web UI Editor Rendering & Optimization**:
   - Replace hardcoded `/16` counters, `TEMPLATE_OPTIONS`-only loading, and static section lists in `main.js` and `render-utils.js` with dynamic rendering driven by `topology.sections` (`sectionsCount` N), `topology.bodyFlow` (preamble/trailing blocks), `topology.headerFooterTopology` (dynamic header/footer slots `0/1/2` + fields/drawings), and `topology.pageFormat` (A4/Letter, margins, orientation).
   - Render table columns, merged cells (`vMergeGroups` / `gridSpan`), row locks (`rowTemplates.lockedRowIndices`), and WYSIWYG typography (`typographyProfile.roles` + `docDefaults`) directly from the mounted topology.
   - Enforce template-driven row operations (`+ 追加行` / `+ 说明行` / delete row) using `rowTemplates.kvCloneRowIndex` / `dataCloneRowIndex` instead of blindly cloning the last row.
3. **Universal Editor Decoupling**:
   - Refactor `GLOBAL_ROLE_STYLE_TOKENS`, `applyTopologyTypographyLock`, `reshapeTableRows`, and `applyGlobalTypographyProjection` to prioritize injected `MsdsEngineStandardTopology` parameters over hardcoded fallbacks, and isolate legacy CN/EN GuanZhi quirks behind an opt-in compatibility adapter.

## Impact
- **Affected Files (Planned)**:
  - `web/src/template-editor.js`
  - `web/src/universal-editor-primitives.js`
  - `web/src/render-utils.js`
  - `web/src/main.js`
  - `web/src/styles.css` (only if dynamic layout/preview styling requires adjustments)
  - `web/tests/` (new integration test verifying arbitrary N-section / N-column topology → editor session & dynamic UI model)
- **Non-Goals**: User business-data population rules (`editor-writer.js` company/product dictionaries) remain separated in the execution layer and are not mixed into the universal topology-editor core.
