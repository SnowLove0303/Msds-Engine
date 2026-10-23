# pu-four-invariants-and-fidelity-repair Specification

## Purpose
The system SHALL enforce strict formatting and invariant protection for Section 9, Section 11, Section 12, and adaptive footer revision date extraction during MSDS deliverable generation.

## Requirements

### Requirement: Section 9 labels MUST implement standard hanging indents and dual-run fonts

The template engine MUST format Section 9 label cells (including 9.22 solid content with condition qualifiers) with `<w:ind w:left="457" w:hanging="457"/>` and tab stop `<w:tabs><w:tab w:val="left" w:pos="459"/></w:tabs>`. The label content MUST be split into two separate runs:
1. Sequence number run MUST use Times New Roman 10.5pt Bold (`sz="21"`), followed immediately by `<w:tab/>`;
2. Label text run MUST use SimSun / Heiti (or Arial for English) 12pt Bold (`sz="24"`).

#### Scenario: Overwriting Section 9.22 solid content label
- **WHEN** the engine processes a physical property entry with condition qualifier `固体含量：30±2%（150℃，30min）`
- **THEN** the left label cell is updated to `9.22  固体含量（150℃，30min）：` with standard hanging indent `457/457` and tab stop `459`, separating number and label font runs, while the right value cell contains only `30±2%`

### Requirement: Section 11 toxicological data MUST converge to two-column structure with standardized spacing

The template engine MUST format all Section 11 test endpoints as standard two-column rows (label cell and value cell), eliminating any leftover 3-column structures or placeholder cells in reproductive toxicity (11.7). Multiple additional information lines MUST be consolidated into a single `11.9  附加信息：` row. Numbering padding calculation MUST guarantee exactly two half-width spaces between `11.9` and the label text.

#### Scenario: Overwriting 11.7 reproductive toxicity and 11.9 additional info
- **WHEN** the engine injects reproductive toxicity and multiple additional toxicity paragraphs into Section 11
- **THEN** row 11.7 contains exactly 2 cells without intermediate columns; row 11.9 contains exactly two spaces (`11.9  附加信息：`) with internal multiline formatting in the value cell

### Requirement: Section 12 MUST preserve product-level ecotoxicological study statement

When the source document contains a product-level ecotoxicity statement ("该产品无可用的生态毒理学研究。" or English equivalent), the engine MUST preserve Row 1 as a full-width statement row even when specific component endpoints (e.g., DMAC) are identified. The engine MUST NOT prune Row 1 via blind single-cell row removal or hardcoded `deleteRow` calls.

#### Scenario: Source contains product-level statement alongside specific component endpoints
- **WHEN** the source document declares that no ecotoxicological studies are available for the product, followed by component ecotoxicity data
- **THEN** the generated Section 12 table preserves the product-level statement in Row 1 in both Chinese and English outputs, followed by endpoint data in rows 12.1 through 12.3

### Requirement: Footer revision date MUST adaptively extract from source document without dummy fallback

The engine MUST extract the authentic revision date from the source document across multiple XML text runs (`<w:t>`). In all pipeline stages and API controllers, the engine MUST NOT inject hardcoded dummy dates (such as `2026/10/10`).

#### Scenario: Source document contains cross-run revision date in footer
- **WHEN** the source footer splits revision date text across multiple `<w:t>` tags (such as `2025-12-3`)
- **THEN** the engine normalizes the extracted date to `2025/12/03` and applies it across all eight deliverable footers without falling back to any default static date
