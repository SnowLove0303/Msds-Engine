# Tasks: Agent Context 2 Gate, HPU-7790 Fix & Repo Cleanup

- [ ] **Task 1**: Add `prepareOnly` / `approveContext2` / `translations` gate + SHA-256 digest + review package export in `production-orchestrator.js` and `run_standard_production.mjs`.
- [ ] **Task 2**: Fix `多元醇分散体` / `含聚碳酸酯结构的多元醇聚合物` & P2 GHS terms in `context-governor.js`, and highlight fuzzy matches in `serializeContext2ToMarkdown`.
- [ ] **Task 3**: Sync `SKILL.md` and `README_FOR_AGENT.md` with the mandatory Two-Phase Agent Context 2 workflow.
- [ ] **Task 4**: Verify hard block without `--approveContext2` (exit 1), then run `HPU-7790` via `--prepareOnly` -> Agent proofread -> `--approveContext2` -> 4-md audit `PASS`.
- [ ] **Task 5**: Clean up loose debug scripts into `scratch/legacy_debug/`, update `.gitignore` (`git rm --cached web/data/msds_repo.db`), commit & push `MSDS-Engine` to `origin`.
