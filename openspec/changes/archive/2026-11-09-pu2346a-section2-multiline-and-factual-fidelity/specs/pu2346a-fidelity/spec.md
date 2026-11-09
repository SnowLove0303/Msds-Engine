# Spec: PU-2346A Section 2 多行结构重构与全维度事实忠实度规范 (PU-2346A Section 2 Multi-line & Factual Fidelity)

## ADDED Requirements

### Requirement: Section 2 多行表格重构与防撕裂属性解除 (REQ-01)
The system SHALL decompose Section 2 full-width table into 5 distinct rows (2.1 Classification, 2.2 Label Elements, 2.3 Hazard Statements, 2.4 Precautionary Statements, 2.5 Other Hazards) instead of a monolithic single-row container, and SHALL NOT inject `<w:cantSplit/>` into multi-line rows in Table 2, preventing pagination cliff, orphan pages, and bottom content truncation.

#### Scenario: Section 2 内容自然流转与 P403/P501 零截断
- **WHEN** building Section 2 for hazardous chemicals with extensive classification and precautionary statements
- **THEN** the engine SHALL distribute paragraphs across 5 independent rows in Table 2
- **AND** it SHALL exempt Table 2 rows (especially Row 4 Precautionary statements) from `<w:cantSplit/>`
- **AND** all precautionary statements including P403, P235, and P501 SHALL remain 100% visible in rendered PDF
- **AND** the document SHALL eliminate page 1 blank spaces and page 2 orphan header pages, converging to standard 5 pages total.

### Requirement: 中英文文本格式均一化与标点粘连修复 (REQ-02)
The system SHALL unify Chinese label cell font sizes to 12pt (`sz="24"`), restore English Section 8 labels to standard 9.5pt (`sz="19"`), insert proper space between joined English sentences, supply terminal periods to full English statements, and enforce double space after Section 9 label sequence numbers.

#### Scenario: 中文标签单元格字号纯净无断层
- **WHEN** formatting Chinese label cells in column 0 across all sections
- **THEN** all characters including sequence numbers SHALL have `sz="24"` (12pt Songti Bold)
- **AND** no runs SHALL have `sz="21"` or 10.5pt font size.

#### Scenario: 英文 Section 8 标签字号规范与标点防粘连
- **WHEN** formatting English Section 8 labels
- **THEN** label text SHALL have standard `sz="19"` (9.5pt) instead of 12pt
- **AND** joined sentences SHALL include safe spaces between periods/parentheses and subsequent words
- **AND** full sentences in descriptive cells SHALL end with terminal period `.`
- **AND** Section 9 labels SHALL maintain standard double space format (e.g. `9.1  Appearance:`).

### Requirement: Section 8 空手部防护行自动裁剪 (REQ-03)
The system SHALL automatically delete the generic Hand Protection row in Section 8 when no general overview statement exists, leaving only specific glove material rows.

#### Scenario: 消除手部防护通栏天窗
- **WHEN** Section 8 Hand Protection lacks a general descriptive summary
- **THEN** the engine SHALL call `deleteRow()` on the empty header row
- **AND** no blank placeholder cell SHALL remain rendered in the final document.

### Requirement: Section 14 危险品法定事实忠实还原 (REQ-04)
The system SHALL classify PU-2346A as Class 3 Flammable Liquid (UN 1866, RESIN SOLUTION / 树脂溶液, PG III) across both Chinese and English deliverables, eradicating false claims of non-dangerous goods and restoring structured 14.1~14.4 rows.

#### Scenario: Section 14 跨语言危险货物定性与结构对齐
- **WHEN** generating Section 14 for PU-2346A
- **THEN** English Section 14 SHALL declare UN 1866, RESIN SOLUTION, Class 3, PG III, and SHALL NOT claim "Not classified as dangerous goods"
- **AND** Chinese Section 14 SHALL maintain structured 14.1~14.4 rows without `3III否` string concatenation mangling.

### Requirement: Section 11 毒理与 Section 6.1 施救事实全量还原 (REQ-05)
The system SHALL preserve all measured toxicological endpoints for PU-2346A, separating oral, inhalation, and dermal data, keeping rat oral LD50 > 2000 mg/kg, ethanol LD50 = 10470 mg/kg, ethanol LC50 = 124.7 mg/L, and including ignition source avoidance in Section 6.1.

#### Scenario: 毒理学实测事实零丢失与零捏造
- **WHEN** generating Section 11 for PU-2346A
- **THEN** the engine SHALL output separated Oral, Inhalation, and Dermal endpoints
- **AND** it SHALL include ethanol LC50 (124.7 mg/L) and rat LD50 (> 2000 mg/kg)
- **AND** it SHALL NOT emit false "Inhalation: No data available" claims
- **AND** Section 6.1 SHALL explicitly contain instructions to keep away from ignition sources.

### Requirement: TDS 中和剂物料严格回锁三乙胺 (REQ-06)
The system SHALL strictly lock PU-2346A TDS neutralizer to Triethylamine (TEA, CAS: 121-44-8) and preserve pH range 7.0-10.0.

#### Scenario: TDS 中和剂防篡改与指标解耦
- **WHEN** compiling TDS deliverables for PU-2346A
- **THEN** the neutralizer field SHALL strictly read "三乙胺" / "Triethylamine (TEA, CAS: 121-44-8)"
- **AND** it SHALL NOT contain "二甲基乙醇胺" or "DMEA"
- **AND** pH value SHALL remain independently specified as 7.0-10.0.

### Requirement: 主协调亲自操刀与独立 Subagent 敌手终审 (REQ-07)
The system SHALL ensure division of responsibilities: parent agent directly modifies bottom-layer engine and execution scripts, while an independent Subagent executes full 16-section adversarial audit, requiring 153/153 pass rate and exit code 0.

#### Scenario: 产出物敌手执裁核销
- **WHEN** all deliverables are generated
- **THEN** a fresh independent Subagent SHALL execute the 153-item master audit
- **AND** the test runner SHALL return exit code 0
- **AND** all 15 forensic defects SHALL be verified as 100% resolved.
