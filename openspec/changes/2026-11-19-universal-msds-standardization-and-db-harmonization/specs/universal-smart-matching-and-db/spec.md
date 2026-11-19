# Capability Spec: universal-smart-matching-and-db

## ADDED Requirements

### Requirement: 通用便携式数据库架构与多引擎分发
The system SHALL provide an embedded, zero-configuration SQLite database (`web/data/msds_repo.db`) as the primary distribution storage across all models and categories, and SHALL provide a standardized MySQL schema (`web/data/mysql_schema.sql`) for centralized enterprise deployment.

#### Scenario: 引擎跨品类读取基准产出物数据
- **WHEN** processing any chemical product (whether PA, PU, OS, HPU, EC, or EP),
- **THEN** the system SHALL query `benchmark_category_specs` in the database by category ID,
- **AND** it SHALL load verified baseline engineering parameters for PPE, waste handling, and transport safeguards.

### Requirement: 全局通用智能补充机制 (Universal Standardized Harmonization)
When any product's source document is sparse or non-standardized and omits fine-grained regulatory parameters (such as glove thickness, permeation breakthrough time, or legal general principles), the smart matching engine SHALL supplement them using the category baseline repository rather than leaving empty cells or pruning mandatory structural rows.

#### Scenario: 全品类手套防护细分参数通用补齐
- **WHEN** an input document mentions hand protection in general but lacks specific glove parameters (such as EN 374-3, FKM/IIR/NBR thickness and permeation times),
- **THEN** the system SHALL retain the source requirement in the main hand protection row,
- **AND** it SHALL populate verified baseline technical values from the category database,
- **AND** no empty cells (`""`) SHALL remain in Section 8 across all deliverables.
