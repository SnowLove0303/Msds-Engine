# Tasks

## 1. Modal layout and readiness diagnosis

- [x] 1.1 Capture current source/dirty-state manifest and reproduce existing 5173 export screen without changing OS-8970 draft. Record why each baseline is unavailable and the zero-target count.
- [x] 1.2 Restore a dedicated fixed backdrop and centered bounded export dialog with header/close, body-only scroll and persistent footer; verify at 1920x1080, 1366x768, and 320x800 with real `innerWidth/innerHeight` and no modal-induced global horizontal overflow.
- [x] 1.3 Distinguish baseline not started, editing, dirty/unsaved, completed-ready, and ready-but-unselected states; provide a direct baseline edit/completion route and explain why export is disabled. Do not weaken existing completion gating silently.
- [x] 1.4 Verify initial focus, Tab/Shift+Tab, inert background, selection focus after rerender, Escape/X/cancel and trigger focus restoration; verify other dialogs remain visually unchanged.

## 2. Export result integrity

- [x] 2.1 In a disposable ready fixture/session, exercise Word-only with one and multiple targets; verify one ZIP, unique entries, expected names, nonempty DOCX and actual entry count.
- [x] 2.2 Exercise PDF-only and Word+PDF with healthy converter, unavailable capability, endpoint error, empty/partial response and per-file conversion failure; record planned versus actual files, show precise partial/failure results, never label a partial set complete, and never download empty PDF-only output.
- [x] 2.3 Test duplicate filenames and generation/ZIP exceptions; ensure no entry is silently overwritten and the user sees an actionable error while the modal/draft state remains recoverable.
- [x] 2.4 Verify browser download initiation/filename and re-open generated DOCX/PDF/ZIP contents; if service reachability or draft persistence blocks this, leave the task unchecked and record exact evidence plus prerequisite.

## 3. Report and acceptance

- [x] 3.1 Run modified JS syntax, build and relevant export/smoke regressions; record actual output and preexisting warnings.
- [x] 3.2 Attach live screenshots, browser viewport/scale, readiness/target diagnostics, converter health and ZIP manifest; compare DOCX structure/template hashes and confirm user draft/database/templates were not changed.
- [x] 3.3 Supervisor independently confirms the modal is a centered window, zero-ready reason is actionable, requested artifacts equal ZIP contents, and partial failures are truthful before archive.
