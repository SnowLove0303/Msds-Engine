# Proposal: Handcrafted Typography Fidelity & Section 11 Dual-Paradigm Routing

## Why

Through a forensic OOXML AST comparison between the user's authoritative hand-crafted benchmark (`PA-3223 msds_CN 冠志 手做改版材料.docx`) and the current machine-generated output (`PA-3223 msds_CN 冠志.docx`), critical gaps in typographical fidelity and structural topology were uncovered:

1. **Destructive Flattening of Section 2 Indentation Geometry**:
   - The user's hand-crafted benchmark exhibits an elegant, multi-tier indentation hierarchy:
     - Secondary GHS salt exemption classification statements: `<w:ind w:firstLine="480"/>` (2-character first-line indent).
     - Major precaution labels (`预防措施：`, `事故响应：`, `安全存储：`, `废弃处置：`): `<w:ind w:firstLine="482"/>`.
     - Multi-line extended clauses (e.g., "在室外或通风良好处操作。"): `<w:ind w:firstLine="960"/>` (4-character first-line indent).
     - Sub-item explanatory text for storage: hanging indent `<w:ind w:left="1199" w:hanging="720"/>`.
     - Sub-item explanatory text for disposal: hanging indent `<w:ind w:left="959" w:hanging="480"/>`.
     - Leading micro-spacing: Preservation of a single leading space (`" "`) before bullet items.
   - The current engine's `renderFullWidthRow` completely flattened all 34 paragraphs to `left=0` with no indentation or hanging geometries, destroying the visual hierarchy of the hand-crafted document.

2. **Bold State Machine Boundary Leakage**:
   - In the hand-crafted benchmark, only major section tags and bullet headers are bold (`bold: true`), while the actual detailed operational instructions (e.g., long text for container storage integrity and empty drum recycling disposal) are strictly regular text (`bold: false`).
   - The current engine over-eagerly formatted these extended instructional bodies as bold, creating visual weight distortion.

3. **Missing Section 11 Dual-Paradigm Architectural Routing**:
   - Section 11 currently forces an all-or-nothing approach. In reality, Section 11 must strictly support **Two Mutually Exclusive Paradigms**:
     - **Paradigm 1: Full-Width Merged Mode (通栏合并模式)**: Applicable ONLY when multi-component toxicological statements ($\ge 2$ chemical components with test endpoints) are cited. Formatted as a 4-row consolidated topology (`[Title] -> [Mixture Disclaimer] -> [Preamble] -> [Single-Cell Full-Width Component Details Row]`).
     - **Paradigm 2: Standard Multi-Column Slot Mode (标准分列槽位模式)**: Applicable when a single component (e.g., PU-608 citing only NMP) or unspecified mixture data is present. The classic 18-row multi-column grid (`11.1` to `11.10`) MUST be 100% preserved without collapsing into full-width rows.

4. **Section 13 Alignment Deviation**:
   - Hand-crafted benchmark specifies justified alignment (`<w:jc w:val="both"/>`) for disposal principles, whereas the machine generated left alignment (`<w:jc w:val="left"/>`).

5. **Anti-Pattern Warning (Strictly Prohibited)**:
   - Ad-hoc scripts (e.g., manually hardcoded `*_grounded_facts.mjs` patches) are strictly rejected. All improvements must be codified directly into the core engine state machines (`docx-engine.js`, `pipeline-engine.js`, `smart-matching.js`), ensuring permanent universality across all product lines.

## What Changes

1. **Multi-Tier Indentation & Typography Engine Upgrade (`web/src/docx-engine.js`)**:
   - Enhance paragraph property formatting in `renderFullWidthRow`:
     - Detect and apply precise `<w:ind>` geometries (`firstLine="480"`, `firstLine="482"`, `firstLine="960"`, `left="1199" hanging="720"`, `left="959" hanging="480"`).
     - Calibrate bold state machine so that precaution and disposal instructional bodies are regular weight (`bold: false`).
     - Preserve leading single spaces for itemized sub-clauses.

2. **Section 11 Dual-Paradigm Dynamic Routing (`web/src/pipeline-engine.js` & `web/src/smart-matching.js`)**:
   - Implement `detectSection11Paradigm(sec11Data)`:
     - Count distinct chemical entities in toxicology data.
     - $\ge 2$ entities $\rightarrow$ Route to **Paradigm 1 (Full-Width Merged Mode)**.
     - $1$ entity or no component breakdown $\rightarrow$ Route to **Paradigm 2 (Standard Multi-Column Slot Mode)**, preserving the 18-row skeleton.

3. **Section 13 Alignment Harmonization (`web/src/docx-engine.js`)**:
   - Update disposal principle paragraph alignment to `<w:jc w:val="both"/>`.

4. **Machine Bipolar Bilayer Audit Upgrade (`web/scripts/audit_bipolar_bilayer.mjs`)**:
   - Add AST assertions verifying Section 2 indentation tiers (firstLine & hanging indents).
   - Add dual-paradigm assertions for Section 11 (PA-3223 verifies 4-row full-width mode; PU-608 verifies 18-row slot mode).
   - Assert exit code 0 across all 8 standard deliverables.

## Capabilities

### New Capabilities
- `handcraft-typography-fidelity`: Precision AST replication of hand-crafted indentation hierarchies, hanging indents, and bold boundaries in full-width cells.
- `section11-dual-paradigm-routing`: Automatic dynamic routing between multi-component full-width consolidation (Paradigm 1) and single-component classic 18-row slots (Paradigm 2).

## Impact

- **Core Engines**: `web/src/docx-engine.js`, `web/src/pipeline-engine.js`, `web/src/smart-matching.js`.
- **Audit Suite**: `web/scripts/audit_bipolar_bilayer.mjs`.
- **Target Deliverables**: PA-3223 and all subsequent MSDS product builds across Guanzhi and Guocai entities.
- **Invariants**: `web/src/styles.css` and `web/index.html` remain 100% frozen (0 bytes changed).
