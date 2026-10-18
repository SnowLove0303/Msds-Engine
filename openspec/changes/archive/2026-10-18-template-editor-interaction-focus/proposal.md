# Proposal

## Why

The template editor's editable cells carry the same `data-record-id` attribute used by Section navigation. A click in an editable cell is therefore handled as navigation and rebuilds the entire application DOM, dropping focus before the user can type. This prevents the promised in-place editing workflow and makes ordinary cell clicks appear to exit interaction.

## What Changes

- Restrict Section-selection click handling to actual Section navigation controls.
- Preserve focus in editable value cells and enabled label cells when they are clicked.
- Keep row-operation controls from being interpreted as Section navigation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is an implementation fix for the existing editor interaction contract; it does not add or change product behavior.

## Impact

- `web/src/main.js`: click listener binding for elements carrying `data-record-id`.
- `web/src/render-utils.js`: editable cells and row-operation controls currently share `data-record-id`; their data model and markup need no behavioral expansion.
- Rollback snapshot: `F:\Skill\MSDS\rollback\template-editor-interaction-focus-20261005-before.zip`
- Snapshot SHA-256: `8A2F96639C8BC9FCE0BC15D88A6A26E4D576FD94CB120B0ECF56BABF6090679B`
- Affected scope: the `F:\Skill\MSDS\web` tree as captured before edits (including source, embedded templates, dependencies, and existing build output).
- Rollback method: extract the verified snapshot over `F:\Skill\MSDS\web` to restore the pre-change tree. The archive contains 1,692 entries; every entry was decompressed successfully before implementation.
- Rollback usability checks: verify the archive SHA-256 above, confirm `web/src/main.js` and `web/src/render-utils.js` exist after extraction, and run the web production build if rollback is exercised.
