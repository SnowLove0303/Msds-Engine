# Design: 统一标准入口与工作流闭环

1. `web/src/editor-writer.js`：在 `enforceStructuralTypographyInvariants` 之后调用 `applyTopologyTypographyLock(session)`，使 `PA` 标准链路自动享有 `S3/S8` 居中零缩进、通用化学式上下标与 `S1/S8` 局部规范锁定。
2. `web/src/production-orchestrator.js` & `web/scripts/produce_standard_deliverables.mjs`：
   - 增加可选 `wordDir` / `pdfDir` 参数（未传时兼容原有 `targetDir`）；
   - 在阶段 6 中接入 `staged-mechanical-audit.js`（执行 `P6_PDF_NO_LIBREOFFICE`、`P5_S3_ZERO_INDENT`、`P5_S8_OEL_ALIGNMENT`、`P5_S11_DUAL_PARADIGM`、`P5_EN_CHEMICAL_SUBSCRIPT`）。
3. `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`：
   - 顶层红线章节加入**【唯一法定生产入口与非标准路径禁令声明】**，明确禁止任何 Agent 绕过 `produce_standard_deliverables.mjs` / `msds_batch_export_eight`。
4. 清退 `scratch/compile_models.py` 与 `scratch/convert_msds_pdf_official.mjs`。
