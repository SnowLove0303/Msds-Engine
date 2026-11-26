# Tasks: Unify Canonical Topology & Template Auto-Profiler

- [x] **Task 1**: Implement `detectTemplateGeometryProfile` and full `typographyProfile` auto-detection in `web/src/template-editor.js`, and wire `GLOBAL_ROLE_STYLE_TOKENS` + `applyTopologyTypographyLock` to consume the detected `TemplateProfile` dynamically.
  - Verify: `node --check "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\template-editor.js"` (exit code 0).
- [x] **Task 2**: Unify remaining non-locked language topology branches in `web/src/topology-matcher.js` (e.g. S3 `3.2` sub-header matching without hardcoded `tplRows[2]`/`lang === 'zh'`) while preserving all `@ANTIGRAVITY_INVARIANT_LOCK` blocks.
  - Verify: `node --check "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\topology-matcher.js"` (exit code 0).
- [x] **Task 3**: Update `web/src/staged-mechanical-audit.js` (and pass `templateProfile` from `docx-engine.js` / `run_standard_production.mjs` if applicable) so `P5_TABLE_WIDTH_UNIFIED` and `P5_GLOBAL_ROLE_TYPOGRAPHY` validate against the active `TemplateProfile` (or dynamic mode table width) instead of hardcoded `9781`.
  - Verify: `node --check "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\staged-mechanical-audit.js"` (exit code 0).
- [x] **Task 4**: Update `SKILL.md` (global skill + `体系交接文档\MSDS_Studio_Agent_Test_Kit\skill\SKILL.md`) to codify Single Canonical Topology + Template Auto-Profiler rules (R4).
  - Verify: Diff review of both `SKILL.md` files.
- [x] **Task 5**: Run full `HPU-7651` regression via `msds-overwrite-producer` (`run_standard_production.mjs`) and `msds-three-task-auditor`, PLUS run a synthetic modified-template test (e.g., `9000 dxa` width + custom font size) proving both renderer and mechanical audit adapt cleanly with exit code `0`.
  - Verify: Exit code `0` on `run_standard_production.mjs`, v6 3-task audit `PASS`, and synthetic template test `PASS`.
