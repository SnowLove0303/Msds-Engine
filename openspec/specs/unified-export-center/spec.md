# unified-export-center Specification

## Purpose
The unified export center SHALL help users select only eligible baseline drafts and deliver the requested Word/PDF outputs in one truthful package. It shall appear as an independent window, explain blockers clearly, and never represent an incomplete artifact set as a complete export.

## Requirements

### Requirement: Present the export center as an independent modal

The export center MUST appear above the editor with a viewport-fixed backdrop, centered bounded dialog, clear title/close area, independently scrollable body and reachable footer actions. It MUST NOT render as content after the editor page. Its visual rules SHALL be scoped to export center and MUST NOT change other dialogs.

#### Scenario: Open export center on desktop
- **WHEN** the user opens export at a desktop viewport
- **THEN** a centered dialog overlays the editor, the editor remains visible behind its backdrop and page layout height does not grow due to modal content

#### Scenario: Export content exceeds viewport height
- **WHEN** baseline groups and delivery preview exceed available dialog height
- **THEN** only the dialog body scrolls while title/close and footer actions remain visible and reachable

#### Scenario: Open export center at narrow width
- **WHEN** the CSS viewport is 320 pixels wide
- **THEN** the dialog fits within the viewport, controls wrap or stack accessibly, and no modal-induced global horizontal overflow occurs

### Requirement: Explain export readiness and selection blockers

The export center MUST distinguish baseline states including unstarted, editing, dirty/unsaved, completed/ready, and eligible targets that are not yet selected. When no output is eligible, it MUST state why and provide the corresponding editing/completion route. The export action MUST be disabled only when no valid target/format is selected or the operation is in progress, with the reason visible. Selecting a format alone MUST NOT imply a target is ready.

#### Scenario: All baselines are editing or dirty
- **WHEN** every baseline is editing or has unsaved changes
- **THEN** the delivery count is zero, the export action is disabled, each blocker is explained, and the user can navigate to the affected baseline to finish the required work

#### Scenario: One baseline is ready and another is not
- **WHEN** at least one selected baseline is completed and saved while another is editing
- **THEN** the ready baseline can be exported independently; the unready baseline is visibly excluded and does not block it

#### Scenario: Ready targets exist but none is selected
- **WHEN** one or more baselines are eligible but no base/preset target is checked
- **THEN** the interface identifies that selection is missing and does not conflate it with an unready baseline

### Requirement: Deliver exactly the requested successful artifact set

The browser export workflow MUST freeze or otherwise consistently use the selected target and format set for an operation. Word outputs MUST be included for requested eligible Word targets. PDF outputs MUST derive from the corresponding generated DOCX. The ZIP MUST contain unique paths and report planned versus actual files. Missing, duplicate or failed requested outputs MUST NOT be described as full success.

#### Scenario: Word-only export
- **WHEN** one or more ready targets are selected with Word only
- **THEN** one ZIP download contains exactly the requested DOCX files and reports its actual file count

#### Scenario: Both formats requested and PDF conversion fails
- **WHEN** Word and PDF are selected but one or more PDF conversions fail
- **THEN** the interface reports each failed PDF and identifies any partial package; it MUST NOT label the requested Word+PDF set as fully successful

#### Scenario: PDF-only conversion fails
- **WHEN** only PDF targets are requested and conversion produces no PDF
- **THEN** no empty or substitute DOCX ZIP is downloaded, and an actionable conversion error is shown

#### Scenario: ZIP filename collision occurs
- **WHEN** two selected outputs resolve to the same ZIP path
- **THEN** export resolves the collision or fails visibly before reporting success; entries MUST NOT overwrite silently

### Requirement: Preserve modal accessibility and current work

Opening export MUST move focus into the dialog and keep the current background inert. Tab/Shift+Tab MUST remain in the dialog. Format/target selection rerenders MUST retain focus and selection. Escape/cancel/close MUST restore the previous background state and focus to the opening trigger without clearing drafts or changing persistent export defaults.

#### Scenario: Change target selection and close
- **WHEN** the user selects targets/formats, causes a rerender and closes the dialog
- **THEN** focus remains inside during the dialog, draft content remains unchanged, and focus returns to the export trigger on close
