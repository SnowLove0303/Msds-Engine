# Proposal: Bilingual Alignment and Section Label Fidelity

## Why
Detailed cross-language inspection of EP-1702 deliverables identified discrepancies between Chinese and English MSDS versions: English Section 6.1 title contains misplaced firefighting labels from Section 5.4 in the template, Section 5.4 and 14.4 need grammatical polish, and Section 13 formatting requires systematic clean-up. Standardizing these behaviors in the generation engine ensures high fidelity across all eight deliverables without modifying or corrupting locked template files.

## What Changes
- **Runtime Section Label Protection & Polish**: Dynamically correct Section 6.1 (`6.1  Personal precautions, protective equipment and emergency procedures：`), Section 5.4 (`5.4  Firefighting precautions and protective equipment：`), and Section 14.4 (`14.4 Special precautions for users：`) in the generation engine during document compilation via `writeCellLabel`, without modifying base template files.
- **Section 13 Systematic Formatting**: Ensure clean two-part structure (general advice and disposal methods) in English deliverables, and prevent line-breaking artifacts in Chinese deliverables.
- **Ground Truth Preservation Invariant**: Strictly preserve authoritative Chinese ground truth facts and physical properties without synthetic overrides or model hallucinations.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `english-sixteen-sections-standardization`: Update requirements for dynamic runtime label protection in Sections 5, 6, and 14, and reinforce Section 13 structural formatting.

## Impact
- Affected code: `web/generate_eight_deliverables.mjs`
- Affected templates: None (templates remain strictly read-only and unpolluted)
- Affected deliverables: EP-1702 and EP-1704 8-format deliverables (CN/EN x Guanzhi/Guocai)
