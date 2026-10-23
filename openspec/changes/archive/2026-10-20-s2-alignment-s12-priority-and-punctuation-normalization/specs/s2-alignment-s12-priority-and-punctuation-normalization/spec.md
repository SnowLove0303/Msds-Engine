# Spec Delta

## Purpose

Enforces strict Section 2 label and sequence alignment, guarantees Section 12 sequence binding priority to prevent keyword hijacking, introduces intelligent sentence terminal punctuation normalization, and codifies preventive governance in MSDS Studio skills.

## ADDED Requirements

### Requirement: Section 2 Label Alignment and Hanging Indent Standardization
The system SHALL standardize the indentation and tab stops of Section 2 rows (2.1, 2.2, 2.3, 2.4) using identical hanging indents (457 dxa) and tab stops (459 dxa) to ensure vertical alignment of sequence numbers and first label characters.

#### Scenario: Compound Section 2 assembly
- **WHEN** a compound Section 2 is processed and mapped to the template
- **THEN** rows 2.1, 2.2, 2.3, and 2.4 receive `w:ind` with `w:left="457" w:hanging="457"` and `<w:tabs><w:tab w:val="left" w:pos="459"/>`, achieving perfect label and sequence alignment.

### Requirement: Section 12 Explicit Sequence Slot Priority
The system SHALL prioritize explicit source sub-item sequence numbers (e.g., `12.1 生态毒性`, `12.3 其他`) over fuzzy keyword matches, preventing source facts from being overwritten or lost.

#### Scenario: Disambiguating 12.1 and 12.3
- **WHEN** the source document contains both an explicit `12.1 生态毒性` and an explicit `12.3 其他` mentioning aquatic species
- **THEN** the system binds the 12.1 text to `12.1 生态毒性：` and the 12.3 text to `12.3 其他不利的影响：` without overwriting or pruning.

### Requirement: Intelligent Terminal Punctuation Normalization
The system SHALL automatically complete terminal punctuation for narrative or instructional Chinese clauses that lack ending punctuation, while preserving numeric parameters, physical properties, units, and standard codes.

#### Scenario: Normalizing unpunctuated narrative statements
- **WHEN** an extracted descriptive sentence (such as "若发生皮肤反应，就医" or "更换被污染或浸湿的衣物") has no terminal punctuation
- **THEN** the system appends a Chinese period `。` and normalizes standalone "无数据" to "无数据资料。".

### Requirement: Skill Specification Governance for Layout and Hygiene
The system SHALL document these layout invariants, sequence binding rules, and punctuation audit items in `SKILL.md` to prevent regression during agent invocations.

#### Scenario: Skill guidelines reference
- **WHEN** an Agent consults `msds-studio` guidelines
- **THEN** the Agent observes the Section 2 alignment invariant, Section 12 sequence priority, and punctuation completion checklist.
