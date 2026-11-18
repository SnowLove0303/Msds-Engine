# hierarchical-label-semantics Specification

## Purpose
规范 MSDS 结构化表格的语义分类层级系统，确立项目开发知识库资产，将通用标签解耦为父级标签与子标签，并对产物执行严格语义审计。

## Requirements

### Requirement: Project Knowledge Base Establishment
The system SHALL establish a dedicated project development knowledge base directory under `docs/knowledge-base/` and author an authoritative taxonomy manual `MSDS_TABLE_SEMANTICS_AND_LABEL_TAXONOMY.md`.

#### Scenario: Authoritative taxonomy manual presence
- **WHEN** developers or automated agents query domain definitions
- **THEN** the knowledge base manual provides definitions, boundary axioms, and examples for all 7 semantic types (Section Header, Sequenced Label, Parent Label, Child Label, Value, Explanation Row, Data Value Row).

### Requirement: Dual-Tier Label Classification
The recognition engine SHALL classify key-value table labels into explicit hierarchical tiers, replacing the legacy generic `标签` with `父级标签` (Parent Label) and `子标签` (Child Label).

#### Scenario: Classify category aggregator as Parent Label
- **WHEN** parsing Section 8 row `手部防护：` or unsequenced classification banners whose value is blank or which govern subordinate rows
- **THEN** the system SHALL assign the semantic attribute `父级标签`.

#### Scenario: Classify specific leaf attribute as Child Label
- **WHEN** parsing specific attribute labels such as `中文名称：`, `供应商名称：`, `电话：`, `GHS分类：`, `GHS象形图：`, `手套材料：`, `呼吸系统防护：`
- **THEN** the system SHALL assign the semantic attribute `子标签`.

### Requirement: Context 1 Re-Audit and Alignment
The system SHALL regenerate `PA-3612_context1_recognition.md` using the dual-tier label classification and SHALL provide a bilateral audit report detailing the classification justification for every row.

#### Scenario: Complete elimination of generic label in Context 1
- **WHEN** the updated recognition engine processes `PA-3612`
- **THEN** the resulting Context 1 markdown contains zero generic `标签` entries, accurately differentiating `父级标签` and `子标签`.
