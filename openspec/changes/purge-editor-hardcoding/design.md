# Design: Purging Residual P0/P1 Editor Hardcoding

## 1. Universal Purity Rules
- **Arbitrary Section Count (N >= 1)**: Neither `detectTemplateProfile`, `applyTopologyTypographyLock`, `sectionNav`, `scrollToSectionInPreview`, nor topbar/audit labels may assume `16` sections. All counts derive from `topology.sectionsCount` or `records.length`.
- **Zero Legacy Section Special-Cases in Dynamic Mode**:
  - In `template-editor.js` (`applyTopologyTypographyLock`): when `session.isDynamicTopology === true` (or `session.legacyCompat === false`), skip all `secNum === 2/3/8/9/11` special branches and rely strictly on `topologySection` (`columnWidths`, `rowTemplates`, `stylePrototypes`, `typographyProfile`).
  - In `universal-editor-primitives.js` (`applyGlobalTypographyProjection(engine, isEnglish, typographyProfile, docDefaults, options)`): skip `sectionNumber === 11` special branches when `options?.legacyCompat === false` (or when `typographyProfile` is supplied from dynamic topology).
- **Zero Content Text Hardcoding in `render-utils.js`**: Remove `record?.sectionNumber === 16 && /就我们所掌握的知识/i` at line 148.
- **Generic Web UI Shell (`main.js`)**:
  - Topbar dynamically shows `${activeCount} sections ready` (or `0 sections` before mount).
  - `scrollToSectionInPreview` divides by `Math.max(1, totalSections)` instead of `16`.
  - `sectionNav` iterates actual `records` in all modes when `records.length > 0`.
