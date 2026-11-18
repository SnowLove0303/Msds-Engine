# Spec Delta: Context 1 Dual-Track Adversarial Audit

## Purpose
构建 Context 1 识别结果的独立反向证伪机械审计与双盲认知碰撞辅助审计体系，杜绝“先射箭再画靶”，确保对标签、值与说明行的分类与归纳具备客观真实验证能力。

## ADDED Requirements

### Requirement: Independent Mechanical Falsification Audit
The system SHALL provide an independent mechanical audit runner (`audit_context1_mechanical.mjs`) physically decoupled from the recognition engine classification logic, deploying adversarial falsification probes P1 through P4.

#### Scenario: Catch false label containing verbs, actions, or periods (Probe P1)
- **WHEN** any row is classified as `标签`, `父级标签`, or `子标签`
- **AND** its text contains action verbs ("就医", "冲洗", "佩戴", "严禁"), causal narrative clauses ("在...情况下", "由于", "如果"), ends with a Chinese period ("。"), or matches preamble guidance keywords
- **THEN** Probe P1 SHALL fail with exit code 1, reporting a critical `FALSE_LABEL_DETECTED` violation.

#### Scenario: Catch false explanation containing standard chemical property names (Probe P2)
- **WHEN** any row is classified as `说明行`
- **AND** its text is a standard chemical property term (e.g. "pH值", "初沸点", "闪点", "相对蒸气密度", "急性毒性") or starts with a valid property sequence number (e.g. `1.1`, `9.1`)
- **THEN** Probe P2 SHALL fail with exit code 1, reporting a critical `FALSE_EXPLANATION_DETECTED` violation.

#### Scenario: Catch false value containing category headers (Probe P3)
- **WHEN** any row is classified as `数据值`
- **AND** its text contains category aggregator headers (e.g. `手部防护：`, `建议：`) or section preambles
- **THEN** Probe P3 SHALL fail with exit code 1, reporting a critical `FALSE_VALUE_DETECTED` violation.

#### Scenario: Catch physical grid coordinate discrepancies (Probe P4)
- **WHEN** comparing against the source DOCX physical table grid
- **AND** a cell is physically blank in the source left column but parsed as a label in Context 1
- **THEN** Probe P4 SHALL fail with exit code 1, reporting a critical `PHYSICAL_COORDINATE_FRAUD` violation.

### Requirement: Double-Blind Cognitive Assisted Audit
The system SHALL provide a double-blind cognitive evaluation tool (`audit_context1_cognitive.mjs`) that masks existing attribute columns before evaluation and executes automated collision comparison.

#### Scenario: Mask attribute column and perform blind adjudication
- **WHEN** preparing input for cognitive evaluation
- **THEN** the system SHALL strip the `属性` column completely, leaving only row indices and raw text to prevent anchoring bias.

#### Scenario: Flag discrepancy on classification conflict
- **WHEN** cognitive adjudication differs from the generated Context 1 attribute
- **THEN** the system SHALL register a `[CRITICAL_CONFLICT]` entry in the collision matrix and present conflicting rationales.

### Requirement: Pipeline Integration and Benchmark Audit Report
The system SHALL integrate mechanical and cognitive auditors into the official CLI toolchain and generate a comprehensive verification report for benchmark samples.

#### Scenario: Execute complete audit on PA-3612
- **WHEN** running the audit suite against `PA-3612`
- **THEN** all mechanical probes SHALL pass with exit code 0, zero conflicts SHALL be reported in double-blind collision, and `PA-3612_context1_audit_report.md` SHALL be generated in the output directory.
