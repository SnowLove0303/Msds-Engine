# Spec Delta

## Purpose

Lets users carry locally recognized MSDS facts into a fresh, protected formal-template working copy while keeping the original document and its recognition evidence intact.

## ADDED Requirements

### Requirement: Transfer a recognized MSDS into a fresh template editor

The system SHALL let a user start template editing from the currently recognized DOCX. It MUST create a fresh working copy from the selected language template, preserve the source recognition model and original DOCX bytes, and write source-grounded content only into matching template value slots.

#### Scenario: Start editing a recognized Chinese MSDS

- **WHEN** a readable DOCX has been recognized and the user selects “编辑此识别结果” with a CN template
- **THEN** the editor opens a fresh CN template working copy populated from reviewed source facts, while the recognition view and source preview remain unchanged

#### Scenario: Keep an existing dirty editor copy

- **WHEN** the editor already contains unexported edits and the user starts a new recognition handoff
- **THEN** the system requires confirmation before replacing that working copy and leaves it unchanged if the user cancels

### Requirement: Review source-to-template mappings before generation

The system MUST show which source records were mapped, merged, omitted, or remain unresolved. It MUST NOT guess a target from row position alone, silently drop meaningful text, or populate a template example as a product fact. Unresolved or conflicting facts MUST block the four-variant export until the user resolves them or explicitly records an allowed source-only/omission disposition.

#### Scenario: A unique source label maps to a template slot

- **WHEN** a source field has one reviewed semantic match in the selected Section
- **THEN** its value is written to that template value slot and the source locator remains available in the mapping review

#### Scenario: A source field is ambiguous or unmatched

- **WHEN** a source field has no unique registered target or conflicts with another source value
- **THEN** the review list identifies its source Section and content, leaves the target unmodified, and prevents batch export

#### Scenario: Suppress source-absent template examples

- **WHEN** a template value has no mapped source fact or the reviewed fact is a pure missing-data placeholder
- **THEN** the system suppresses the eligible complete row before numbering, preserves required structural rows, and keeps all surviving label text and merged-cell geometry valid

### Requirement: Preserve structured content and source evidence

The handoff MUST preserve the source's logical value boundaries, meaningful line breaks, component rows, structured Section 11 sublabels, and supported embedded images. Content that cannot be represented safely in the selected template MUST remain a visible review blocker rather than being truncated or silently discarded.

#### Scenario: A value contains multiple logical lines

- **WHEN** a recognized value contains paragraphs or explicit line breaks
- **THEN** the value remains within its corresponding value cell with those logical breaks and does not create one new table row per line

#### Scenario: A source image or structured endpoint cannot be mapped

- **WHEN** a source image, merged cell, nested table, or structured endpoint has no safe target representation
- **THEN** the system preserves the source evidence and marks the item unresolved so export is blocked until it is handled

### Requirement: Require reviewed English values

For an English output derived from a Chinese source, every populated factual value MUST be supplied as a reviewed translation of its mapped source fact. The system MUST NOT copy Chinese text into an English template or infer a translation from a template example.

#### Scenario: English translation is reviewed

- **WHEN** all English value translations are marked reviewed and remain traceable to the recognized source facts
- **THEN** the English template variant is eligible for audit and export

#### Scenario: English translation is incomplete

- **WHEN** one or more required English values are missing or unreviewed
- **THEN** the system identifies those fields and blocks the four-variant export
