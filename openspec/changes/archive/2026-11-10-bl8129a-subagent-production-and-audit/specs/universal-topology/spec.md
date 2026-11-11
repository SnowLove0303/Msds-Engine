## ADDED Requirements

### Requirement: BL-8129A SubAgent Production Parity
The system SHALL ingest the reserved source file and produce 8 standard deliverables via an isolated SubAgent.

#### Scenario: BL-8129A SubAgent Execution
- **WHEN** processing `BL-8129A msds_CN 冠志_源文件留存.docx`
- **THEN** the SubAgent SHALL generate 4 DOCX and 4 PDF deliverables with non-hazardous chemical classification
- **AND** all 8 files SHALL maintain timestamp differences within 60 seconds.

### Requirement: BL-8129A Independent Adversarial Master Audit
The parent agent SHALL execute the central master audit suite against BL-8129A deliverables as an independent verifier.

#### Scenario: BL-8129A Full Ring Verification
- **WHEN** verifying BL-8129A deliverables in the master audit suite
- **THEN** the parent agent SHALL run all 171+ assertions across Ring 1 through Ring 4
- **AND** the master audit execution SHALL produce exit code 0 and zero blocking defects.
