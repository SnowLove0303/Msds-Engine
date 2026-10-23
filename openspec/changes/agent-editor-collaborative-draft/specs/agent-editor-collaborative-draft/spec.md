# Spec: Agent-Editor Collaborative Draft Workflow

## ADDED Requirements

### Requirement: Server-Side Collaborative Draft Lifecycle API
The server API MUST provide robust endpoints to create, update, and retrieve collaborative editor drafts without bypassing domain engine rules.

#### Scenario: Agent creates a new collaborative draft with incremental field updates
- **WHEN** an AI Agent sends `POST /api/msds/editor/draft` with `{ model: "PU-608", baselineId: "baseline_cn_guanzhi", fields: { "9.3": "pH: 7.2" } }`
- **THEN** the server resolves the official clean-slate template, applies values via `docx-engine.js`, validates typography, and returns a unique `draftId` and HTTP status 200.

#### Scenario: Web client requests active draft list
- **WHEN** a client sends `GET /api/msds/editor/drafts`
- **THEN** the server returns an array of draft summaries including `draftId`, `model`, `baselineId`, and `updatedAt`.

#### Scenario: Web client fetches draft DOCX binary for hydration
- **WHEN** a client sends `GET /api/msds/editor/draft/:id/docx`
- **THEN** the server streams the compiled DOCX binary buffer with `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

### Requirement: Strict UI Freeze & Zero CSS/DOM Mutation
The Web Editor graphical interface, CSS styles, button functions, and layout grids MUST remain 100% frozen and byte-for-byte intact:
- `web/src/styles.css` and `web/index.html` MUST NOT be modified under any circumstances.
- Existing button handlers, toolbar actions, navigation items, and modal dialogs MUST preserve their exact functionality and behavior.
- Draft hydration MUST operate purely at the JavaScript state layer (ingesting DOCX into `state.editor.engine`) without injecting new DOM elements.

#### Scenario: Draft hydration through existing loading channels
- **WHEN** a draft is loaded in the browser (e.g., via query parameter `?draftId=...` or existing baseline options)
- **THEN** the application reuses `loadDocx()` to populate `state.editor.engine`, switches `state.view` to `'editor'`, and marks `dirty: true` without altering existing HTML structure or CSS styles.

### Requirement: Domain Engine & Invariant Lock Enforcement
All content supplemented by the Agent through the API MUST strictly satisfy system invariant locks.

#### Scenario: Value cells retain pure left alignment and regular weight
- **WHEN** Agent-submitted field values are injected into table cells
- **THEN** every modified value cell maintains `w:jc val="left"`, regular font weight (non-bold), and East Asian SimSun font.

### Requirement: Human-in-the-Loop Final Approval & Export
The human operator MUST retain sole authority to review, fine-tune, and trigger final export from the browser.

#### Scenario: Human reviews and exports supplemented draft
- **WHEN** the human operator inspects the loaded draft at `http://127.0.0.1:5173/` and opens the Unified Export Center
- **THEN** the system generates final deliverables using the human-approved editor engine state.
