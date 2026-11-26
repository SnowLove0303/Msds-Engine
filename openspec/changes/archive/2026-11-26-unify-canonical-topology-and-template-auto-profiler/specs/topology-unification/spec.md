# Specification: Canonical Topology Unification & Template Auto-Profiler

## Requirement R1: Single Canonical Topology & Bilingual Content Projection
- **R1.1**: The topology compiler (`compileTopologyOps`) SHALL treat the semantic section/row/column hierarchy and paragraph structure as a single language-agnostic canonical topology, and SHALL project `CN` or `EN` text onto identical structural slots.
- **R1.2**: WHEN `context-governor.js` builds multi-paragraph or multi-study rich text (e.g., S11 `11.6` Buehler / LLNA studies), the EN projection SHALL inherit the exact paragraph array and blank-line separators from the canonical IR without re-guessing structural boundaries via downstream regexes.
- **R1.3**: WHEN normalizing shared structural anchors (such as S3 `3.2\t成分` / `3.2\tIngredients`), `topology-matcher.js` SHALL resolve them through unified role/anchor matching rather than language-specific hardcoded row indices, while preserving explicitly locked business exceptions (`@ANTIGRAVITY_INVARIANT_LOCK`).

## Requirement R2: Template Auto-Profiler & Anti-Outlier Geometry Discovery
- **R2.1**: WHEN `inspectTemplateSchema` loads any `.docx` template, it SHALL dynamically extract a `TemplateProfile` containing:
  - `geometryProfile.standardTableWidthDxa`: dominant (mode) table width across valid section tables (`>= 5000 dxa` and `<= 15000 dxa`), falling back to `9781` only if undetectable;
  - `geometryProfile.standardTwoColGridDxa`: dominant 2-column `[col0, col1]` width pair across 2-column KV tables, falling back proportionally or to `[3519, 6262]` only if undetectable;
  - `typographyProfile`: observed `fontFamily`, `seqFontFamily`, `labelFontSize`, `seqFontSize`, `valueFontSize`, and `tabStops` from live template runs/paragraphs, falling back to language defaults only for missing properties.
- **R2.2**: `applyTopologyTypographyLock` SHALL consume the extracted `TemplateProfile` (rather than hardcoded constants) when unifying table widths, 2-column grids, and role typography across all 16 sections.

## Requirement R3: Single-Source Profile for Rendering & Mechanical Audit
- **R3.1**: `staged-mechanical-audit.js` SHALL accept an optional `templateProfile` (and when omitted, derive the dominant table width mode from the audited document's own 16 section tables within valid bounds) so that `P5_TABLE_WIDTH_UNIFIED` verifies **internal uniformity against the active template's dominant width** rather than failing on legitimate new-margin templates.
- **R3.2**: `P5_GLOBAL_ROLE_TYPOGRAPHY` SHALL validate run typography against the active `templateProfile` when provided, while continuing to enforce strict zero-drift role consistency (`SEQ_NUM`, `LABEL`, `VALUE`, `EXPLANATION`, `BOLD_EXPLANATION`).
- **R3.3**: Running `run_standard_production.mjs` on `HPU-7651` after the upgrade SHALL produce exit code `0` and pass all 174 Master Audit checks, Staged Mechanical Audit, and 112 Bilingual Fidelity checks with zero regressions from v5.
- **R3.4**: Running a synthetic modified-template regression test (e.g., a template whose table width is `9000 dxa` and value font size is `20`) SHALL adapt both rendered output and mechanical audit cleanly with exit code `0`.

## Requirement R4: Governance Documentation Sync
- **R4.1**: Both `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md` and `体系交接文档\MSDS_Studio_Agent_Test_Kit\skill\SKILL.md` SHALL document the Single Canonical Topology + Template Auto-Profiler architecture and forbid language-divergent topology patches or hardcoded template dimensions.
