# Tasks

## 1. Confirm modal regression and protect behavior

- [x] 1.1 Record current dirty working files and capture the preset manager DOM/layout at 1920x1080 and 320x800; verify `renderPresetManagerModal()` is appended after main and identify which missing styles cause normal-flow rendering without modifying data.
- [x] 1.2 Inventory existing manager actions and behaviors (per-baseline create, edit, custom delete, restore defaults, close, backdrop, focus/inert). Record current handlers and use an isolated session for destructive-action checks.

## 2. Restore independent modal shell

- [x] 2.1 Add a dedicated `.preset-manager-backdrop` and scoped `.preset-manager-dialog` layout: fixed full viewport overlay, visible restrained backdrop, centered bounded white surface, accessible z-index and viewport-relative max-height. Verify it overlays the editor without expanding document scroll height.
- [x] 2.2 Build stable dialog zones: titled header with close target, independently scrollable baseline/preset body, persistent footer. Verify long lists scroll only inside the body and close/restore actions remain visible.
- [x] 2.3 Arrange each baseline as a clear group with one baseline-bound create action and each preset as a row with name/system status, publisher/override summary and aligned edit/delete actions. Verify long names wrap without hiding controls and no redundant nested borders are introduced.
- [x] 2.4 Apply existing light tokens and frozen Audit button reference to manager actions; document actual computed reference values. Preserve restore/delete confirmation semantics and ensure scoped selectors do not alter export, version, import or annotation dialogs.

## 3. Modal interaction and responsive behavior

- [x] 3.1 Ensure the dialog is outside any inert ancestor; apply inert to live background regions after render and restore their pre-open state on every close path. Verify focus entry, Tab/Shift+Tab containment, Escape, close button, supported backdrop behavior and return to the unique trigger.
- [x] 3.2 Verify 1920x1080 and 1366x768 centering/card bounds; at 320x800 verify title/close/footer reachability, internal scrolling, wrapped content and no horizontal overflow. Record measured viewport/scale and element rectangles.

## 4. Regression and independent audit handoff

- [x] 4.1 In an isolated session, verify manager create/edit/delete/reset/close flows with disposable data; confirm no user presets or DB contents are changed.
- [x] 4.2 Compare other dialog styles and behavior before/after; run changed-JS syntax, build and relevant existing smoke checks, record actual output and all failures.
- [x] 4.3 Capture actual 5173 screenshots and DOM/computed evidence for modal overlay/header/body/footer, keyboard lifecycle and responsive viewports; update this change with paths and leave any unverified item unchecked for supervisor audit.
  - Evidence paths:
    - 1920x1080 Screenshot: `openspec/changes/restore-preset-manager-modal-window/evidence/preset_manager_1920x1080.png`
    - 320x800 Screenshot: `openspec/changes/restore-preset-manager-modal-window/evidence/preset_manager_320x800.png`
    - Computed Metrics: `openspec/changes/restore-preset-manager-modal-window/evidence/computed_layout_evidence.json`
