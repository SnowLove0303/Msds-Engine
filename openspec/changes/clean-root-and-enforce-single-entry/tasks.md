# Tasks: Clean Root & Enforce Single-Entry

- [ ] 1. Archive all historical one-off `.mjs` and `.py` scripts from `web/` root into `archive/legacy-scripts/web/` and move `web/项目交接文档.md` to `docs/handover/`.
- [ ] 2. Move the 4 `MSDS*.md` reports and `RELEASE_NOTES_*.md` from repo root into `docs/specs/` and `docs/releases/` so repo root retains only core config, governance docs, and launchers.
- [ ] 3. Add `LINT-ROOT-HYGIENE-01` allowlist check to `web/scripts/lint_code_invariants.mjs` to block future ad-hoc script drops in repo root and `web/` root.
- [ ] 4. Run `npm run lint --prefix web`, `node web/tests/test_dynamic_editor_topology.mjs`, `node web/tests/test_pluggable_cn_template.mjs`, `node web/tests/test_zero_hardcoding_e2e.mjs`, and `openspec validate clean-root-and-enforce-single-entry --strict`.
