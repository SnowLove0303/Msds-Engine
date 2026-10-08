# Spec Delta

## Purpose

Defines explicit semantic slot routing rules for Section 1 and strict label/category-header immutability and physical isolation constraints across all 16 MSDS sections to prevent value injection from overwriting labels or hijacking parent category headers.

## ADDED Requirements

### Requirement: Section 1 Slot Routing and Parent Header Blank Invariance
The matching and injection engine SHALL route `product_name` exclusively to `中文名称：` whenever the template contains a `中文名称：` row. The parent sub-clause header row `1.1  产品名称：` SHALL retain an empty value cell.

#### Scenario: Injecting product name into Chinese template
- **WHEN** matching and injecting a product name like `聚氨酯分散体 PU-2341E` into a Chinese template containing both `1.1  产品名称：` and `中文名称：`
- **THEN** the value `聚氨酯分散体 PU-2341E` is written into the value cell of `中文名称：`
- **THEN** the value cell of `1.1  产品名称：` remains empty

#### Scenario: English template product name fallback
- **WHEN** matching and injecting a product name into an English template that lacks a `Chinese name:` row
- **THEN** the value is written directly to `1.1  Product name：`

### Requirement: All 16 Sections Category Header and Bold Label Protection
The injection engine SHALL strictly separate labels from values across all 16 sections. It SHALL NOT write values into any cell designated as `kind === 'label-only'`, any cell with `labelText`, or any structural category header row (including `1.1 产品名称：`, `1.3 供应商信息：`, `8.1 暴露控制：`, `工作场所组分控制参数`, `物质或混合物的相关安全、健康和环保法律法规`). Values SHALL strictly be routed to editable value cells (`kind !== 'label-only'` and `editable === true`).

#### Scenario: Protection against label cell overwrite on single cell rows
- **WHEN** injecting data into a row where only a label cell exists or no second value cell is present
- **THEN** the engine does not fallback to overwriting column 0 label cell
- **THEN** all bold runs and label texts remain immutable

#### Scenario: Toxicological multi-column label protection
- **WHEN** injecting acute toxicity or reproductive toxicity in Section 11
- **THEN** column 0 category headers (`11.1  急性毒性：`, `11.7  生殖毒性：`) and column 1 sub-labels (`经口：`, `生育力`) remain intact with bold formatting
- **THEN** data is written strictly into column 2

#### Scenario: Regulatory header protection in Section 15
- **WHEN** injecting applicable regulatory statutes into Section 15
- **THEN** structural headers `其它的规定：` and `符合下列法规要求：` are protected and never overwritten
- **THEN** statutes are written sequentially into subsequent data rows
