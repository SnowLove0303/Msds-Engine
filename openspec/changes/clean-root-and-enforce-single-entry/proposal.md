# Proposal: Clean Root Workspace & Enforce Single-Entry Architecture (`clean-root-and-enforce-single-entry`)

## Why
1. **Cluttered Root & `web/` Root**: Over 150 one-off diagnostic, patch, dump, trace, and verification scripts (`check_*.mjs`, `inspect_*.mjs`, `patch_*.mjs`, `prepare_*.mjs`, `scratch_*.mjs`, `verify_*.mjs`, `read_*.py`, etc.) sit directly inside `web/` alongside core app entrypoints (`index.html`, `package.json`, `server.mjs`, `vite.config.js`), and 4 long specification reports + release notes sit directly in the repository root.
2. **Bypassed Single-Entry Discipline**: Historically, Agents bypassed the unified workflow/API entrypoints and wrote ad-hoc scripts directly in the workspace root or `web/`, creating duplicate execution paths and dual-stack drift.
3. **Lack of Automated Hygiene Guard**: `web/scripts/lint_code_invariants.mjs` does not yet block new ad-hoc scripts from being placed in root or `web/` root.

## What Changes
1. **Archive One-Off Scripts (`web/` root -> `archive/legacy-scripts/web/`)**:
   - Move all historical one-off `.mjs` and `.py` scripts from `web/` root into `archive/legacy-scripts/web/`, leaving ONLY clean project entrypoints in `web/` (`index.html`, `package.json`, `package-lock.json`, `README.md`, `server.mjs`, `vite.config.js`, `run-msds-studio.bat`, `项目交接文档.md` -> optionally `docs/`).
2. **Tidy Repository Root**:
   - Keep core project files in root (`package.json`, `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `PROJECT_CONSTITUTION.md`, `MAINTENANCE_GUIDE.md`, `CHANGELOG.md`, `Dockerfile`, `docker-compose.yml`, `docker-start.bat`, `启动Agent-API服务.bat`, `启动Web工作台.bat`, `.gitignore`, `.dockerignore`).
   - Move the 4 specialized spec reports (`MSDS*.md`) and `RELEASE_NOTES_*.md` into `docs/specs/` and `docs/releases/`.
3. **Enforce Single-Entry & Root Hygiene Gate (`lint_code_invariants.mjs`)**:
   - Add a new invariant check `LINT-ROOT-HYGIENE-01` in `web/scripts/lint_code_invariants.mjs` that fails CI/lint if unauthorized `.mjs`, `.js`, `.py` ad-hoc scripts appear in repo root or `web/` root outside the explicit allowlist.
   - Document the **Unified Single-Entry Contract** in `ARCHITECTURE.md` / `AGENTS.md` (all production/editing/audit runs MUST go through `server.mjs` API, `mcp-server.js`, `标准化流程/run_standard_production.mjs`, or `web/tests/`).
