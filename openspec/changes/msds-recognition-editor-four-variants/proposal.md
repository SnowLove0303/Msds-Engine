# Proposal

## Why

The current editor replaces a single working engine when switching templates, while the export matrix can generate other-language outputs from that engine without a prepared draft. Users need independent durable work per registered template baseline, correctly scoped presets, and truthful Word/PDF delivery that can grow beyond the two current templates.

## What Changes

- Add a local, explicit handoff from the recognized 16-section model into a fresh template-editor working copy; preserve the recognition result and source bytes.
- Build a reviewed semantic mapping before writing. Exact/registered label matches may populate template value cells; ambiguous or unsupported source content remains visible as a blocker rather than being guessed or dropped.
- Support independently edited template baselines identified by stable IDs, initially seeded from the maintained CN/EN templates. Keep one durable draft per workspace and baseline; switching restores each draft instead of replacing it. Language and company metadata MUST NOT define export routing or preset ownership.
- Bind each reusable preset to exactly one template baseline. Export only selected, saved and reviewed baseline drafts and their own presets, with Word/PDF selection and one ZIP delivery. A missing baseline draft MUST NOT be manufactured from another draft, an empty template, or a renamed source.
- Persist product metadata in template-owned slots, require review for any explicitly transferred or translated content, and preserve source/template bytes. Baseline readiness and review are scoped to the selected draft revision; an unprepared unrelated baseline does not block a prepared one.
- Extend saved-package checks to confirm footer/header overlays survive export and that cross-company safety content is unchanged.

## Capabilities

### New Capabilities

- `msds-recognition-editor-handoff`: reviewed transfer of locally recognized source data into a fresh, protected template-editor working copy.
- `msds-company-language-variants`: template-baseline draft persistence, baseline-owned presets, and revision-bound multi-format export; the historical four outputs become configured examples rather than a fixed matrix.

### Modified Capabilities

None. The two capabilities in this change are not yet archived to durable specs; existing unrelated durable specs remain unchanged.

## Impact

### Current execution slice: UI cleanup and failed acceptance repairs

The next Agent round implements tasks 11.1–11.10 and repairs acceptance gaps 10.5–10.8. It covers the existing local 5173 application shell, with priority on the template editor, preset editing strip, preset manager and export dialog; recognition/matching shared controls receive the same visual primitives. The user requires less permanent explanatory copy, task-focused controls, consistent colors/type/spacing, horizontal and vertical alignment, and real browser verification. This explicitly supersedes the historical design's exclusion of application-shell restyling. DOCX document formatting stays template-owned.

Draft persistence, revision readiness, preset ownership and frozen export remain required work in sections 5–10.4, but are a separately reported functional backlog for this dispatch. UI cleanup MUST NOT mark those requirements implemented, change data/storage semantics, or claim they were verified. No Docker 18766 deployment, extra service, port, framework or parallel project is part of this round.

- Affected application code: `web/src/main.js`, `web/src/docx-engine.js`, `web/src/msds-db.js`, `web/src/msds-api-controller.js`, `web/src/pdf-converter.js`, shared template registry/draft/export-plan modules and UI styles.
- Affected validation: `web/tests/smoke.mjs` plus focused source-to-template and company-parity tests.
- Embedded CN/EN Guanzhi DOCX files remain byte-identical and read-only. Guocai uses the same structure with only approved company fields changed.
- Processing remains on the existing local deployment. Reuse its SQLite database for durable baselines, presets and draft snapshots; use a browser recovery journal only for unacknowledged local changes. No external translation or new standalone service is introduced.

## 2026-10-17 scope revision

The user explicitly requested generic template-baseline switching, independent saved work, baseline-owned preset management and Word/PDF export restricted to prepared baselines. This revision supersedes the historical fixed four-variant assembly. It authorizes planning in this turn; implementation tasks remain unchecked. Research and the reviewable detailed plan are in `问题研究报告/多模板基准编辑与预设归属及多格式导出方案.md` under this same project root. The existing preset-overlay change supplies historical behavior; this active change remains the planning record rather than creating a duplicate change.

## Rollback Baseline

The snapshot description below is historical evidence from 2026-10-05, not a verified rollback baseline for the current installation. Current code has Git metadata and pre-existing local edits. Implementation MUST capture the current working tree, SQLite consistent backup and browser-only legacy presets before migration; it MUST NOT restore the old snapshot over current work.

- The project has no Git repository, so the recoverable baseline is the verified snapshot at `F:\Skill\MSDS\_rollback\web-recognition-editor-guocai-20261005`.
- Snapshot scope: the complete `web` source tree excluding reproducible `node_modules` and `dist` (15 files, 347,029 bytes) and the complete pre-change `openspec` tree (54 files, 129.4 KB). The source and snapshot file manifests matched exactly at capture.
- Snapshot manifest SHA-256: `web` `57b3bf7aa10ec823c99462db5a5bbf18b52810db55fdec25acc9cf8e3ef4bce6`; `openspec` `f164a6c3556f0fa5d866b7c12d87d67e2b90c2df4d73fe43555de7c8c3d790b9`.
- Rollback: restore the affected `web` files from the snapshot and remove only files created by this named change after verifying their exact paths. Confirm the restored snapshot manifests, run `npm run build` and `npm run test:smoke`, and verify the two embedded template hashes remain unchanged.
