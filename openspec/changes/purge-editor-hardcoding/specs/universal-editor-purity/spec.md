# Universal Editor Purity Specification

## ADDED Requirements

### Requirement: Arbitrary Section Count & Zero Legacy Quirks in Dynamic Mode
The universal editor layers (`render-utils.js`, `universal-editor-primitives.js`, `template-editor.js`, `main.js`) SHALL process any N-section template without `1..16` caps, hardcoded disclaimer text matching, or unguarded `sectionNumber === 2/3/8/9/11` special cases when operating in dynamic topology mode.

#### Scenario: Process 20-section dynamic template without truncation
- **WHEN** a template with 20 sections (numbered 1..20) is analyzed by `detectTemplateProfile` or locked by `applyTopologyTypographyLock` in dynamic topology mode
- **THEN** all 20 sections SHALL be processed uniformly without skipping sections > 16 or triggering Section 2/3/8/9/11 legacy overrides.

#### Scenario: Web UI reflects dynamic section counts everywhere
- **WHEN** a template with N sections (N != 16) is loaded in `main.js`
- **THEN** the topbar status, `sectionNav`, `scrollToSectionInPreview`, and audit toast SHALL reflect N sections dynamically rather than hardcoded `16`.
