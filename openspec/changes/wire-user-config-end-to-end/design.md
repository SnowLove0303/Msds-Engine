# Design: End-to-End User Config SQLite Wiring

## Context
- `web/src/user-config-db.js` stores `user_templates`, `user_presets`, and `user_naming_patterns` in `web/data/user_config.db` with zero hardcoded company/template defaults.
- `web/src/production-orchestrator.js` already reads merged presets (`user-config-db.js` + `msds-db.js`) and passes `matchedPreset.targetTemplate` (which may be a `tpl_...` ID) into `inspectTemplateSchema(tplKey)` and `handleToolCall('msds_execute_editor_ops', { templateKey: tplKey, ... })`.

## Decisions
1. **Presets CRUD Dual-Read / Primary-Write**:
   - `GET /api/msds/presets`: Merge `listUserPresets()` from `user-config-db.js` with legacy `listPresets()` from `msds-db.js` (deduplicating by `id`, preferring `user_presets`).
   - `POST /api/msds/presets`: Save to `saveUserPreset()` in `user-config-db.js`.
   - `POST /api/msds/presets/:id/default`: Try `getUserPresetById(id)` -> `setDefaultUserPreset(id)`; fallback to legacy `setDefaultPreset(id)` if only in `msds-db.js`.
   - `DELETE /api/msds/presets/:id`: Delete from `deleteUserPreset(id)` and legacy `deletePreset(id)`.
2. **SQLite Template Resolution Helper in `template-editor.js`**:
   - Add a small helper `resolveUserTemplateRecord(templateKey)` that checks if `templateKey` is a non-empty string, calls `getUserTemplateById(templateKey, { includeBlob: true })` (catching DB errors gracefully so pure/file paths are unaffected), and returns `{ buffer, fileName, topology }`.
   - Both `inspectTemplateSchema` and `createWorkSession` check `resolveUserTemplateRecord(templateKey)` before falling back to `TEMPLATE_LIBRARY` or file paths.
3. **Web UI Integration (`main.js`)**:
   - In `#editor-upload-docx-input` change handler, after `/api/msds/templates/inspect` succeeds (or in parallel), `POST /api/msds/user-templates` with base64 `docxBase64`, `name`, `topology`, and store returned `template.id` on `state.editor.userTemplateId`.
   - Load `/api/msds/naming-patterns` when rendering/initializing naming pattern controls and allow saving/selecting reusable naming patterns via `POST /api/msds/naming-patterns`.
