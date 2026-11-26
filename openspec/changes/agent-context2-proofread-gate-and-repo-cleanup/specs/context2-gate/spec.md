# Specification: Agent Context 2 Proofread Gate & Translation Precision

## Requirement R1: Two-Phase Agent-in-the-Loop Gate
- **R1.1**: WHEN `produceStandardDeliverables` / `run_standard_production.mjs` is invoked with `--prepareOnly`, it SHALL execute Stage 1–3 (`Context 1 -> Context 2`), write `<MODEL>_context2_review.md` and `<MODEL>_context2_translations.json` to `targetDir`, and exit cleanly (`status: 'AWAITING_AGENT_PROOFREAD'`) without modifying templates or producing DOCX/PDF.
- **R1.2**: WHEN `produceStandardDeliverables` / `run_standard_production.mjs` is invoked without `--prepareOnly` and without `--approveContext2`, it SHALL immediately throw `[CONTEXT2_AGENT_APPROVAL_REQUIRED]` and exit with code `1`.
- **R1.3**: WHEN invoked with `--approveContext2` (and optional `--translations=<path>`), it SHALL inject the Agent-proofread translations into `buildStructuredContext2`, record a SHA-256 `translationsDigest` in the stage summary/manifest, and execute Stage 4–6.

## Requirement R2: HPU-7790 & Terminology Precision
- **R2.1**: `translateChemicalTerm` SHALL match `多元醇分散体` (`Polyol dispersion`) and `含聚碳酸酯结构的多元醇聚合物` (`Polycarbonate-containing polyol polymer`) before generic `多元醇` (`Polyol`).
- **R2.2**: `STANDARD_LABEL_EN` / `CHEMICAL_TRANSLATION_DICT` SHALL use standard GHS terms (`S6.1`: `ventilation/exhaust`, `S13`: `Disposal considerations`).

## Requirement R3 & R4: Docs, Repo Cleanup & Git Push
- **R3.1**: `SKILL.md` and `README_FOR_AGENT.md` SHALL document the mandatory `--prepareOnly` -> Agent Proofread -> `--approveContext2` workflow.
- **R4.1**: Loose one-off debug scripts in root and `web/src/` SHALL be moved to `scratch/legacy_debug/` (ignored by Git), `web/data/msds_repo.db*` and output directories SHALL be ignored in `.gitignore`, and the clean repository SHALL be pushed to `origin`.
