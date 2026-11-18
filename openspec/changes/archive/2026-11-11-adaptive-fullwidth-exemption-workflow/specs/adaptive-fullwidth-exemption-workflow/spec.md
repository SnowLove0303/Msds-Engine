# Spec: Adaptive Full-Width Exemption Workflow & Four-Dimensional Deep Audit

## ADDED Requirements

### Requirement: Four Specific Modification Targets & Architectural Roles
The system MUST implement adaptive full-width exemption and deep auditing strictly across four designated modification targets while keeping Web UI styles frozen:
1. `web/src/smart-matching.js`: Source feature extraction, cross-section exemption notes elevation, and composite non-hazardous mode detection.
2. `web/src/docx-engine.js`: Underlying OpenXML single-cell full-width AST rendering (`isFullWidth`, `gridSpan`), Section 11 three-tier liability isolation topology, and Section 13 double-centering.
3. `web/src/pipeline-engine.js`: Abolition of brute-force row pruning (`while (s2.rows.length > 4) deleteRow`), dynamic assembly of Section 2 Mode B, and Gate 9 semantic fact assertion.
4. `web/scripts/run_four_dimensional_audit.mjs`: Standalone four-dimensional deep audit inspector eliminating blind exit-code-only verification.

#### Scenario: Concrete target modifications
- **WHEN** adaptive full-width exemption workflow is invoked
- **THEN** changes are strictly bounded within the four modification targets without touching any out-of-scope files.

### Requirement: Adaptive Full-Width Section 2 Composite Assembly
The pipeline engine (`web/src/pipeline-engine.js`) and matching engine (`web/src/smart-matching.js`) MUST assemble Section 2 as a single-cell full-width layout when non-hazardous composite precautionary statements and threshold exemptions are detected in the source document.

#### Scenario: Non-hazardous product with complex precautionary procedures
- **WHEN** source document indicates non-hazardous classification (`GHS危险性类别: 无`) alongside complete precautionary statements (prevention, accident response, storage, disposal, and environmental hazards)
- **THEN** Section 2 is generated as a full-width single-cell block preserving all statements verbatim, strictly prohibiting replacement with "无适用资料。" or deletion of rows.

#### Scenario: Cross-section neutralization exemption note elevation
- **WHEN** Section 3 tail contains neutralization salt, amine bonding, or specific concentration limit notes (e.g., DMEA <2.0%, threshold ≥5%)
- **THEN** `extractSection3ExemptionNotes` in `web/src/smart-matching.js` elevates these legal exemption facts into Section 2 directly under label elements, providing statutory classification justification while keeping Section 3 as a clean 3-column table.

### Requirement: Section 11 Three-Tier Liability Isolation Topology
When a product mixture lacks mixture-level toxicology testing and cites component experimental data, `web/src/docx-engine.js` and `web/src/pipeline-engine.js` MUST format the data into a three-tier structure to isolate legal liability.

#### Scenario: Mixture lacking overall testing cites component toxicological endpoints
- **WHEN** source document states "该产品无可用的毒理学研究" and lists independent component data (e.g., dispersion, glycol ethers)
- **THEN** Section 11 formats: Row 1 as full-width product disclaimer, Row 2 as component preamble, and Row 3+ as component-labeled multi-paragraph blocks without falsely assigning individual component LD50 values to slots 11.1~11.3.

### Requirement: Four-Dimensional Deep Audit Suite
The system MUST provide an automated deep audit script `web/scripts/run_four_dimensional_audit.mjs` verifying four comprehensive dimensions:
1. Dimension 1 (Content Fidelity): 100% keyword penetration of 4-phase precautionary statements, environmental sewer clog hazards, and salt exemptions.
2. Dimension 2 (OOXML Geometry): 100% flush-left (`w:jc="left"`), 420/565 dxa hanging indents, zero illegal `<w:tabs>`, G-11 font weight separation (non-bold values), and zero broken borders.
3. Dimension 3 (Legal Topology): Section 2 dual-mode routing, Section 3 clean 3-column center alignment, and Section 11 three-tier liability isolation.
4. Dimension 4 (Deliverables & Retention): Backup SHA-256 integrity, 8-deliverable completeness, 5-item Guanzhi/Guocai whitelist consistency, and 100% zero Chinese characters in English deliverables.

#### Scenario: Verification blocks deliverables missing source safety statements or violating geometry
- **WHEN** `run_four_dimensional_audit.mjs` is executed on compiled deliverables
- **THEN** it outputs an itemized four-dimensional score and throws a fatal error with exit code 1 if any blocker or critical defect is detected.

### Requirement: Web UI & Editor Style Zero-Mutation Invariant
The Web UI styles, CSS classes, HTML layout, and button functions MUST remain completely frozen during and after full-width rendering.

#### Scenario: Editor natively renders full-width rows without CSS/DOM alteration
- **WHEN** a full-width Section 2 or Section 11 document is opened in the Web Editor (`http://127.0.0.1:5173/`)
- **THEN** the editor renders the row across the full table width via existing AST cell rendering, with zero changes to `web/src/styles.css` and `web/index.html`.
