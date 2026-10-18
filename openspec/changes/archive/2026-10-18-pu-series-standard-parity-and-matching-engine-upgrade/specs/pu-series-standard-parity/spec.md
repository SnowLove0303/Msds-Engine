# Spec Delta

## Purpose

Defines behavioral and semantic contracts for aligning smart matching and template injection output with historical standard answers (PU-1001 ~ PU-1004 benchmark), including granular Section 2 slot projection, Section 11/12 endpoint pruning, Section 15 regulation expansion and ordering, Section 4/5 template profile binding and line breaks, Section 1/3 source naming fidelity, and export-reload verification.

## ADDED Requirements

### Requirement: Section 2 Granular Slot-to-Row Projection
The smart matching injection engine SHALL project Section 2 semantic facts to individual template rows representing GHS classification, label elements, pictogram, signal word, hazard statements, precautionary statements, physical hazards, health hazards (including sub-items), environmental hazards, and other hazards, instead of collapsing multiple semantic items into compound cells.

#### Scenario: GHS hazard identification multi-row structure
- **WHEN** injecting matched Section 2 facts into the CN template
- **THEN** GHS classification, label elements, signal word, hazard statements, and precautionary statements are written to their respective independent template rows
- **THEN** unpopulated template hazard rows are deleted and remaining rows renumbered continuously
- **THEN** total rows in Section 2 match standard answer structure (12 to 15 rows)

#### Scenario: Non-hazardous classification statement
- **WHEN** the source document classifies the product as non-hazardous (e.g. 未被分类 / 根据GHS不属于危害化学品)
- **THEN** the classification statement is written to row 2.1 and physical/health/environmental hazard classifications retain non-hazardous indicators

### Requirement: Section 11 and Section 12 Endpoint Presence Manifest and Pruning
The smart matching injection engine SHALL determine whether specific test endpoints exist in the source document. When the source document only contains a general product-level availability statement ("该产品无可用的毒理学/生态学研究。"), the engine SHALL physically delete all unsupported test endpoint rows and template placeholder rows containing "无数据资料".

#### Scenario: Section 11 product-level statement pruning
- **WHEN** matching Section 11 with no specific endpoint study in source
- **THEN** all template endpoint rows (acute toxicity oral/dermal/inhalation, irritation, sensitization, mutagenicity, carcinogenicity, reproductive toxicity 11.1~11.10) are deleted
- **THEN** Section 11 retains exactly the title row and the product-level statement row ("该产品无可用的毒理学研究。")
- **THEN** ghost template text (such as "二乙二醇单丁醚") is 100% eliminated

#### Scenario: Section 12 product-level statement pruning
- **WHEN** matching Section 12 with no specific ecotoxicity endpoints in source
- **THEN** rows 12.1, 12.2, 12.3 with "无数据资料" are deleted
- **THEN** Section 12 retains exactly the title row and the product-level statement row ("该产品无可用的生态毒理学研究。")

### Requirement: Section 15 Regulatory Sequence Alignment and Dynamic Capacity Expansion
The smart matching injection engine SHALL preserve the statutory order of regulation entries and ensure zero truncation. If the template's available table rows are insufficient to hold all identified regulations, the engine SHALL dynamically append/clone styled rows.

#### Scenario: Standard 5-regulation sequence and completeness
- **WHEN** injecting Section 15 regulatory facts
- **THEN** entries follow: 物质或混合物的相关安全、健康和环保法律法规 -> 其它的规定 -> 符合下列法规要求 -> 危险化学品安全管理条例 -> GB/T 16483 -> GB 13690 -> GB 30000.2-29 -> GB 15258
- **THEN** GB 15258 is guaranteed to be present and never silently dropped

### Requirement: Section 4 Template Profile Row Binding
The smart matching engine SHALL use an explicit template profile mapping semantic keys to specific CN template row positions to guarantee that source first aid facts reliably replace all template default placeholder values.

#### Scenario: CN template first aid row replacement
- **WHEN** matching Section 4 for PU products
- **THEN** `symptoms` binds to CN row 4.1 (一般措施)
- **THEN** `ingestion` binds to CN row 4.2 (误服)
- **THEN** `eye_contact` binds to CN row 4.3 (接触眼睛)
- **THEN** `skin_contact` binds to CN row 4.4 (接触皮肤)
- **THEN** `inhalation` binds to CN row 4.5 (吸入)
- **THEN** no template default sample text remains in writable cells

### Requirement: Section 5 Semantic Line Break Preservation
The smart matching engine SHALL preserve semantic line breaks within multi-sentence firefighting statements according to a defined `line_break_policy`.

#### Scenario: Firefighting multi-sentence statements
- **WHEN** Section 5.3 contains multiple distinct statements (e.g. release of CO/CO2/NOx and smoke inhalation warning)
- **THEN** the statements are preserved with a semantic newline separator
- **WHEN** Section 5.4 contains firefighter equipment and contaminated runoff warnings
- **THEN** the two statements are preserved with a semantic newline separator

### Requirement: Section 1 and Section 3 Source Naming Fidelity
The smart matching engine SHALL enforce rigorous source-grounded naming conventions for product identity and composition components.

#### Scenario: Section 1 Chinese product name model spacing
- **WHEN** formatting the Chinese product name in Section 1 row 1.1 / 中文名称
- **THEN** the value is formatted as `<source_chinese_name> <model>` with exactly one ASCII space between the name and model (e.g. `水性聚氨酯光亮剂树脂 PU-1002`)

#### Scenario: Section 3 component name verbatim fidelity
- **WHEN** extracting and populating components in Section 3
- **THEN** component names preserve the exact source text (e.g. `水性聚氨酯树脂分散体` for PU-1002) without shortening or alias generalization

### Requirement: Export and Reload Verification
The system SHALL verify that when the editor document is saved to disk and reloaded via `loadDocx`, all populated cells match expected values and row counts match parity targets.

#### Scenario: Roundtrip reload parity
- **WHEN** executing `exportDocx` and then `loadDocx` on the result
- **THEN** all 16 sections match the in-memory write plan and pass parity checks against standard answer benchmarks
