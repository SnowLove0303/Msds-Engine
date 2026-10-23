# Tasks: Agent-Editor Collaborative Draft Implementation

## 1. Backend Server-Side Collaborative Draft API

- [x] 1.1 In `web/src/msds-api-controller.js`, implement `editorDrafts` storage and helper functions to create, update, and retrieve draft metadata and binary buffers.
- [x] 1.2 Implement `POST /api/msds/editor/draft` endpoint: accept `{ model, baselineId, fields, facts }`, apply values to the official template using `docx-engine.js`, enforce invariant locks (`w:jc="left"`, G-11 font/weights), and return `draftId`.
- [x] 1.3 Implement `GET /api/msds/editor/drafts` and `GET /api/msds/editor/draft/:id/docx` endpoints with proper error handling and CORS support.
- [x] 1.4 Write automated unit/integration test `web/tests/test_editor_draft_api.mjs` verifying draft creation, slot patching, invariant compliance, and DOCX retrieval with exit code 0.

## 2. Frontend Zero-UI-Disruption Draft Hydration

- [x] 2.1 Align with user on preferred minimal-impact hydration entry (Option A: query parameter `?draftId=...`, Option B: baseline selector integration, or Option C: repo record reuse).
- [x] 2.2 Implement the agreed minimal hydration logic in `web/src/main.js` reusing `loadDocx()`, ensuring `state.editor.engine` is properly hydrated and `state.view` switches to `'editor'`.
- [x] 2.3 Verify that no unapproved DOM nodes, buttons, or CSS overrides were introduced.

## 3. End-to-End Human Review & Export Verification

- [ ] 3.1 Verify end-to-end flow: Agent posts test draft via API -> Web editor loads draft at `http://127.0.0.1:5173/` -> Human reviews and modifies cell values -> Unified Export Center generates valid DOCX/PDF.
- [x] 3.2 Submit all changes for VS Code Diff Review via `review_diff_in_vscode`.
- [ ] 3.3 Run `openspec validate --all` and confirm 0 failed specifications.
