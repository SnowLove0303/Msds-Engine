## MODIFIED Requirements

### Requirement: Embedded template workspace

The system SHALL provide embedded CN 冠志 and EN 冠志 templates and SHALL let the user switch between them in the editor workspace. The editor MUST display the template's sixteen-section structure, merged-cell layout, labels, values, and a source-style preview before editing. The editor MUST synchronously update the baseline dropdown, section navigation, and active draft pool whenever switching between CN and EN templates.

#### Scenario: Open the default template

- **WHEN** the user enters the editor workspace
- **THEN** the CN template is available as the default or explicitly selectable template, its sections are navigable, and the source template remains unchanged

#### Scenario: Switch language template

- **WHEN** the user selects EN 冠志 and confirms the switch
- **THEN** the editor replaces the working copy with the EN template, resets dirty state, updates the section preview and fields to English (e.g., Section 1 is `1.Identification`), and sets the current baseline identifier to `baseline_en_guanzhi`
