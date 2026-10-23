# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Present one preset management entry in the editor

The editor MUST expose exactly one visible and keyboard-reachable preset-management entry in each base/preset and document/header-footer editing view. Management functionality MUST remain available after removing the duplicate context entry.

#### Scenario: Open base editing
- **WHEN** the user enters base editing
- **THEN** one preset-management entry is shown and opens the existing manager, without a duplicate in the context strip

#### Scenario: Switch to preset editing
- **WHEN** the user enters preset editing or changes editing sections
- **THEN** exactly one preset-management entry remains accessible and no duplicate or missing entry is introduced

### Requirement: Freeze the existing Audit visual reference before implementation

The implementation MUST capture the existing rendered editor Audit control before changing the target controls. Border width/style/color, background, typography, relevant dimensions/radius and interaction states SHALL be traceable to that reference. Input/select controls MUST retain their native interaction, suitable widths and left-aligned value text. Display-only badges and counts MUST remain noninteractive. The reference MUST NOT be restyled first to create a false appearance of consistency.

#### Scenario: Compare controls with the original reference
- **WHEN** the six highlighted groups are checked after implementation
- **THEN** their applicable visual properties match the frozen Audit reference and remaining type-specific differences are documented without retaining colored primary/danger/mode exceptions

#### Scenario: Inspect display-only status elements
- **WHEN** Section counts, pass status, preview type or read-only information are shown
- **THEN** their typography/surfaces are coordinated without fake button roles, click behavior or keyboard stops
