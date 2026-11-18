# cas-audit Specification

## Purpose
Define industrial-grade automated verification standards for Chemical Abstracts Service (CAS) registry numbers across MSDS/SDS documents. Ensures mathematical weighted modulo-10 checksum compliance, trade-secret exemptions, 1:1 ground-truth fidelity against customer source documents, chemical entity-to-CAS coherence (preventing identity confusion), and cross-section penetration between Section 2.2 label hazardous components and Section 3 composition tables.

## Requirements

### Requirement: SPEC-CAS-01 CAS Standard Format and Mathematical Checksum Verification
The system SHALL validate all non-exempt CAS number strings in Section 3 and Section 2 against the standard IUPAC/CAS format `^[0-9]{2,7}-[0-9]{2}-[0-9]$` and assert that the mathematical weighted checksum modulo 10 equals the declared check digit.

#### Scenario: Valid non-exempt CAS number verification
- **WHEN** a valid non-exempt CAS string (e.g. `107-98-2`) is encountered
- **THEN** the system calculates the weighted sum modulo 10 and asserts equality with the check digit `2`.

#### Scenario: Commercial trade secret and proprietary exemption
- **WHEN** the component is explicitly declared as a trade secret, proprietary polymer, or unlisted in source (e.g. `商业机密`, `保密`, `Trade secret`, `Proprietary`, `无`, `—`)
- **THEN** the system SHALL exempt it from numeric checksum validation and mark it as legally compliant.

### Requirement: SPEC-CAS-02 Source Ground-Truth CAS Fidelity
The system SHALL extract the baseline set of CAS numbers from the physical source document and assert that the deliverable Section 3 CAS set equals the source CAS set with 1:1 bi-directional equivalence.

#### Scenario: 1:1 fidelity against source CAS numbers
- **WHEN** auditing deliverables against the source document
- **THEN** the system asserts that all source CAS numbers exist in deliverables and no foreign unapproved CAS numbers are exogenously injected.

### Requirement: SPEC-CAS-03 CAS-to-Chemical-Name Semantic Coherence
The system SHALL verify that the stated Chinese chemical name, English chemical name, and CAS number refer to the same chemical entity without cross-contamination.

#### Scenario: Coherence check between name and CAS
- **WHEN** auditing a component row with a recognized CAS (such as `107-98-2`)
- **THEN** the system asserts that the stated chemical names correspond to `1-甲氧基-2-丙醇` / `丙二醇甲醚` / `1-Methoxy-2-propanol` and triggers an alarm if a conflicting substance is declared.

### Requirement: SPEC-CAS-04 Section 2 to Section 3 Cross-Section Penetration Audit
The system SHALL cross-examine Section 2.2 declared hazardous components against Section 3 component records.

#### Scenario: Penetration verification from label elements to composition
- **WHEN** Section 2.2 declares a hazardous component on the label
- **THEN** the system verifies that the declared component exists in Section 3 and that its CAS number matches the chemical entity.

### Requirement: SPEC-CAS-05 Central Master Suite and Pipeline Integration
The system SHALL integrate the CAS audit assertions into the central master audit suite and pipeline, strictly returning exit code 0 if all CAS assertions pass alongside all other master invariants.

#### Scenario: Automated gating on CAS failure
- **WHEN** any CAS format, checksum, or source fidelity assertion fails
- **THEN** the system returns exit code 1 and aborts the release pipeline.
