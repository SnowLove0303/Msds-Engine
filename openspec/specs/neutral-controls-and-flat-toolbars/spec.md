# neutral-controls-and-flat-toolbars Specification

## Purpose
为用户截图中模板编辑器指定的上下文及工具条提供局部统一的白底灰边黑字控件和单层边界，保护红框之外现有界面，并恢复 DOCX 识别页正常可读的导入空态与原有操作入口，防止局部优化污染全站。

## Requirements

### Requirement: Restrict neutral controls to designated editor toolbars

The application SHALL style the six control groups in the user's latest screenshot consistently with the current Audit button's rendered white background, border line and typography. The groups are editor top-right actions, context actions, filename/reset, baseline/completion, editor section actions/status and preview view/zoom tools. Relevant height, padding and radius SHALL follow that reference while input widths and noninteractive status semantics remain appropriate. Selected/focus/disabled states MUST remain identifiable, and grouping wrappers MUST NOT add redundant surrounding frames. Scope MUST follow editor semantic components rather than pixels or global control resets.

#### Scenario: Inspect the highlighted editor regions
- **WHEN** the user opens base or preset mode
- **THEN** highlighted buttons/fields share the Audit reference appearance, including export, with clear selection/focus/disabled states and no redundant group frame

### Requirement: Preserve UI outside the selected regions

Brand/navigation, page title, section-list/search body and section heading, editor cells/row tools, rendered document, audit panels, recognition/matching pages and dialogs SHALL retain their existing appearance. Only the six latest highlighted editor control groups MAY receive the Audit-based styling. Existing functional repairs MUST remain preserved.

#### Scenario: Inspect outside the red rectangle
- **WHEN** the local editor control changes are applied
- **THEN** navigation, recognition/matching pages, dialogs and document/table/list content are unchanged; the highlighted editor top-right export uses Audit styling instead of the historical blue-primary exception

### Requirement: Use single functional boundaries inside toolbars

Control grouping wrappers within the designated regions MUST NOT draw redundant borders/shadows around independently bordered controls. A segmented control MAY have one outer border and inner separators only. Panel edges, document/table rules and accessible focus outlines MUST remain intact.

#### Scenario: Use preview and baseline controls
- **WHEN** the user uses fit-width/100-percent/zoom/view-mode or baseline selection
- **THEN** controls remain functional and show no redundant surrounding group frame

### Requirement: Restore the recognition import UI

The DOCX recognition page SHALL recover its prior normal import UI, including a clearly readable import heading, visible import container, original choose-DOCX/sample controls and appropriate spacing. It MUST NOT inherit the local editor neutral theme. Restoration MUST be based on verified component history/reference and MUST preserve current recognition data and functionality.

#### Scenario: Open recognition with no imported file
- **WHEN** the user opens the empty recognition workspace
- **THEN** the import heading is readable against its surface, choose DOCX and sample actions are visible in their prior style, and the region is not an unexplained blank area with a nearly white heading

### Requirement: Verify changed and protected regions separately

Acceptance SHALL provide actual before/after browser evidence for the highlighted regions, the protected surrounding regions and recognition empty/loaded states, with explicit component/history references for restoration. Build success or global screenshots alone MUST NOT replace boundary verification. Unrelated functional backlog MUST remain explicit.

#### Scenario: A shared style leaks outside the toolbar
- **WHEN** a toolbar change also alters navigation, dialogs, recognition actions or document typography
- **THEN** acceptance fails until the selector scope is corrected and the protected appearance is restored

### Requirement: Present one preset management entry in the editor

The editor MUST expose exactly one visible and keyboard-reachable preset-management entry in each base/preset and document/header-footer editing view. Management functionality MUST remain available after removing the duplicate context entry. That entry SHALL open the preset-manager dialog.

#### Scenario: Open base editing
- **WHEN** the user enters base editing
- **THEN** one preset-management entry is shown and opens the manager as a centered independent dialog, without a duplicate context entry

#### Scenario: Switch to preset editing
- **WHEN** the user enters preset editing or changes editing sections
- **THEN** exactly one preset-management entry remains accessible and opens the independent dialog

### Requirement: Freeze the existing Audit visual reference before implementation

The implementation MUST capture the existing rendered editor Audit control before changing the target controls. Border width/style/color, background, typography, relevant dimensions/radius and interaction states SHALL be traceable to that reference. Input/select controls MUST retain their native interaction, suitable widths and left-aligned value text. Display-only badges and counts MUST remain noninteractive. The reference MUST NOT be restyled first to create a false appearance of consistency.

#### Scenario: Compare controls with the original reference
- **WHEN** the six highlighted groups are checked after implementation
- **THEN** their applicable visual properties match the frozen Audit reference and remaining type-specific differences are documented without retaining colored primary/danger/mode exceptions

#### Scenario: Inspect display-only status elements
- **WHEN** Section counts, pass status, preview type or read-only information are shown
- **THEN** their typography/surfaces are coordinated without fake button roles, click behavior or keyboard stops

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
