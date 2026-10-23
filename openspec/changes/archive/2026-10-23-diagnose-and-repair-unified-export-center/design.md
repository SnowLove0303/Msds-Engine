# Design

## Context

### User-visible audit report, 2026-10-20 (Asia/Shanghai)

Audit target: the existing Chrome tab `http://127.0.0.1:5173/`, MSDS Studio, OS-8970 editor. The browser accessibility state showed “有未导出修改”; the export center listed both `正式模板 · CN 冠志 (国标 GHS)` and `正式模板 · EN 冠志 (OSHA GHS)` as `未就绪 (草稿编辑中)`, explained the baseline was not completed or contained unsaved edits, listed `0 份 Word · 0 份 PDF`, and rendered `导出 ZIP` disabled. This is the immediate, confirmed reason the current click cannot start export.

The client code confirms the gate. `computeExportTargets()` at `web/src/main.js:798` only admits a baseline when `draft.status === 'completed' && !draft.dirty && draft.engine`. `renderUnifiedExportModal()` at `:893` independently renders the same eligibility rule; `:1038` disables export when `targets.length === 0`. The export operation at `:4433` recomputes targets and returns early with “未选择任何导出组合…已就绪版本” when none exist. Format checkboxes default Word/PDF on, but formats do not create eligible targets.

Do not conflate this expected eligibility block with a proven ZIP generator failure. The selected OS-8970 editor had unsaved changes, and no draft was marked complete or altered during this diagnosis. The proper ready-draft operation path has not yet been exercised on disposable test data.

### Separate modal layout regression

`renderUnifiedExportModal()` at `web/src/main.js:893` emits `.modal-backdrop > .modal-card.unified-export-dialog`. The stylesheet defines `.unified-export-dialog` sizing/surface beginning at `web/src/styles.css:2572`, but contains no corresponding `.modal-backdrop` fixed full-screen overlay or centered layout rule. The captured Chrome screenshot showed the export card appended at the bottom-left after the editor content, while the document page remained visible above. This is independently confirmed and is the same class of regression as preset management.

### Export execution and PDF conversion risk

Once targets are eligible, the frontend generates DOCX bytes, optionally requests `POST /api/msds/convert-pdf-batch`, assembles `finalFiles`, then creates and downloads a ZIP (`web/src/main.js:4433–4595`). The converter endpoint in `web/src/msds-api-controller.js:1040+` can return explicit 503 when PDF capability is unavailable.

However, the client’s conversion catch path at `main.js:4532+` only logs a warning; after that, it assembles whatever files exist. In Word+PDF mode it may still ZIP the Word subset without a clear requested-versus-produced completeness report; in PDF-only mode it may end with zero files and a generic failure toast. `downloadBlob()` clicks a temporary anchor and revokes the URL after one second; no download acknowledgement is awaited. These are source-level risks requiring targeted verification, not failures reproduced in this session.

The local shell request to `http://127.0.0.1:5173/api/msds/health` was refused during this audit, so PDF runtime availability and a real ZIP download were not checked. Existing browser DOM was already open and readable; no API or export POST was triggered.

## Goals / Non-Goals

**Goals:** Independent export modal; clear actionable readiness state; truthful selected formats, target counts and ZIP contents; diagnoseable conversion errors; accessible keyboard lifecycle.

**Non-Goals:** Altering baseline completion policy, persisting drafts, changing preset ownership, rewriting DOCX generation or deploying Docker. If these existing gaps block valid export, document them and propose their separate functional work rather than silently bypassing them.

## Decisions

### 1. Treat eligibility, selection, and execution as separate stages

The modal must show, per baseline: `未开始`, `编辑中`, `有未保存修改`, `已完成/可导出`; selection availability follows the existing readiness contract. When zero targets exist, explain the exact reason and route to edit/complete. When ready targets exist but none is checked, say selection is missing. Do not change the complete-and-clean readiness predicate as part of modal repair without a separate product decision.

Check whether the UI has a truthful save/complete path. A “mark complete” control exists in the baseline selector, but the exact interaction with dirty drafts and persistence across reload remains part of the known 10.1–10.4 backlog; do not imply durable saving unless verified.

### 2. Restore a dedicated modal shell

Use a dedicated export backdrop/class and bounded centered dialog. Initial target: width `min(880px, calc(100vw - 48px))`, max-height `84vh` desktop, narrow width `calc(100vw - 24px)` and max-height `calc(100dvh - 24px)`. Keep header/close and footer actions outside the scrollable body. The body alone scrolls. Match the established light surface tokens. Scope styles to export center; do not introduce blanket `.modal-*` rules that unexpectedly modify other dialogs.

### 3. Freeze and account for requested artifacts

Before conversion, capture eligible selected targets and requested formats. Build a planned artifact list. Generate DOCX once per target; convert the corresponding bytes to PDF when requested; compare every planned item with actual output names and sizes before ZIP creation. Prevent duplicate ZIP names from overwriting entries. For mixed-format partial failure, clearly state which files were produced and which failed; the success action and message must represent actual contents, not the original request count. For PDF-only failure, do not download an empty or substitute package.

Do not remove graceful Word delivery on PDF capability absence if the user requested both formats, but explicitly label it partial and provide retry/details. Respect the portable PDF capability preflight contract.

### 4. Keep modal state accessible and non-destructive

Apply background inertness after render to current live siblings, preserving their original states and excluding the modal/ancestors. Use one keyboard listener for modal close/trap. Restore focus by stable trigger selector after DOM reconstruction. Selection rerenders preserve active control. Closing export does not modify drafts or saved preferences.

### 5. Validation strategy

Use the existing Chrome 5173 page. First reproduce the zero-target state without mutating OS-8970 or marking it complete. Use a disposable/in-memory ready fixture or explicit test session for actual export. If no safe application pathway exists because drafts are unpersisted, keep execution validation blocked and identify that exact prerequisite. Verify modal at 1920x1080, 1366x768 and 320x800, export with 0/1/multiple targets, Word-only, PDF-only, both, converter unavailable/failure, filename collision, ZIP actual contents, close/focus, and no impact to editing data.

## Risks / Trade-offs

- Readiness is stricter than users expect → show a direct reason and completion route; never silently bypass it.
- PDF converter can return partial data → compare planned/actual manifests and label partial results explicitly.
- Modal styling can leak to other windows → dedicated selectors, computed-style checks on other dialogs.
- Current app service was not reachable from terminal at audit → live converter and download behavior remain unverified until the normal 5173/API service is available.

## Migration Plan

No schema or data migration. Add/fix scoped modal structure and CSS, readiness messaging, target manifest/error handling, then verify through disposable data. Preserve the user's current unsaved editor state. Do not archive until a supervisor independently audits the live page and exports.

## Audit Summary

Confirmed: current export is blocked because both baselines are editing/dirty and `computeExportTargets()` yields no target; export button is therefore disabled. Confirmed: export markup exists but required backdrop positioning styles are absent, so it renders at the bottom of the page. Source risk: PDF failure can leave a partial ZIP path without request/actual reconciliation. Unverified: API PDF health at runtime, export from a ready baseline, browser download completion and actual ZIP contents. This report records diagnosis, not successful repair.
