# Proposal

## Why

The unified export control currently refuses to run when every baseline draft is editing/dirty, and the visible zero-target explanation can be mistaken for a broken export action. The export dialog is also rendered in document flow rather than as a centered modal, while PDF failures may produce an incomplete ZIP without clearly representing the requested output set.

## What Changes

- Restore the export center as an independent, accessible modal with a viewport backdrop, bounded centered layout, internal scrolling and persistent actions.
- Explain precisely why a target is unavailable, what action makes it exportable, and whether any targets are ready; keep the export action disabled when no valid target exists.
- Validate the selected formats/targets before execution, then compare planned and generated artifacts. A successful message MUST NOT imply missing requested outputs were delivered.
- Preserve the single ZIP delivery contract for the requested files; report PDF conversion failures distinctly and never silently label a partial ZIP complete.
- Document the confirmed current blocker, separate it from the modal-layout defect and from the unverified export execution path, and validate on the real local page.

## Capabilities

### New Capabilities

- `unified-export-center`: readiness explanation, modal behavior/layout, truthful format conversion and ZIP result reporting.

### Modified Capabilities

None. The existing `portable-pdf-export` capability continues to define converter behavior; this change defines the browser export workflow that consumes it.

## Impact

- Project root: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine`; local UI: `http://127.0.0.1:5173/`.
- Likely implementation surfaces: `web/src/main.js`, `web/src/styles.css`, `web/src/msds-api-controller.js` only if verification shows a response-contract gap, and focused existing `web/tests/` coverage.
- No database migration, user preset mutation, embedded template rewrite, Docker 18766 deployment, new server, dependency or port is authorized by this plan.
