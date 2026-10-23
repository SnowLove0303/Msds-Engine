# Design

## Context

See proposal. At `web/src/main.js:1047`, `renderPresetManagerModal()` emits `.modal-backdrop > .modal-card.preset-manager-dialog` with ARIA dialog semantics and header/body/actions, but stylesheet search found no base rules for `.modal-backdrop`, `.modal-card`, `.modal-header`, `.modal-body`, `.modal-actions`, `.preset-manager-dialog`, or `.preset-item-card`. Only `.preset-baseline-group/header` are styled at `web/src/styles.css:2908+`. Since `renderApp()` appends the modal markup after main content, absent fixed backdrop/card rules make it flow as content after the editor; screenshot confirms manager stretches along the page bottom.

The current manager structure has one group per template baseline, baseline title/current/count and a per-group create button, then preset name/system marker/publisher/override count/edit/delete, with restore-default and close in footer. Preserve these semantics and data operations.

## Goals / Non-Goals

**Goals:** Restore a centered viewport modal; make manager hierarchy, scrolling and actions clear; retain preset functions and accessible lifecycle; prevent style leakage.

**Non-Goals:** Rebuild the manager as a new page/route; change preset storage, baseline ownership, create/edit/delete behavior; restyle export/version/import/annotation modals; change editor toolbar scope or document content.

## Decisions

### Modal geometry and layer

- Scope a dedicated root class e.g. `.preset-manager-backdrop` and card `.preset-manager-dialog`. Do not rely on a generic `.modal-backdrop` rule unless every existing modal is explicitly shown unaffected.
- Backdrop: fixed to viewport (`inset:0`), flex/grid center, sufficient z-index above topbar/toast/workspace, neutral dark translucency (suggest `rgba(15,23,42,.38)`), no excessive blur. Keep page scroll position. Dialog stays inside the viewport.
- Desktop card: white surface, `width:min(880px, calc(100vw - 48px))`, `max-height:84vh`, overflow hidden; 1px `--border-base`, 10px radius, restrained `--shadow-modal`. These are initial design values; viewport/layout verification may refine them without changing the centered bounded-window requirement.
- Narrow layout: width `calc(100vw - 24px)`, max-height `calc(100dvh - 24px)` with fallback; avoid body-wide horizontal scroll.

### Window zones and hierarchy

1. Header about 56px, title “预设管理” left, 32px neutral close target right, bottom 1px light divider.
2. Body `min-height:0; overflow-y:auto`, padding 16–20px; each baseline group uses a light subtle surface or one thin border, not nested cards around each child. Header line: baseline name/current marker/count left and one baseline-bound create action right. Preset rows use a grid: name/system marker and publisher/override detail in the wide column, edit/delete in a stable right action column. Long names wrap; action column retains hit area.
3. Footer remains outside body scrolling with top divider, padding 12–16px. Restore defaults sits at left with its existing confirmation and distinct spacing; close sits right. Footer remains reachable at all heights.

### Color, line, buttons and spacing

- Dialog surfaces use existing tokens: `--bg-panel:#fff`, `--bg-subtle:#f8fafc`, main `--text-main:#0f172a`, secondary `--text-secondary:#475569`, light divider `--border-light:#e2e8f0`, boundary `--border-base:#cbd5e1`.
- Buttons follow the already documented rendered Audit reference. Capture its computed style before changes and record actual values; do not guess pure black/heavy borders or use stale values. All manager buttons share the reference. Destructive restore/delete retain confirmation and position/text semantics, not a red visual exception.
- Spacing ladder 8/12/16/20/24px; one group boundary per semantic group. Avoid border around both outer group and each full-width row. Use subtle row separators or whitespace.
- Ensure heading/content text readable; count/current/system labels stay noninteractive and do not mimic bordered buttons. Do not use colored pills for current state unless the existing neutral reference explicitly requires it.

### Behavior and scope

Keep current modal state and event actions; do not rewrite preset data logic. Ensure the backdrop is outside any element made inert; apply inert after render to current live siblings, restore their prior values on every close path. Keep one global keyboard controller and stable trigger selector; focus remains inside across rerenders. Backdrop click behavior should follow the current implementation, not be newly introduced if unsupported.

All new CSS selectors must start from `.preset-manager-backdrop` or `.preset-manager-dialog`. Do not add broad `.modal-*` rules that recolor existing dialogs. Isolate this manager from the six toolbar groups and do not modify other dialog DOM/classes.

## Risks / Trade-offs

- Long lists exceed viewport → body-only scroll with fixed header/footer.
- Generic modal selectors affect unrelated dialogs → dedicated manager root and computed-style comparison for other dialogs.
- Backdrop parent becomes inert → enforce dialog as sibling of inert regions, test live DOM ancestry and focus.
- Layout tightening hides actions on mobile → wrap preset content and preserve action column accessibility at 320px.

## Migration Plan

Add dedicated manager shell classes and scoped CSS; preserve inner data rendering and event handlers; verify create/edit/delete/reset/close and keyboard lifecycle using disposable data. Compare export and other dialogs before/after. Do not touch preset DB or user presets for visual fixtures. No migration or service restart is required unless the normal local development workflow requires it; user deployment is not part of this planning request.

## Verification Plan

At 1920x1080 and 1366x768 (100% zoom), verify centered viewport geometry, bounded dimensions and internal scroll. At 320x800, verify title/close/footer visibility, wrapped names and no horizontal overflow. Measure card rect, header/body/footer rect, scrollHeight/clientHeight, z-index/backdrop and background inert state. Exercise open via the sole trigger, focus entry, Tab/Shift+Tab, edit action navigation, Escape/X/close, repeated open/close and focus return. Confirm other dialogs computed colors and geometry unchanged. Use screenshots from the actual 5173 page; source/class presence is not a pass.
