# Spec Delta

## MODIFIED Requirements

### Requirement: Present one preset management entry in the editor

The editor MUST expose exactly one visible and keyboard-reachable preset-management entry in each base/preset and document/header-footer editing view. Management functionality MUST remain available after removing the duplicate context entry. That entry SHALL open the preset-manager dialog.

#### Scenario: Open base editing
- **WHEN** the user enters base editing
- **THEN** one preset-management entry is shown and opens the manager as a centered independent dialog, without a duplicate context entry

#### Scenario: Switch to preset editing
- **WHEN** the user enters preset editing or changes editing sections
- **THEN** exactly one preset-management entry remains accessible and opens the independent dialog

## ADDED Requirements

### Requirement: Present preset management as an independent modal window

The preset manager MUST be rendered as a viewport-fixed modal above the editor page rather than content in normal document flow. It MUST have a visible backdrop, centered bounded light surface, clear header/close control, independently scrollable body, and a footer whose actions remain reachable. Baseline groups and preset rows MUST have clear hierarchy without redundant nested borders. It MUST remain usable at desktop and 320 CSS-pixel width. Its visual rules MUST be scoped to the preset-manager dialog and MUST NOT change other dialogs.

The dialog MUST expose `role="dialog"`, `aria-modal="true"`, an accessible title, initial focus, contained Tab/Shift+Tab navigation, Escape/close behavior, background inertness and focus restoration to its unique trigger. Rendering and scrolling MUST not discard edited preset state.

#### Scenario: Open manager on a desktop viewport
- **WHEN** the user opens preset management at 1920x1080 or 1366x768
- **THEN** the backdrop covers the viewport and a centered, width-bounded manager appears above the editor without extending the document page

#### Scenario: Scroll a long preset list
- **WHEN** baseline groups or preset rows exceed the available dialog height
- **THEN** the dialog body scrolls independently while its title/close control and footer actions remain reachable

#### Scenario: Open manager at 320 CSS pixels
- **WHEN** the user opens preset management at a confirmed 320px viewport
- **THEN** the dialog fits within the viewport, names wrap, actions remain operable, and no modal-induced global horizontal overflow occurs

#### Scenario: Close manager after background isolation
- **WHEN** the user closes by Escape, close button or supported backdrop action
- **THEN** background inert state is restored, the modal closes once, and focus returns to the manager trigger
