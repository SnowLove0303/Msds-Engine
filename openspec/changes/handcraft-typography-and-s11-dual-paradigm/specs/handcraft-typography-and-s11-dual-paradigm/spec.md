# Spec: Handcrafted Typography Fidelity & Section 11 Dual-Paradigm Routing

## ADDED Requirements

### Requirement: Section 2 Multi-Tier Indentation Hierarchy
The document engine (`web/src/docx-engine.js`) MUST render Section 2 full-width cells with exact paragraph indentation geometry matching the user's hand-crafted benchmark (`PA-3223 手做改版材料.docx`):
1. GHS salt exemption classification statements MUST be set with `<w:ind w:firstLine="480"/>`.
2. Precautionary category headers (`预防措施：`, `事故响应：`, `安全存储：`, `废弃处置：`) MUST be set with `<w:ind w:firstLine="482"/>` and bold weight (`<w:b/>`).
3. Extended sub-items (e.g., "在室外或通风良好处操作。") MUST be set with `<w:ind w:firstLine="960"/>`.
4. Storage explanatory clauses MUST be set with hanging indent `<w:ind w:left="1199" w:hanging="720"/>` and regular font weight.
5. Empty drum disposal clauses MUST be set with hanging indent `<w:ind w:left="959" w:hanging="480"/>` and regular font weight.
6. Sub-item bullet points MUST preserve a single leading space (`" "`) micro-offset.

#### Scenario: Rendering Section 2 with multi-tier indentations
- **WHEN** Section 2 is assembled as a full-width cell in `renderFullWidthRow`
- **THEN** paragraph properties `<w:pPr>` contain distinct `firstLine`, `left`, and `hanging` attributes conforming to the 5-tier classification rules.

### Requirement: Section 11 Dual-Paradigm Dynamic Routing
The pipeline engine (`web/src/pipeline-engine.js`) and matching engine (`web/src/smart-matching.js`) MUST dynamically route Section 11 assembly between two mutually exclusive paradigms based on the multiplicity of chemical components present in toxicological data:
1. **Paradigm 1 (Full-Width Merged Mode)**: Triggered when $\ge 2$ distinct chemical components are identified. Section 11 is consolidated into 4 rows with Row 3 as a single full-width cell (`gridSpan="3"`), formatted with bold subheaders and 12pt SimSun text.
2. **Paradigm 2 (Standard Multi-Column Slot Mode)**: Triggered when only 1 component (e.g., PU-608 NMP) or unspecified mixture data is present. The classic 18-row multi-column grid from the template MUST be preserved without collapsing or row deletions.

#### Scenario: Multi-component mixture triggers Paradigm 1
- **WHEN** source data contains toxicology endpoints for two or more distinct components (e.g., acrylic dispersion, propylene glycol butyl ether, diethylene glycol butyl ether in PA-3223)
- **THEN** Section 11 is formatted as a 4-row consolidated full-width table with complete component test data in Row 3.

#### Scenario: Single-component or unspecified mixture triggers Paradigm 2
- **WHEN** source data contains toxicology endpoints for only 1 component (e.g., NMP in PU-608) or lacks component breakdown
- **THEN** Section 11 strictly retains the 18-row multi-column template topology with values mapped to their standard slots (11.1~11.10).

### Requirement: Bold State Machine Regular Weight Protection
The text formatting state machine in `web/src/docx-engine.js` MUST strictly omit `<w:b/>` on extended operational instruction bodies, ensuring bold styling is restricted to major section headers and category labels.

#### Scenario: Preventing bold leakage into precautionary body text
- **WHEN** rendering multi-sentence precaution text for container storage and empty drum recycling
- **THEN** run properties `<w:rPr>` for these instruction bodies do not contain `<w:b/>`.

### Requirement: Section 13 Justified Text Alignment
Section 13 Row 2 Col 1 (waste disposal methods) MUST be rendered with justified alignment (`<w:jc w:val="both"/>`) matching the hand-crafted benchmark.

#### Scenario: Section 13 alignment check
- **WHEN** Section 13 is generated
- **THEN** paragraphs in the disposal method content cell contain `<w:jc w:val="both"/>`.
