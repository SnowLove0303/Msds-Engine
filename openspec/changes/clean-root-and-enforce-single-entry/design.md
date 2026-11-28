# Design: Root Hygiene & Single-Entry Enforcement

## 1. Strict Allowlists
- **Repository Root Allowed Files**:
  - Config/Meta: `.gitignore`, `.dockerignore`, `package.json`, `Dockerfile`, `docker-compose.yml`
  - Core Governance Docs: `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `PROJECT_CONSTITUTION.md`, `MAINTENANCE_GUIDE.md`, `CHANGELOG.md`
  - Launchers: `docker-start.bat`, `启动Agent-API服务.bat`, `启动Web工作台.bat`
- **`web/` Root Allowed Files**:
  - `index.html`, `package.json`, `package-lock.json`, `README.md`, `server.mjs`, `vite.config.js`, `run-msds-studio.bat`

## 2. Archive Destinations (Zero Deletion, 100% Traceable)
- All `web/` root ad-hoc `.mjs` / `.py` scripts -> `archive/legacy-scripts/web/`
- `web/项目交接文档.md` -> `docs/handover/项目交接文档.md`
- Root `MSDS*.md` reports -> `docs/specs/`
- Root `RELEASE_NOTES_*.md` -> `docs/releases/`

## 3. Single-Entry & Hygiene Linter (`LINT-ROOT-HYGIENE-01`)
- Extend `web/scripts/lint_code_invariants.mjs` to scan repo root and `web/` root files against the allowlists above. Any stray `.js`/`.mjs`/`.py` script immediately triggers a lint failure, preventing Agents from bypassing unified entrypoints by dropping ad-hoc scripts in root.
