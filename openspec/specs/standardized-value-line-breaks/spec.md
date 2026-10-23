# standardized-value-line-breaks Specification

## Purpose
Establish a standardized semantic line-break policy for content values (Value Cells) across all 16 sections in both Chinese and English MSDS deliverables, ensuring symmetrical multi-line paragraph layout matching official benchmarks and user visual expectations.

## Requirements

### Requirement: Symmetrical Multi-Line Value Formatting
The engine SHALL format long narrative and multi-clause values in English and Chinese with explicit semantic line breaks (`\n`), ensuring that sections 2.1, 2.2, 2.3, 5.3, 5.4, 6.1, 7.1, 12.1, 13, and 14.4 maintain matching multi-line clauses across bilingual outputs.

#### Scenario: Section 5.3 specific hazards line break
- **WHEN** generating Section 5.3 in English
- **THEN** the value MUST be formatted with a line break between combustion gas products and the smoke avoidance clause:
  `Combustion may release carbon monoxide, carbon dioxide, nitrogen oxides and trace amounts of hydrogen cyanide.\nDo not breathe fumes/smoke in case of fire or explosion.`

#### Scenario: Section 5.4 protective equipment line break
- **WHEN** generating Section 5.4 in English
- **THEN** the value MUST be formatted with a line break between breathing apparatus requirement and water contamination prevention:
  `Firefighters must wear self-contained breathing apparatus.\nDo not allow contaminated fire-fighting water to enter soil, groundwater, or surface water.`

#### Scenario: Section 6.1 emergency procedures line break
- **WHEN** generating Section 6.1 in English
- **THEN** the value MUST be formatted with a line break separating protective equipment and ventilation/evacuation:
  `Wear protective equipment.\nEnsure adequate ventilation. Keep unauthorized persons away.`

#### Scenario: Section 7.1 handling precautions line breaks
- **WHEN** generating Section 7.1 in English
- **THEN** the value MUST be formatted with 3 distinct lines matching Chinese benchmark clauses:
  Line 1: `Observe common chemical precautions during handling. Avoid contact with skin and eyes.`
  Line 2: `Keep away from food, drink and tobacco. Wash hands before breaks and at the end of workday. Store work clothing separately.`
  Line 3: `Change contaminated or soaked clothing.`

#### Scenario: Section 12.1 ecotoxicity study line break
- **WHEN** generating Section 12.1 in English
- **THEN** the value MUST be formatted with a line break separating the study availability statement and the sewer disposal prohibition:
  `No ecotoxicological studies are available for this product.\nDo not allow to enter drains, water courses or soil.`

#### Scenario: Section 14.4 special precautions line breaks
- **WHEN** generating Section 14.4 in English
- **THEN** the value MUST be formatted with 3 distinct lines:
  Line 1: `Not regulated as dangerous goods.`
  Line 2: `Temperature must not exceed +40℃ and must not fall below +5℃.`
  Line 3: `Keep away from food, acids and bases.`

### Requirement: Preservation of User-Defined Label Visual Formatting
The engine SHALL preserve the author's intentional visual line breaks and multi-paragraph layout in all template label cells, prohibiting automated flattening or merging of label paragraphs.

#### Scenario: Multi-paragraph English template labels
- **WHEN** a template contains intentional multi-paragraph or wrapped labels such as `12.2 Persistence and\ndegradability：` or `5.3 Special hazards of\nsubstances or mixtures：`
- **THEN** the engine MUST leave the label cell paragraphs intact without merging them into a single line.
