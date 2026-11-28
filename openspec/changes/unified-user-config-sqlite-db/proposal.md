# Proposal: Unified SQLite User-Config Database (`unified-user-config-sqlite-db`)

## Why
Currently:
1. User templates and their built 9-layer `MsdsEngineStandardTopology` bundles have no SQLite persistence (only loose files under `web/public/templates/custom/`).
2. `msds-db.js` (`msds_repo.db`) mixes user presets/naming patterns with hardcoded `Guanzhi`/`Guocai` default seeds (`seedDefaultPresets`), while `user-exec-db.js` only logs execution runs and audit findings.

## What Changes
1. **Create Dedicated User Config SQLite Database (`web/src/user-config-db.js` -> `web/data/user_config.db`)**:
   - Store `user_templates` (including `docx_blob`, `sha256`, cached 9-layer `topology_json`, `completeness_ok`, `sections_count`), `user_presets`, and `user_naming_patterns` in a dedicated `.gitignore`-protected SQLite database (`node:sqlite`), with **zero** hardcoded company/user-data seeds.
2. **Expose User Templates & Config APIs (`web/src/msds-api-controller.js`)**:
   - Add `/api/msds/user-templates` CRUD routes (`GET`, `POST` with automatic 9-layer topology build & caching, `GET /:id`, `POST /:id/default`, `DELETE /:id`).
   - Connect `/api/msds/naming-patterns` to `user-config-db.js`.
3. **Wire Workflow & Lint Purity (`web/src/production-orchestrator.js`, `.gitignore`, `web/scripts/lint_code_invariants.mjs`)**:
   - Update `fetchAvailableUserPresets` and `fetchAvailableNamingPatterns` to include `user-config-db.js` records first (before legacy `msds-db.js`), and add `web/data/user_config.db*` to `.gitignore` + `LINT-UCFG-PURE-01` gate on `user-config-db.js`.
4. **Add Automated Tests (`web/tests/test_user_config_db.mjs`)**:
   - Test template upload -> 9-layer topology build & SQLite persistence -> preset + naming pattern binding -> default switching -> deletion & cleanup.
