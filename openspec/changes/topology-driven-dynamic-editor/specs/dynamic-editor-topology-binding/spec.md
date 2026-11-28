# Dynamic Editor Topology Binding Specification

## ADDED Requirements

### Requirement: Pluggable Topology Slot Integration in Editor
The editor (`template-editor.js` and Web UI `main.js`) SHALL support mounting any template `.docx` or `MsdsEngineStandardTopology` bundle via `topology-plugin-slot.js`, driving editor structure from the mounted topology, and cleanly unmounting back to default unmounted state.

#### Scenario: Mount arbitrary N-section template in Web Editor
- **WHEN** a user uploads a `.docx` template with N sections (e.g., 6 sections) and M columns (e.g., 3 columns) or mounts an `MsdsEngineStandardTopology` bundle
- **THEN** the editor SHALL dynamically render N section navigation entries and M-column table geometry matching `topology.sections`, without assuming 16 sections or 2 columns.

#### Scenario: Unmount topology and reset editor state
- **WHEN** the user triggers unmount / reset to default in the editor
- **THEN** `defaultTopologySlot.unmountTemplate()` SHALL be invoked and the Web UI editor state (`currentTopology`, `engine`, active section selection) SHALL return to the clean unmounted state.

### Requirement: Topology-Constrained Row & Cell Editing
The editor's structural rendering and mutation primitives (`render-utils.js`, `template-editor.js`) SHALL honor `vMergeGroups`, `rowTemplates`, `tableLayout`, `columnWidths`, and `typographyProfile` from the mounted `MsdsEngineStandardTopology`.

#### Scenario: Render merged cells and locked header rows
- **WHEN** a section in `topology.sections` defines `vMergeGroups` and `rowTemplates.lockedRowIndices`
- **THEN** the Web UI editor SHALL render `rowspan`/`colspan` faithfully and protect locked rows from accidental deletion, while row insertion clones from `rowTemplates.kvCloneRowIndex` or `dataCloneRowIndex`.

#### Scenario: Dynamic WYSIWYG typography projection
- **WHEN** `topology.typographyProfile` and `topology.docDefaults` specify font families, sizes, spacing, and indents
- **THEN** both the Web UI cell renderer and `applyTopologyTypographyLock` / `applyGlobalTypographyProjection` SHALL apply those extracted values instead of hardcoded `宋体`/`Arial`/`420`/`9781` constants.
