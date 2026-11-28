# End-to-End User Config Wiring Specification

## ADDED Requirements

### Requirement: Presets API Persistence in User Config SQLite DB
The `/api/msds/presets` endpoints MUST persist new and updated presets into `user_presets` via `user-config-db.js`, while merging any legacy presets from `msds-db.js` on read.

#### Scenario: Save and list preset via API
- **WHEN** a client sends `POST /api/msds/presets` with a valid preset payload
- **THEN** the preset is stored in `user_config.db` (`user_presets`) and returned by `GET /api/msds/presets`.

### Requirement: SQLite User Template Resolution in Template Editor
`inspectTemplateSchema` and `createWorkSession` in `web/src/template-editor.js` MUST resolve `user_templates` IDs (`tpl_...`) from `user-config-db.js` using their stored `.docx` BLOB and cached 9-layer topology.

#### Scenario: Inspect and open work session by SQLite template ID
- **WHEN** `inspectTemplateSchema(tplId)` or `createWorkSession(tplId)` is called with a valid `user_templates` ID
- **THEN** the template `.docx` buffer and cached topology are loaded from `user_config.db` without requiring a local `TEMPLATE_LIBRARY` entry.

### Requirement: Web UI Template Upload Persistence and Naming Pattern Management
Uploading a `.docx` template in `web/src/main.js` MUST persist the template to `POST /api/msds/user-templates`, and the UI MUST provide reusable naming pattern selection and saving via `/api/msds/naming-patterns`.

#### Scenario: Upload DOCX in editor
- **WHEN** the user uploads a `.docx` file via `#editor-upload-docx-input`
- **THEN** the client best-effort persists the template and its topology to `POST /api/msds/user-templates`.
