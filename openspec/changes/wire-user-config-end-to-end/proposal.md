# Change: Wire User Config SQLite DB End-to-End

## Why
`web/src/user-config-db.js` (`web/data/user_config.db`) provides dedicated SQLite tables for `user_templates`, `user_presets`, and `user_naming_patterns`, and `/api/msds/user-templates` and `/api/msds/naming-patterns` are already exposed. Three integration gaps remain to achieve full end-to-end connectivity (`Web UI <-> API <-> user_config.db <-> workflow/editor`):
1. `/api/msds/presets` CRUD in `web/src/msds-api-controller.js` still reads/writes only legacy `msds-db.js`.
2. `inspectTemplateSchema` and `createWorkSession` in `web/src/template-editor.js` only resolve `TEMPLATE_LIBRARY` keys or disk paths, not SQLite `user_templates` IDs (`tpl_...`).
3. `web/src/main.js` does not yet persist uploaded `.docx` templates to `/api/msds/user-templates` or allow selecting/saving reusable naming patterns via `/api/msds/naming-patterns`.

## What Changes
- **Presets API (`web/src/msds-api-controller.js`)**: Wire `GET/POST/PUT/DELETE /api/msds/presets` and `.../default` to `user-config-db.js` (`user_presets` table), merging legacy `msds-db.js` presets on read for backward compatibility.
- **Template Resolution (`web/src/template-editor.js`)**: Support resolving `user_templates` IDs (`tpl_...`) from `user-config-db.js` (`getUserTemplateById(id, { includeBlob: true })`) in both `inspectTemplateSchema` and `createWorkSession` using stored `docxBuffer` and cached `topology`.
- **Web UI (`web/src/main.js`)**: Persist uploaded `.docx` templates to `POST /api/msds/user-templates` (best-effort when backend is active) and provide reusable naming pattern fetch/select/save UI wired to `/api/msds/naming-patterns`.
- **Tests (`web/tests/test_user_config_db.mjs`)**: Add end-to-end assertions for SQLite `user_templates` ID resolution in `inspectTemplateSchema` and `createWorkSession`, and `user_presets` CRUD.

## Impact
- Affected specs: `end-to-end-user-config-wiring`
- Affected code: `web/src/msds-api-controller.js`, `web/src/template-editor.js`, `web/src/main.js`, `web/tests/test_user_config_db.mjs`
