# Proposal: Adaptive Full-Width Exemption Workflow & Semantic Fact Conservation (PA-3223 Benchmark)

## Why

In complex chemical product cases (such as the acrylic resin dispersion PA-3223 benchmark), products may be legally classified as non-hazardous ("GHS危险性类别: 无") because active components (such as N,N-dimethylethanolamine, DMEA) are neutralized as amine salts below specific release thresholds (<2.0%, threshold ≥5%). However, these products still carry extensive practical precautionary statements (prevention, accident response, storage, disposal, and sewer polymer deposition hazards) and component-level toxicology data.

The legacy pipeline suffered from catastrophic systemic defects:
1. **System Core Philosophy Inversion**: The mandated axiom ("Content must be fully inherited from the source file; format must inherit the template; the editor serves as a bridge to ensure output formatting without tampering; the matching engine is an efficiency aid rather than the final answer") was abandoned. The engine acted as an arbitrary black box, using hardcoded `deleteRow` pruning to wipe out over 20 rows of vital industrial safety statements and replacing them with generic "无适用资料。".
2. **Blind Auditing Gate Failure**: Quality gates Gate 1~8 focused strictly on formatting syntax, exit codes, and non-empty deliverables, acting as a blindfold ("遮羞布") that completely failed to detect that core source facts were murdered by the engine.
3. **Template Topology Inflexibility**: Rigid dual-column grids in Section 2 and rigid 11.1~11.3 slots in Section 11 could not accommodate full-width composite statements, and component toxicology was falsely attributed to the mixture as a whole.

The user hand-crafted an authoritative golden standard: `PA-3223 msds_CN 冠志 手做改版材料.docx`, proving that Section 2 and Section 11 must support an **Adaptive Full-Width Mode**, Section 3 tail exemption notes must be elevated into Section 2 under label elements, and Web UI styles must remain 100% frozen.

## What Changes

1. **Constitutional Axiom Re-anchoring**:
   - Re-establish that **Source Content is King**: All precautionary statements, accident responses, environmental risks, threshold exemptions, and component toxicological data in the source file MUST be preserved 100% without arbitrary omission or degradation.
   - Enforce that the Editor is the bridge and the Matching Engine is merely an assistant.

2. **Adaptive Full-Width Exemption Topology (Dual-Mode Architecture)**:
   - **Section 2 Full-Width Mode**: When non-hazardous composite features are detected, Section 2 shifts from the rigid 8-row dual-column grid into a single-cell full-width layout (`cellCount === 1`), seamlessly preserving all 4-phase precautionary procedures, physical-chemical hazards, sewer clogging risks, and absorbing Section 3 tail DMEA neutralization exemption statements.
   - **Section 3 Clean Grid Preservation**: Keep Section 3 strictly as a clean 3-column ingredient data table, elevating the explanatory exemption text into Section 2.
   - **Section 11 Three-Tier Liability Isolation Topology**: Replace rigid 11.1~11.3 slots with `[Disclaimer Row] -> [Preamble Row] -> [Component Details Full-Width Rows]` to strictly segregate mixture liability from raw component experimental data.
   - **Section 12 Redundancy Elimination**: Clean up duplicate top-level disclaimer rows, preserving clean 12.1, 12.2, 12.3 rows.

3. **Gate 9 Semantic Fact Conservation Gate (Anti-Blind Auditing)**:
   - Establish Gate 9 in `assertDeliverableQuality`: Perform source-to-output semantic fact penetration assertions. If the source file contains prevention/response/storage/disposal/sewer or neutralization exemption keywords, the compiled output MUST contain them, or the build is aborted with exit code 1.

4. **Strict Web UI & Editor Zero-Mutation Guarantee**:
   - `web/src/styles.css` and `web/index.html` remain 100% untouched (0 bytes modified, 0 lines added).
   - The Web Editor natively renders full-width rows (`gridSpan` / `cellCount === 1`) as natural full-width contenteditable blocks, preserving the exact visual appearance, color scheme, and toolbar interactions crafted by the user.

## Capabilities

### New Capabilities
- `adaptive-fullwidth-exemption-workflow`: Dynamic dual-mode generation supporting full-width Section 2 and Section 11 layouts for non-hazardous/salt-neutralized composite products, cross-section exemption elevation, and Gate 9 semantic fact penetration auditing.

## Impact

- **Backend Modules**: `web/src/pipeline-engine.js` (remove `deleteRow` pruning, add full-width assembly & Gate 9 assertions), `web/src/smart-matching.js` (Section 3 tail notes extraction), `web/src/docx-engine.js` (topology preservation).
- **Frontend Modules**: `web/src/main.js` & `web/src/render-utils.js` (maintain AST-driven full-width cell rendering without modifying CSS/HTML).
- **Target Deliverables**: `PA-3223` and future non-hazardous/exemption composite MSDS files matching the user's hand-crafted benchmark.
