# Design: Reusable Naming Patterns & Workflow/Primitive Purity

## 1. Reusable Naming Patterns
- **DB Table (`naming_patterns` in `msds-db.js`)**:
  - Columns: `id TEXT PRIMARY KEY`, `name TEXT NOT NULL`, `pattern TEXT NOT NULL`, `description TEXT`, `is_default INTEGER DEFAULT 0`, `created_at TEXT`, `updated_at TEXT`.
  - Supported Tokens in `formatDeliverableBaseName`: `{docId}` / `{model}`, `{lang}`, `{preset}`, `{date}` (`YYYY-MM-DD`).
  - Generic Seed: `default_standard` -> `{docId}_{lang}_{preset}` (zero company names!).
- **API Endpoints (`msds-api-controller.js`)**:
  - `GET /api/msds/naming-patterns`
  - `POST /api/msds/naming-patterns`
  - `POST /api/msds/naming-patterns/:id/default`
  - `DELETE /api/msds/naming-patterns/:id`
- **Workflow Integration (`production-orchestrator.js` + `run_standard_production.mjs`)**:
  - `fetchAvailableNamingPatterns({ apiBase })` queries `/api/msds/naming-patterns` with DB fallback.
  - `produceStandardDeliverables` accepts `namingPatternId` (resolved to `pattern` from API/DB) or explicit `outputNamePattern`.

## 2. Adversarial Hardcoding Purge (This Change)
- `run_standard_production.mjs`: 0 hits for `8 格式`, `4 份`, `冠志`, `国彩`.
- `production-orchestrator.js`: 0 hits for `8 格式`, `4 份`, `冠志`, `国彩`.
- `universal-editor-primitives.js`: remove `/广州冠志|英德国彩/i` at line 1008; match dynamically against `preset` entity strings.
