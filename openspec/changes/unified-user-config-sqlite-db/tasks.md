# Tasks: Unified SQLite User-Config DB

- [ ] 1. Create `web/src/user-config-db.js` (`user_config.db` via `node:sqlite`) with `user_templates`, `user_presets`, and `user_naming_patterns` tables and full CRUD (zero hardcoded user-data seeds), and add `web/data/user_config.db*` to `.gitignore`.
- [ ] 2. Expose `/api/msds/user-templates` CRUD routes (auto-building & caching 9-layer `MsdsEngineStandardTopology` on upload) and wire `/api/msds/naming-patterns` to `user-config-db.js` in `web/src/msds-api-controller.js`.
- [ ] 3. Wire `user-config-db.js` into `fetchAvailableUserPresets` and `fetchAvailableNamingPatterns` in `web/src/production-orchestrator.js`, and add `LINT-UCFG-PURE-01` to `web/scripts/lint_code_invariants.mjs`.
- [ ] 4. Add `web/tests/test_user_config_db.mjs` and run all tests, `npm run lint --prefix web`, and `openspec validate unified-user-config-sqlite-db --strict`.
