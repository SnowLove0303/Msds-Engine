## 1. API & Persistence Wiring
- [x] 1.1 Wire `/api/msds/presets` CRUD and default routes in `web/src/msds-api-controller.js` to `user-config-db.js` (`user_presets`) with legacy read merge.

## 2. Editor & Workflow Template Resolution
- [x] 2.1 Resolve `user_templates` IDs (`tpl_...`) from `user-config-db.js` in `inspectTemplateSchema` and `createWorkSession` inside `web/src/template-editor.js`.

## 3. Web UI Integration
- [x] 3.1 Persist uploaded `.docx` templates in `web/src/main.js` via `POST /api/msds/user-templates` and wire reusable naming pattern fetch/select/save via `/api/msds/naming-patterns`.

## 4. Verification
- [x] 4.1 Extend `web/tests/test_user_config_db.mjs` to verify `user_templates` resolution through `inspectTemplateSchema` & `createWorkSession` and `user_presets` persistence.
- [x] 4.2 Run full test suite, `npm run lint --prefix web`, and `openspec validate wire-user-config-end-to-end --strict`.
