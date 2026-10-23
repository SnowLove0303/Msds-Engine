# Design: Bilingual Alignment and Section Label Fidelity

## Context
See `proposal.md` for motivation. The system compiles Chinese and English MSDS documents for Guanzhi and Guocai entities. In previous iterations, base DOCX template corruption occurred when attempting to fix typos directly in the template XML. This design enforces dynamic, in-memory cell label normalization without mutating underlying template assets.

## Goals / Non-Goals

**Goals:**
- Dynamically normalize Section 6.1, Section 5.4, and Section 14.4 label titles during English document rendering using `writeCellLabel`.
- Maintain clean Section 13 row formatting in both Chinese and English documents.
- Preserve 100% of authoritative Chinese ground truth facts and physical properties without synthetic overrides.

**Non-Goals:**
- Mutating base DOCX template files in `web/public/templates/` or `web/dist/templates/` (templates must remain strictly immutable).
- Fabricating or mechanically overriding empirical Chinese physical property parameters.
- Modifying UI editor features or database schemas.

## Decisions

### Decision 1: Dynamic Runtime Label Correction vs. Base Template Mutation
- **Choice**: Call `writeCellLabel(row.cells[0], normalizedLabel)` during rendering in `generate_eight_deliverables.mjs`.
- **Rationale**: Direct binary/XML patching of base templates risks corrupting OpenXML structures and causes uncommitted dirty files in git tracking. Runtime normalization guarantees clean templates across builds.
- **Alternatives Considered**: Patching `web/public/templates/正式模板_MSDS_EN_冠志(1).docx` (rejected: causes base template contamination).

### Decision 2: Pure Ground Truth Inheritance for Chinese Deliverables
- **Choice**: Chinese deliverables directly inherit from `cnGroundTruthFile`, applying only targeted string cleanup to Section 13 to eliminate accidental split lines, while keeping all physical property values intact.
- **Rationale**: Chinese physical properties (viscosity, solids, density) are empirical facts signed off by product engineers. They must not be synthesized or overwritten by heuristic models.

## Risks / Trade-offs

- **[Risk]**: Label matching regex fails if template format changes slightly.
  - **Mitigation**: Use case-insensitive prefix and keyword matching (e.g. `/Personal precautions/i` or `/Firefighting precautions/i`) when targeting label cells for rewriting.
