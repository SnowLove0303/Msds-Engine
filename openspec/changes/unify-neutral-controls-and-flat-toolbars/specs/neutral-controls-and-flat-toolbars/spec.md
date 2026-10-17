# Spec Delta

## Purpose

为用户截图中模板编辑器指定的上下文及工具条提供局部统一的白底灰边黑字控件和单层边界，保护红框之外现有界面，并恢复 DOCX 识别页正常可读的导入空态与原有操作入口，防止局部优化污染全站。

## ADDED Requirements

### Requirement: Restrict neutral controls to designated editor toolbars

The application SHALL apply neutral control styling only to the editor baseline/preset context strip, filename/baseline strip, section heading strip, editor action header and preview action header identified by the user's first red rectangle. Enabled controls in those regions MUST use white backgrounds, gray borders and black text/icons, consistent dimensions and neutral interactive states. The styling scope MUST follow semantic components rather than screen pixel coordinates.

#### Scenario: Inspect the highlighted editor regions
- **WHEN** the user opens base or preset mode
- **THEN** only the designated toolbar/context controls receive the neutral styling, with selected/focus/disabled states identifiable

### Requirement: Preserve UI outside the selected regions

Brand/navigation, page title and top-right actions, section-list/search body, editor cells/row tools, rendered document, audit panels, matching page and dialogs SHALL retain the pre-local-change appearance. Shared elements outside the highlighted toolbars MUST NOT inherit neutral colors or changed dimensions. Existing functional repairs MUST remain preserved.

#### Scenario: Inspect outside the red rectangle
- **WHEN** the local toolbar changes are applied
- **THEN** the top-right export stays in its original blue primary style, navigation stays unchanged and document/table/list/modal content is not restyled

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
