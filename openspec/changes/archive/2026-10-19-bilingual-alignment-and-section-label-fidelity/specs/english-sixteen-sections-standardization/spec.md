# Spec Delta: english-sixteen-sections-standardization

## MODIFIED Requirements

### Requirement: English Section 6 and Section 5 Header Fidelity
Section 6.1 header in all English MSDS deliverables SHALL be dynamically normalized to `6.1  Personal precautions, protective equipment and emergency procedures：` during rendering via safe label injection, without mutating base template files. Section 5.4 header SHALL be dynamically normalized to `5.4  Firefighting precautions and protective equipment：`. Section 14.4 header SHALL be dynamically normalized to `14.4 Special precautions for users：`.

#### Scenario: Verification of Section 6.1 Personal Precautions Header
- **WHEN** inspecting the header and label of Section 6.1 in an English MSDS deliverable
- **THEN** the label cell matches `/6\.1\s+Personal precautions,\s*protective equipment and emergency procedures/i`
- **THEN** no occurrence of `/firefighting precautions/i` exists within Section 6 table cells

#### Scenario: Verification of Section 5.4 and 14.4 Grammatical Header Polish
- **WHEN** inspecting Section 5.4 and Section 14.4 in an English MSDS deliverable
- **THEN** Section 5.4 contains `/Firefighting precautions and protective equipment/i`
- **THEN** Section 14.4 contains `/Special precautions for users/i`

## ADDED Requirements

### Requirement: Clean Section 13 Bilingual Structural Integrity
Section 13 in both Chinese and English MSDS deliverables SHALL maintain coherent block formatting without fragmented row splits or unmerged residual lines. Chinese Section 13 SHALL present full waste disposal instructions without orphaned EWC code clauses. English Section 13 SHALL cleanly present disposal recommendations and EWC directives across structured rows.

#### Scenario: Verification of Chinese Section 13 row coherence
- **WHEN** inspecting Section 13 rows in a Chinese MSDS deliverable
- **THEN** disposal method text contains complete EWC regulation statements without unwanted line breaks or split rows

#### Scenario: Verification of English Section 13 structured rows
- **WHEN** inspecting Section 13 rows in an English MSDS deliverable
- **THEN** general advice and waste disposal methods are populated into designated rows without text truncations
