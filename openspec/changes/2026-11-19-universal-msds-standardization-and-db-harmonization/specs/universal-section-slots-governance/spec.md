# Capability Spec: universal-section-slots-governance

## ADDED Requirements

### Requirement: Section 1 全品类通用名称与型号槽位硬规制
In all Chinese MSDS deliverables across all models and categories, the system SHALL place the product model code into Row 1 (`1.1 产品名称：`) and SHALL place the product Chinese name combined with model into Row 2 (`中文名称：`).

#### Scenario: 通用中文名称与型号槽位赋值
- **WHEN** generating Section 1 for any product,
- **THEN** Row 1 `1.1 产品名称：` SHALL contain the model code,
- **AND** Row 2 `中文名称：` SHALL contain the full Chinese product name and model code,
- **AND** Row 2 SHALL NOT be left blank in Chinese deliverables.

### Requirement: Section 11 全局毒理学双范式自动状态机
The system SHALL classify Section 11 into either `PARADIGM_2_TWO_COLUMN_GRID` (single-product endpoints) or `PARADIGM_1_FULL_WIDTH_MERGED` (multi-component breakdown) using an automated state machine, and SHALL NOT inject ungrounded disclaimers into single-product deliverables.

#### Scenario: 纯产品单体毒理指标自动路由至双栏表格
- **WHEN** the input document provides product-level toxicological endpoints without individual ingredient decomposition,
- **THEN** the system SHALL select `PARADIGM_2_TWO_COLUMN_GRID`,
- **AND** it SHALL render endpoints as a clean Two-Column table (Label | Value),
- **AND** it SHALL NOT emit full-width merged rows with ungrounded disclaimers ("该产品无可用的毒理学研究").

### Requirement: Section 13 全局废弃处置两行标准化分流
Across all products, the system SHALL separate the general regulatory compliance statement into Row 1 and specific disposal and recycling procedures into Row 2 (`处理方法：`).

#### Scenario: 废弃处置总则与方法分流
- **WHEN** formatting Section 13 for any product,
- **THEN** Row 1 SHALL state the statutory waste regulation compliance clause,
- **AND** Row 2 SHALL begin with `处理方法：` and specify container emptying and recycling actions,
- **AND** no ghost empty rows SHALL exist in Section 13.

### Requirement: Section 14 全局运输事实 100% 忠实保留
The system SHALL extract and faithfully preserve all transportation mode rules (road, IMDG CODE, IATA) and temperature/environmental restrictions provided in the source file across all products, and SHALL NOT replace them with generic default phrases.

#### Scenario: 运输规范与温控避光要求完整还原
- **WHEN** extracting Section 14 facts from any source document,
- **THEN** the output SHALL explicitly reflect road regulations, IMDG CODE, IATA rules, and temperature/storage boundaries,
- **AND** the English deliverable SHALL accurately translate these specific boundaries.

### Requirement: Section 15 全局法规信息结构化去重排版
The system SHALL format regulatory documents into clean individual rows or bullet points and SHALL eliminate duplicated listings across all deliverables.

#### Scenario: 法规清单格式化与去重
- **WHEN** rendering Section 15,
- **THEN** regulations SHALL each be listed cleanly without jamming into a single cell,
- **AND** duplicate occurrences of the same regulation SHALL be removed.
