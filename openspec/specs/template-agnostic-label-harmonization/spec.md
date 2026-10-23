# template-agnostic-label-harmonization Specification

## Purpose
Eliminate unexpected hard line breaks, broken words, and multi-paragraph fragments in label cells across all templates (Chinese and English), ensuring consistent hanging indents, word-boundary preservation, and fluid responsive typesetting.

## Requirements

### Requirement: Harmonize Multi-Paragraph and Broken Label Cells
The engine SHALL detect and flatten all label cells containing multiple `<w:p>` paragraphs or `<w:br/>` break tags into a single unified paragraph, joining English words with a single half-width space to prevent arbitrary line fragmentation.

#### Scenario: English label split into two paragraphs in template
- **WHEN** a template contains a label cell with multiple `<w:p>` paragraphs such as `12.2 Persistence and` followed by `degradability：`
- **THEN** the engine MUST merge the runs into a single paragraph with text `12.2 Persistence and degradability：`
- **AND** the engine MUST ensure exactly one half-width space separates adjacent words across previous paragraph boundaries.

#### Scenario: Label cell with explicit break tags
- **WHEN** a label cell contains one or more `<w:br/>` tags causing artificial line wrapping
- **THEN** the engine MUST remove or normalize the break tags into fluid whitespace.

### Requirement: Apply Standard Typography Invariants to All Normalized Labels
The engine SHALL inject standard hanging indent (`w:ind w:left="457" w:hanging="457"`) and explicit tab stop (`w:tab w:pos="459"`) into every normalized label cell paragraph properties (`<w:pPr>`), ensuring identical alignment regardless of template source.

#### Scenario: Normalized label paragraph indentation
- **WHEN** an English or Chinese label is flattened and written
- **THEN** its `<w:pPr>` MUST contain `<w:ind w:left="457" w:hanging="457"/>` and a left tab stop at pos `459`
- **AND** it MUST NOT retain any legacy `firstLine` indentation.
