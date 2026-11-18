# Specification: PA-3612 Universal Production Workflow

## ADDED Requirements

### Requirement: REQ-PA3612-01 物理源文件锁定与无损事实识别
The system SHALL locate the physical source document for `PA-3612` and extract 16 sections of chemical facts into `Context1` with zero modification.

#### Scenario: Recognize source docx
- WHEN `recognizeSourceDocx` is called on the source document
- THEN all 16 sections are parsed into `Context1` without dropping text.

### Requirement: REQ-PA3612-02 丙烯酸水性体系标准化治理
The system SHALL govern `Context1` into `Context2` using `context-governor.js`:
- Acrylic resin components SHALL be professionally translated to `Acrylic resin` and `Deionized water`;
- Trade secrets SHALL be mapped to `Trade secret`;
- Non-hazardous products SHALL strictly have `isHazardous: false` with zero pictograms and null signal word.

#### Scenario: Govern acrylic components
- WHEN `governContext` is called with acrylic components
- THEN `componentsEn` contains `Acrylic resin` with `Trade secret`.

### Requirement: REQ-PA3612-03 编辑器万能原语装配交付物
The system SHALL assemble deliverables via `editor-writer.js` and company presets:
- Template values for product-specific sections (1, 2, 3, 9, 13, 14) SHALL be cleared before writing;
- Standard statutory guidance clauses in sections 4-8, 10-12, 15-16 SHALL be preserved;
- Table row counts SHALL follow the source components dynamically.

#### Scenario: Assemble deliverable via editor primitives
- WHEN `writeDeliverableViaEditor` is invoked
- THEN the output document is assembled with populated values and standard borders.

### Requirement: REQ-PA3612-04 Coordinator 两阶全景终审
The coordinator SHALL execute two-step deep audit:
- Step 1 Mechanical Deterministic Audit (159 checks, exit code 0);
- Step 2 Agent Cognitive Fidelity Audit (16 sections bilateral alignment).

#### Scenario: Audit deliverables
- WHEN two-step audit is executed on deliverables
- THEN mechanical audit passes with exit code 0 and fidelity audit confirms 100% pass.
