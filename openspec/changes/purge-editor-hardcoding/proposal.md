# Proposal: Purge Residual P0/P1 Hardcoding from Universal Editor & Web UI

## Why
Our comprehensive hardcoding audit confirmed that while `template-topology-recognizer.js` and `topology-plugin-slot.js` are 100% pure (zero hardcoded section counts, dimensions, fonts, or company names), residual P0/P1 hardcodings remain in the editor and Web UI layers:
1. **`render-utils.js` (P0)**: Line 148 hardcodes `record?.sectionNumber === 16 && /就我们所掌握的知识/i`.
2. **`universal-editor-primitives.js` (P0)**: `applyGlobalTypographyProjection` unconditionally executes `sectionNumber === 11` special-case branches without respecting dynamic/non-legacy mode.
3. **`template-editor.js` (P0)**: `detectTemplateProfile` (`secNum < 1 || secNum > 16`) and `applyTopologyTypographyLock` (`secNum >= 1 && secNum <= 16`, plus unguarded `secNum === 2/3/8/9/11` special cases) still assume 16 sections and legacy template layouts when dynamic topology mode is active.
4. **`main.js` (P1)**: Topbar (`16 sections ready`), `scrollToSectionInPreview` (`/ 16`), `sectionNav` fallback (`Array.from({ length: 16 })`), audit toast (`16 节结构通过`), and hardcoded company dropdown defaults (`冠志`/`国彩`) still leak legacy 16-section and company assumptions into the Web UI.

## What Changes
1. **Purify `render-utils.js`**: Remove the Section 16 Chinese disclaimer text hardcoding (`L148`) and rely on general paragraph/role rendering.
2. **Isolate Legacy Quirks in `universal-editor-primitives.js` & `template-editor.js`**:
   - Add an explicit `options.legacyCompat` guard (default `false` when `session.isDynamicTopology` or `typographyProfile` is topology-driven) around `sectionNumber === 11` in `applyGlobalTypographyProjection` and around `secNum === 2/3/8/9/11` in `applyTopologyTypographyLock`.
   - Remove the `1..16` section number cap in `detectTemplateProfile` and `applyTopologyTypographyLock` so any N-section template (e.g., 5, 12, 20, 30 sections) is processed uniformly.
3. **Dynamic Web UI in `main.js`**:
   - Replace hardcoded `16` in topbar badge, `scrollToSectionInPreview`, `sectionNav` fallback (using actual `records.length`), and audit toast (`${records.length} 节结构通过`).
   - Parameterize header/footer company input as a clean generic text input + optional preset list rather than hardcoding `冠志`/`国彩` as fixed system truth in the universal Web shell.

## Impact
- **Affected Files**: `web/src/render-utils.js`, `web/src/universal-editor-primitives.js`, `web/src/template-editor.js`, `web/src/main.js`, `web/tests/test_dynamic_editor_topology.mjs`.
