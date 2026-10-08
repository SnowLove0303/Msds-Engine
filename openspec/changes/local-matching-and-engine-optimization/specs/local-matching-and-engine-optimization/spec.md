# Spec Delta

## Purpose

To implement local section-specific matching plugins, pre-matching qualifier decoupling, non-hazardous transport cascading, list and narrative text convergence, and full bilingual dictionary coverage based on real-world sample verification and `AI-Agent 3.26` established rules.

## ADDED Requirements

### Requirement: Pre-Decoupling of Section 9 Test Condition Qualifiers
The system SHALL decouple test condition qualifiers (such as parenthesized concentrations or temperatures) BEFORE semantic alias matching, using purified property names for slot alignment.

#### Scenario: Pre-decoupling pH and viscosity qualifiers
- **WHEN** source text contains `pH值（1%水溶液）： 7-9` or `9.17 粘度（25℃，4号转子）： 1500 mPa.s`
- **THEN** the system strips `（1%水溶液）` to match core slot `ph` and retains the qualifier in metadata for label injection

### Requirement: Non-Hazardous Transport Cascade (Section 14)
The system SHALL detect non-hazardous declarations in Section 14 transport records and cascade standardized non-hazardous values across template transport slots.

#### Scenario: Cascading non-dangerous goods transport values
- **WHEN** Section 14 source facts state `公路和铁路运输：非危险品陆运输方式` or `非危险货物`
- **THEN** the system maps `un_number` to `不适用`, `proper_shipping_name` to `非危险品`, `transport_hazard_class` to `非危险品`, `packing_group` to `不适用`, `marine_pollutant` to `否`, and captures precautions into `special_precautions`

### Requirement: Narrative and List Item Convergence (Section 15 & 16)
The system SHALL aggregate multi-row regulatory standard items and narrative disclaimers into canonical single-slot containers.

#### Scenario: Aggregation of regulation standards
- **WHEN** Section 15 contains multiple text rows naming specific GB standards or regulations
- **THEN** the system gathers the individual rows into a unified newline-separated block bound to `safety_regulations`

#### Scenario: Disclaimer prose capture
- **WHEN** Section 16 contains a narrative disclaimer paragraph without a colon label
- **THEN** the system binds the narrative text to `other_info`

### Requirement: Unlabeled Sentence Semantic Routing
The system SHALL route unlabeled paragraphs or single-cell rows in Sections 4, 5, 6, 10, 11, 12, and 13 to standard slots based on technical keyword fingerprints.

#### Scenario: Routing combustion hazards and protective measures
- **WHEN** an unlabeled row in Section 5 mentions `燃烧释放一氧化碳...烟尘`
- **THEN** the system routes the text to `special_hazards`
- **WHEN** an unlabeled row in Section 5 mentions `消防人员必须佩戴自供气式呼吸器...`
- **THEN** the system routes the text to `protective_actions`

#### Scenario: Routing mucous membrane irritation to eye damage
- **WHEN** Section 11 contains `主要粘膜刺激性：...刺激眼睛`
- **THEN** the system routes the fact to `11.3 严重眼损伤或刺激`

### Requirement: PPE Hand Protection Clustering (Section 8)
The system SHALL cluster dispersed glove material parameters (such as FKM, IIR, NBR and breakthrough times) into the canonical `hand_protection` slot.

#### Scenario: Clustering glove materials
- **WHEN** Section 8 lists individual glove rows like `氟化橡胶 –FKM: 厚度≧0.4mm` and `丁腈橡胶 – NBR: 厚度≧0.35mm`
- **THEN** the system clusters the glove rows under `hand_protection`

### Requirement: Full Bilingual Alias Matrix (CN & EN)
The system SHALL provide symmetrical alias coverage for English MSDS terminology matching all 16 sections.

#### Scenario: Matching English MSDS records
- **WHEN** an English MSDS document is matched against standard slots
- **THEN** all core endpoints (e.g. `Physical and chemical hazards`, `Flash point`, `Transport hazard class`) achieve >= 90% recognition rate
