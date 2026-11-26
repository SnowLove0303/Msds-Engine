# Spec: 唯一法定标准生产入口与禁绕立法

## ADDED Requirements

### Requirement: RTM-01 & RTM-02 唯一标准入口与非标准路径清退
- All formal 8-deliverable MSDS production **SHALL** execute exclusively through `web/scripts/produce_standard_deliverables.mjs` (`production-orchestrator.js`) or MCP `msds_batch_export_eight`.
- Ad-hoc bypass scripts (such as `compile_models.py` and `convert_msds_pdf_official.mjs`) **SHALL** be physically removed.

### Requirement: RTM-03 标准入口合流最新底层架构
- `editor-writer.js` **SHALL** invoke `applyTopologyTypographyLock(session)` so deliverables produced via `production-orchestrator.js` inherit zero-indent centering (`S3`/`S8`) and bilingual chemical subscript rendering (`CO2`, etc.).
- `production-orchestrator.js` and `produce_standard_deliverables.mjs` **SHALL** support `--wordDir` / `--pdfDir` (for direct `TDS MSDS 重写版/Word` & `PDF` output) and run `staged-mechanical-audit.js` (`runStagedMechanicalAudit`) in Stage 6.

### Requirement: RTM-04 SKILL 严格立法声明
- `msds-studio/SKILL.md` **SHALL** declare `produce_standard_deliverables.mjs` / `msds_batch_export_eight` as the sole legal production entrypoint, explicitly prohibiting any Agent bypass, and requiring mandatory Agent Audit Task 1 & Task 2 after every production run.
