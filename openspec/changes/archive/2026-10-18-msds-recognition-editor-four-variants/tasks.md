# Tasks

Current UI dispatch (supersedes the preceding round): `unify-neutral-controls-and-flat-toolbars`. The 2026-10-17 independent supervisor re-audit found remaining failures in sections 10/11; its design contains actual evidence and an explicit task mapping. Remaining UI implementation is owned by that new user-requested change, not duplicated here. Sections 5–10.4 remain functional backlog. Old Agent verification claims are retained as historical self-reports and are not acceptance.

## 1. Recognition handoff and mapping review

- [ ] 1.1 Add a section/label semantic slot registry and source-fact mapping plan; verify unit tests cover exact alias matches, structured Section 3/8/11 rows, duplicate conflicts, and unresolved blockers.
- [ ] 1.2 Integrate recognition-to-editor handoff with the selected baseline workspace draft without mutating the inspector source; verify source bytes remain unchanged and existing drafts are saved before replacement.
- [ ] 1.3 Preserve mapping review for mapped, source-only/omitted, ambiguous, and image/structure evidence; verify affected selected drafts remain blocked until review, without blocking unrelated prepared baselines.

## 2. Company overlays and DOCX package persistence

- [ ] 2.1 Add the Guanzhi/Guocai profile registry and apply Guocai only to Section 1 supplier name/address/telephone/fax and footer company text; verify same-language company parity tests find no other differences.
- [ ] 2.2 Track modified header/footer package parts and serialize only those parts on export; verify reopened DOCX files contain the selected model/company footer values while unchanged template package parts and formatting anchors remain identical.
- [ ] 2.3 Suppress source-absent/template-only rows after mapped writes with merge-safe continuation repair and post-omission numbering; verify Section 11 merged-row tests and fresh-template geometry checks pass.

## 3. Baseline-owned multi-variant generation (revised 2026-10-17)

- [ ] 3.1 Build each selected baseline/preset output from its independent saved completed snapshot; verify no missing baseline is manufactured from another draft and built-in company overlays retain same-baseline parity.
- [ ] 3.2 Assemble selected Word/PDF results into one ZIP with unique filenames and per-target audits; verify actual entries equal the frozen plan and embedded templates/source bytes remain unchanged.

## 4. End-to-end verification

- [ ] 4.1 Extend relevant smoke coverage with draft ownership/readiness, handoff, mapping review, company overlay and footer round-trip; verify focused regressions, `npm run test:smoke` and `npm run build` pass.
- [ ] 4.2 Exercise a reviewed source with independently completed baseline drafts and selected presets; reopen DOCX and render PDF, verify intended differences, section coverage and no cross-baseline value contamination, and retain verification evidence.


## 5. Baseline registry and preset ownership (2026-10-17 amendment)

- [ ] 5.1 Register the existing template assets using stable baseline IDs and immutable revisions; verify rename stability and a third same-language baseline without new language/company routing.
- [ ] 5.2 Add additive SQLite baseline/workspace/draft-snapshot schema and presets.baseline_id with consistent backups and idempotent migrations; verify legacy data remains recoverable after migration and rollback rehearsal.
- [ ] 5.3 Unify browser/API preset response contracts and acknowledged storage; verify custom changes and built-in customizations round-trip through the API rather than silently falling back to localStorage.
- [ ] 5.4 Map known legacy built-in identities, preserve browser/server conflicts and quarantine ambiguous custom presets; verify repeating migration neither duplicates nor discards records.
- [ ] 5.5 Validate ownership and schema compatibility on preset create/apply/export API routes; verify a same-language wrong-baseline preset is rejected.

## 6. Independent draft lifecycle

- [ ] 6.1 Implement full edited DOCX snapshot persistence per workspace/baseline, UI metadata and expected-revision saves; verify field, row, media and header/footer edits survive reload and restart.
- [ ] 6.2 Add an unacknowledged browser recovery journal and stale-save conflict handling; verify recovery preserves newer server revisions and a failed save does not clear dirty content.
- [ ] 6.3 Implement save-before-switch with input/IME flush and latest-request-wins loading; verify A/B/A restoration and rapid A/B/C switching under delayed responses.
- [ ] 6.4 Route matching handoff, import, reset, row/header edits and record loading through the draft controller; verify engine references do not mutate source/matching evidence or another product workspace.
- [ ] 6.5 Separate base snapshots from preset editing drafts and add exact-revision completion/review status; verify blank inherited preset canvas never replaces base content and further edits invalidate readiness.

## 7. Registry-driven editor and export UI

- [ ] 7.1 Show baseline names, save/completion states and restore per-draft view context; verify no normal switch loses edits and no fixed CN/EN/company selectors are needed.
- [ ] 7.2 Group preset management by baseline and bind creation to that group; verify same-language groups remain independent after rename.
- [ ] 7.3 Replace Cartesian-product export selection with prepared-baseline groups, optional base/preset children and Word/PDF formats; verify unprepared groups are unavailable and cancel does not change persistent defaults.

## 8. Shared export plan and conversion

- [ ] 8.1 Build a shared revision-frozen export plan used by all UI/API paths and remove alternate-template fallbacks; verify only selected prepared drafts produce output and unrelated unprepared baselines do not block them.
- [ ] 8.2 Generate each variant from its own full draft snapshot and compatible preset, scoped audit evidence and stable target identity; verify independent CN/EN markers and same-language baseline isolation after reopening DOCX.
- [ ] 8.3 Preflight unique ZIP paths and exact expected counts; verify filename collisions cannot silently merge targets and batch delivery triggers one ZIP download.
- [ ] 8.4 Reuse the exact generated DOCX for requested PDF conversion, probe capabilities and isolate converter jobs with bounded concurrency; verify PDF-only hides DOCX intermediates and missing converter/failed files cannot report complete success.
- [ ] 8.5 Consolidate legacy export handlers and duplicate API routes behind ownership/readiness validation with an explicit compatibility adapter; verify old callers cannot bypass missing-baseline checks.

## 9. Integrated acceptance and evidence

- [ ] 9.1 Exercise three configured baselines, two with the same language, across switching, refresh, process restart, two tabs and two product workspaces; retain assertions for content identity and state restoration.
- [ ] 9.2 Exercise Word-only, PDF-only, both formats, duplicate names, conversion failure, slow-save and stale-completion cases; reopen DOCX, inspect rendered PDF pages and compare the ZIP against the frozen plan.
- [ ] 9.3 Run focused regressions, existing relevant smoke checks and build; record actual pass/fail and preserve embedded template hashes and unrelated local changes.

Amendment implementation order: 5 -> 6 -> 7/8 -> 9. Existing groups 1-4 remain inherited mapping/package verification; implementation must reuse existing working behavior and must not expand into an unrelated matching-engine rewrite. No task is marked complete by this planning work.



## 10. Agent acceptance follow-up

- [ ] 10.1 Persist complete draft snapshots and baseline UI metadata in the existing local store or approved recovery store; verify refresh/restart restores edits and failed saves retain the active draft. Audit: no persistence call was found; current drafts are in memory.
- [ ] 10.2 Change readiness and export planning to require the exact saved completed revision; verify an editing or dirty baseline cannot be exported and a later edit invalidates completion. Audit: executor checks completed, but UI and quick-select handlers still accept editing.
- [ ] 10.3 Enforce baselineId on preset create/save/list/apply/export paths and quarantine ambiguous legacy presets; verify two same-language baselines cannot share a preset accidentally. Audit: language fallback remains in client filtering and save paths.
- [ ] 10.4 Freeze an export plan by workspace, baseline, draft revision and preset revision before generating Word/PDF/ZIP; verify output cannot read a later live engine mutation or another baseline fallback. Audit: targets still carry live engine references.
- [ ] 10.5 Complete dialog lifecycle including live background inertness and trigger restoration. Re-audit: initial focus and one Tab loop pass, but current background inert=false and export Escape ends on BODY; remaining work owned by new change 3.3/4.2.
- [ ] 10.6 Finish application color/inline cleanup and rendered contrast coverage. Re-audit: filename field still deep navy/cyan, colored inline mode/actions remain; latest neutral user policy supersedes old colored-primary scheme. Remaining work owned by new change 1.2/2.1–2.4/4.1.
- [ ] 10.7 Verify application-exported/reopened DOCX structure, text and template-format isolation. Re-audit: isolated script directly writes engine and manually packages XML, not actual UI save/reopen/export or complete format comparison. New change 4.3 owns remaining evidence.
- [ ] 10.8 Finish relevant checks plus real browser matrix. Re-audit: syntax/build/isolated script pass; current inert/focus/320px overflow fails. New change 4.1–4.4 owns remaining verification; no full pass claim.

## 11. Current dispatch — clean, aligned and task-focused UI

- [x] 11.1 Confirm the unique root, OpenSpec file set, current dirty changes, implementation selectors/files and verification matrix in a detailed reply to the supervisor; implement after supervisor sends 确认执行. Capture before screenshots without replacing user data.
- [ ] 11.2 Consolidate application color/token ownership, inline appearance and all-state coverage. Re-audit PARTIAL: residual dark filename and inline colored actions; new change 1.1/1.2/2.1–2.3 owns completion.
- [ ] 11.3 Normalize control geometry/type/icons and measured alignment. Re-audit PARTIAL: title36px, control22/27/28px and radius4/6/7px; title/action centers differ12.796875px. New change1.3/2.4/4.1 owns remainder.
- [ ] 11.4 Simplify context/heading, remove duplicate manager and move exceptional permissions into accessible advanced menu. Re-audit FAIL: duplicate manager and permanent switches remain. New change3.1 owns completion.
- [ ] 11.5 Complete rail/editor/preview alignment and usable space. Re-audit PARTIAL: top edges align, but 1366 editor306px vs preview820px and mixed mini-controls remain. New change2.2/2.4/3.2 owns remainder.
- [ ] 11.6 Complete preset-manager visual and interaction matrix. Re-audit PARTIAL: light baseline groups present, complete long-name/empty/neutral controls and lifecycle evidence pending. New change2.3/4.1 owns remainder.
- [ ] 11.7 Complete export-dialog states and actual output-list verification. Re-audit PARTIAL: shorter copy and singleZIP code path present; selected/version/format and neutral-control evidence pending, existing PDF failure remains functional backlog. New change2.3/4.3 owns remainder.
- [ ] 11.8 Complete stable dialog lifecycle for both dialogs. Re-audit FAIL: background inert absent and export Escape focus lost. New change3.3/4.2 owns completion.
- [ ] 11.9 Complete actual viewport matrix including shared pages/menus. Re-audit FAIL: 320x800 scrollWidth634 vs clientWidth305; baseline right506. New change3.2/4.1 owns completion.
- [ ] 11.10 Complete real preset UI save/reopen/export DOCX round trip and evidence. Re-audit PARTIAL: build and low-level script pass, actual preset path not proven. New change4.3/4.4 owns remainder.

