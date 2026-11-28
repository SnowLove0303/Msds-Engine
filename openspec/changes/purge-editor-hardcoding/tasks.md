# Tasks: Purge Residual P0/P1 Hardcoding

- [ ] 1. Remove Section 16 text hardcoding in `web/src/render-utils.js` (line 148).
- [ ] 2. Guard `sectionNumber === 11` special branches in `web/src/universal-editor-primitives.js` behind `legacyCompat` so dynamic topology mode runs with 0 section special cases.
- [ ] 3. Remove `1..16` section caps in `detectTemplateProfile` and `applyTopologyTypographyLock` in `web/src/template-editor.js`, and guard all `secNum === 2/3/8/9/11` special cases behind `session.legacyCompat !== false`.
- [ ] 4. Replace hardcoded `16` (`16 sections ready`, `/ 16` scroll ratio, `sectionNav` 16-item fallback, `16 节结构通过` toast) and hardcoded company dropdown defaults in `web/src/main.js` with dynamic topology/record-driven values.
- [ ] 5. Extend `web/tests/test_dynamic_editor_topology.mjs` to assert >16 sections (e.g., 18 sections) and Section 11/8/9/3 immunity in dynamic mode, then run all tests, `npm run lint --prefix web`, and `openspec validate purge-editor-hardcoding --strict`.
