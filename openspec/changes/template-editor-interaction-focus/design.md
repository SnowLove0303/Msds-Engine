# Design

## Context

The editor uses `data-record-id` for Section navigation, editable values and labels, the table-level add-row button, and floating row controls. `bindEvents()` currently attaches Section-selection behavior to every `[data-record-id]` element. That handler calls `renderApp()`, which replaces `root.innerHTML` and removes the focused contenteditable node.

The change is limited to the Section-selection binding in `web/src/main.js`. Editable-cell input synchronization already updates the model and dirty indicators in place; it does not call `renderApp()`.

Rollback baseline: this workspace has no Git repository or HEAD revision. Before implementation, the complete `web` tree was captured at `F:\Skill\MSDS\rollback\template-editor-interaction-focus-20261005-before.zip` (SHA-256 `8A2F96639C8BC9FCE0BC15D88A6A26E4D576FD94CB120B0ECF56BABF6090679B`). All 1,692 archive entries were decompressed successfully for integrity verification.

## Goals / Non-Goals

**Goals:**

- Clicking a Section navigation button still selects that Section.
- Clicking an editable value or enabled label does not run Section navigation or replace the editor DOM.
- Row action controls are handled only by their row-operation handlers.

**Non-Goals:**

- Changing cell editing semantics, DOCX model writes, keyboard navigation, or editor layout.
- Adding dependencies or changing templates.
- Altering the existing input handler, which does not rerender the application.

## Decisions

- Bind Section selection only to `.section-nav-row[data-record-id]`, instead of the broad `[data-record-id]` selector. This uses the existing navigation class as the interaction boundary and leaves `data-record-id` available as shared model metadata on editors and row controls.
- Keep the current full render for actual Section navigation. A render is appropriate when changing the selected Section; it is not appropriate for a click that merely places the caret in an editor.
- Do not add a second editable-cell click handler. Native `contenteditable` focus and the existing `input` handler already implement the intended interaction once unrelated navigation handling is excluded.

## Risks / Trade-offs

- [A future control may reuse `.section-nav-row` unintentionally] → The class remains specific to navigation buttons; new action controls should use their own action selector.
- [The app could contain an integration or compile-time regression] → Run the existing smoke suite and production build after the focused change; no new test framework or dependency is needed.

## Migration Plan

1. Narrow the Section navigation listener selector in `web/src/main.js`.
2. Run the existing smoke suite and build the web app to ensure existing recognition/editor invariants and production compilation remain intact.
3. In the live editor, click an editable cell and confirm it retains focus without changing the selected Section; no text needs to be entered for this interaction check.

Rollback by restoring the verified pre-change snapshot over `F:\Skill\MSDS\web`. Confirm the archive hash before extraction; after restoring, confirm `web/src/main.js` and `web/src/render-utils.js` exist and the web production build succeeds.
