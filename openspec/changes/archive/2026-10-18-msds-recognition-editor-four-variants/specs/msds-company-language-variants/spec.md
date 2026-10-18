# Spec Delta

## Purpose

Defines reusable template baselines, independent saved drafts per workspace, presets owned by their baseline, and revision-bound Word/PDF export. Language and company are metadata rather than fixed output-routing dimensions.

## ADDED Requirements

### Requirement: Register stable template baselines
The system SHALL identify each template baseline with a stable ID and asset revision. UI lists, preset ownership and export selection MUST derive from registry records rather than fixed language/company branches. Renaming a baseline MUST preserve its associations.

#### Scenario: Add a second baseline in the same language
- **WHEN** an additional supported template is registered with its own ID
- **THEN** it appears independently in editing, preset management and export eligibility without changing language-specific export code

### Requirement: Preserve independent drafts while switching baselines
The system SHALL persist a complete edited document and UI context for each workspace/baseline pair. Switching MUST save or retain the current changes before replacing the active view; a failed save MUST NOT discard content. Drafts MUST remain recoverable after refresh/restart.

#### Scenario: Switch A to B and back to A
- **WHEN** the user edits A, switches to B, edits B and returns to A
- **THEN** A restores its own values, structural edits, headers/footers and editing context, independently of B

#### Scenario: A save or late switch request fails
- **WHEN** saving fails or an earlier baseline load returns after a later selection
- **THEN** the system retains unsaved content and does not replace the latest selected baseline with an outdated result

#### Scenario: Open a different source workspace
- **WHEN** another source record or independent document workspace is opened
- **THEN** it cannot inherit a previous workspace's draft solely because product model or template language matches

### Requirement: Confirm readiness for an exact draft revision
A loaded template is not a completed draft. The system MUST allow explicit completion after saving and required review/audit checks, tie completion to a revision, and invalidate it after further edits. Export eligibility MUST be evaluated per selected baseline draft.

#### Scenario: Baseline B is unprepared
- **WHEN** only baseline A is completed
- **THEN** B and B-owned presets are unavailable for export, while A can be exported independently

#### Scenario: Edit a completed draft
- **WHEN** a completed draft receives further changes
- **THEN** its new revision requires completion confirmation before export

### Requirement: Bind presets to their owning baseline
Every usable preset MUST have one unambiguous baseline association. Creation, management, editing and export MUST respect that association on both client and server. Legacy ambiguous presets MUST retain their original data but remain unavailable until assigned; same-language baselines MUST NOT imply compatibility.

#### Scenario: Create a preset for A
- **WHEN** the user creates a preset under A
- **THEN** the preset is listed under A and cannot be applied or exported using B's draft

#### Scenario: A client submits another baseline's preset
- **WHEN** an export or apply request pairs an A draft with a B preset
- **THEN** the service rejects it without creating a mislabeled output

### Requirement: Export only selected prepared snapshots
The system SHALL generate each selected base/preset output from that baseline's saved completed snapshot and frozen preset revision. It MUST NOT load an unedited alternate template, copy values from another baseline, or rename an existing document to manufacture a missing draft. Unselected unprepared baselines MUST NOT block prepared selected targets.

#### Scenario: Chinese work exists but English work does not
- **WHEN** the user opens export after completing only the current Chinese baseline
- **THEN** no English output is generated from its values or default template examples

#### Scenario: Export several independently prepared baselines
- **WHEN** A and B are completed and their own presets are selected
- **THEN** each output retains its own draft content and template structure, without cross-baseline contamination

#### Scenario: Continue editing after export starts
- **WHEN** a generation job has frozen its input revisions
- **THEN** subsequent edits do not change that job's files and completion applies only to the revisions actually used

### Requirement: Deliver the chosen formats without hidden omissions
Users SHALL select Word, PDF or both for selected targets. PDF MUST derive from the same generated DOCX snapshot, and a PDF-only selection MUST NOT include intermediate DOCX in delivery. The batch interface MUST provide one ZIP download with unique entries and truthful actual counts. Missing conversion capability or failed files MUST be visible, never reported as complete success.

#### Scenario: Request Word and PDF
- **WHEN** all selected targets and both formats succeed
- **THEN** the ZIP contains exactly the planned Word/PDF outputs, each pair sharing the same document content

#### Scenario: PDF conversion fails
- **WHEN** one or more requested PDFs cannot be generated
- **THEN** the interface identifies failed items, retains the selection and does not silently report a Word-only package as the complete requested result

#### Scenario: Duplicate output names
- **WHEN** two selected targets resolve to the same package path
- **THEN** export requires a visible unique naming resolution rather than silently replacing a ZIP entry

### Requirement: Preserve template structure and controlled built-in company overlays
Generated documents MUST preserve their selected baseline draft's section structure, labels, geometry and supported document parts. Built-in company-only profiles MUST differ solely in their approved supplier/footer fields; custom presets MAY express their explicitly configured differences within their own baseline.

#### Scenario: Audit a built-in company-only preset
- **WHEN** a built-in company-only version is generated
- **THEN** same-baseline differences are limited to approved supplier/footer fields and unsupported differences block that output

### Requirement: Persist product and company metadata in header and footer XML
The system MUST write the reviewed product model and configured company values to existing template-owned slots while preserving unrelated formatting and package content.

#### Scenario: Reopen an exported version
- **WHEN** a generated DOCX is reopened
- **THEN** its header/footer values and intended edits match the selected draft and preset while untouched formatting remains equivalent

### Requirement: Migrate existing data without guessing ownership
Migration MUST retain legacy browser and server preset data, map only unambiguous historical identities, detect conflicts, and be repeatable without duplication. Template upgrades MUST retain old revisions and MUST NOT silently rebase saved drafts.

#### Scenario: Legacy language metadata is ambiguous
- **WHEN** a legacy custom preset could belong to several registered baselines
- **THEN** it is preserved for explicit assignment and excluded from export until ownership is resolved

#### Scenario: Multiple tabs save the same draft
- **WHEN** a client saves using a stale expected revision
- **THEN** the service reports a conflict and retains both recoverable versions instead of silently overwriting newer work


## ADDED Requirements

<!-- Acceptance gaps found during the 2026-10-17 Agent round. -->

### Requirement: Export readiness is tied to the saved completed revision

The system MUST exclude a baseline draft from export until the exact saved revision is explicitly marked completed. Editing or unsaved status MUST NOT qualify for export.

#### Scenario: Editing draft is selected
- **WHEN** the user selects an editing baseline or one of its presets
- **THEN** the export plan disables that target and provides a route to complete the baseline

#### Scenario: Completed draft changes
- **WHEN** a completed draft receives a new edit
- **THEN** its completed revision is invalidated and the new revision cannot export until saved and completed again

### Requirement: Preset ownership is explicit

Every preset used by the client or API MUST carry baselineId. Language, entity, targetTemplate text or preset name MUST NOT be used as a fallback ownership decision when baselineId is missing or ambiguous.

#### Scenario: Same-language baselines exist
- **WHEN** two registered baselines share the same language metadata
- **THEN** each preset remains attached to exactly one baseline and cannot cross into the other

### Requirement: Export and preset dialogs are keyboard-operable

Export and preset manager dialogs MUST expose dialog semantics, move focus into the dialog, contain Tab navigation, close on Escape and return focus to the opening trigger. The background MUST NOT remain keyboard reachable while a dialog is open.

#### Scenario: Open export dialog by keyboard
- **WHEN** a keyboard user opens the export dialog
- **THEN** focus enters the dialog, Tab/Shift+Tab remain within it, Escape closes it and focus returns to the export trigger

### Requirement: Keep application controls concise and task-focused

The application shell SHALL prioritize editing content and immediate actions. It MUST remove duplicate entry points, repetitive persistent explanations and promotional/internal-implementation copy. Essential baseline identity, preset context, save/error state and export eligibility MUST remain visible. Secondary help SHALL be contextual and keyboard accessible; moving an action MUST NOT remove its functionality.

#### Scenario: Edit a baseline or preset
- **WHEN** the editor is in base or preset mode
- **THEN** a compact context region identifies the baseline and active preset, the editing surface has priority, and repeated instructional banners do not consume the main workspace

#### Scenario: Open export with an unavailable baseline
- **WHEN** an unprepared baseline is listed in export
- **THEN** a concise reason and edit route remain visible without promotional guarantees or a false enabled state

### Requirement: Align application geometry and visual hierarchy

Application controls SHALL share semantic light-theme tokens, one primary action style, consistent type/spacing and control dimensions. Icons, labels, controls and status indicators in a group MUST align on common horizontal/vertical centerlines; related panels MUST share predictable edges and gutters. Long document text retains its own readable alignment. Document-renderer typography and package formatting MUST remain isolated from application styling.

#### Scenario: Inspect desktop editor chrome
- **WHEN** the editor is viewed at 1920x1080 or 1366x768 with 100 percent zoom
- **THEN** same-group controls have consistent heights and centerlines, panel headers/edges align, and secondary or destructive actions do not compete with the primary editing/export action

#### Scenario: Inspect a narrow viewport
- **WHEN** application width is 320 CSS pixels
- **THEN** controls wrap by group or stack, modal close/footer actions remain reachable, and document/table overflow is contained locally instead of pushing the application chrome off-screen

#### Scenario: Re-render an open dialog
- **WHEN** the user changes an export format or version and the application re-renders
- **THEN** focus remains in the dialog, background controls remain unreachable, and closing restores focus to the corresponding trigger even when its original DOM node was replaced

### Requirement: Verify UI completion with rendered evidence

UI completion MUST include real 5173 browser evidence for base/preset modes, both dialogs and shared page controls at the specified viewports, measured alignment and representative rendered contrast, plus a disposable preset save/reopen/export round trip and unchanged document formatting checks. Build or source scans alone MUST NOT be reported as complete browser acceptance. Pending persistence/readiness/ownership requirements MUST remain explicit.

#### Scenario: Build passes but a browser check fails
- **WHEN** build succeeds but focus, alignment, contrast or a required interaction fails
- **THEN** the corresponding acceptance task stays incomplete with the observed failure and evidence recorded

