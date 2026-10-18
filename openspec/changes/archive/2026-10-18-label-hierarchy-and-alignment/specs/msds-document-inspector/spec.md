# Spec Delta

## Purpose

规范 MSDS 结构化识别表格中的标签排版系统，保障标签字号标准一致、全量还原段落序号，并建立父级标签与子级标签的分级垂直对齐机制及业务特例规则。

## ADDED Requirements

### Requirement: Standardized label role typography

The system SHALL derive label typography strictly from body section tables (`word/document.xml`), ignoring header, footer, and oversized cover title formatting. Body table labels SHALL use the standard 12pt (24 halfPoints) bold typography (宋体 for CN, Times New Roman for EN) and SHALL NOT be contaminated by smaller header/footer font sizes or non-standard fonts.

#### Scenario: Body label font size compliance
- **WHEN** a document with 9pt header text and 12pt body text is parsed
- **THEN** structured table labels render with 12pt bold font rather than the smaller header font

#### Scenario: Isolate header and footer styles
- **WHEN** a DOCX package contains header/footer tables preceding body tables
- **THEN** role style derivation skips header/footer records and establishes label/value styles solely from body records

### Requirement: Robust sequence recovery and zero-loss rendering

The system SHALL detect, normalize, and render all section item numbering prefixes—including direct text runs (`1.1`, `1.2`, `1.`, `1、`) and Word automatic multi-level lists from `w:numPr` and `numbering.xml`. The rendering system MUST NOT strip text runs when no prefix is matched and MUST display the recognized sequence prefix ahead of the label text.

#### Scenario: Multi-level text sequence rendering
- **WHEN** a cell starts with `1.1  产品名称：`
- **THEN** the sequence `1.1` is rendered in the sequence prefix slot and the label `产品名称：` follows without text loss

#### Scenario: Automatic numbering list recovery
- **WHEN** a cell's sequence is defined only in Word `w:numPr` and `numbering.xml`
- **THEN** the resolved sequence number is prepended to the rendered label and no characters from the body run are dropped

### Requirement: Parent and child label classification

The system SHALL classify first-column labels into distinct structural tiers:
1. **Parent Label (父级标签)**: Any label possessing a valid section-level or sub-item sequence number (`1.1`, `8.1`, `9.1`, etc.).
2. **Parent Label Exception (特例父级标签)**: Section 8's `建议：` / `Recommendation:` SHALL be classified as a Parent Label despite having no sequence number.
3. **Child Label (子级标签)**: Any unsequenced sub-attribute label (such as `中文名称：`, `供应商名称：`, `呼吸系统防护：`, `手部防护：`, `眼睛防护：`, `身体防护：`).

#### Scenario: Classify sequenced label as parent
- **WHEN** parsing `1.1  产品名称：` or `8.1  暴露控制：`
- **THEN** the system marks the cell/paragraph role as a Parent Label

#### Scenario: Classify unsequenced sub-attribute as child
- **WHEN** parsing `中文名称：` or `手部防护：`
- **THEN** the system marks the cell/paragraph role as a Child Label

#### Scenario: Classify Section 8 recommendation as parent exception
- **WHEN** parsing Section 8 row `建议：` or `Recommendation:`
- **THEN** the system classifies it as a Parent Label rather than a Child Label

### Requirement: Separate vertical alignment baselines

The structured table layout SHALL enforce dual vertical alignment baselines for first-column labels:
1. **Parent Alignment**: All Parent Labels (and the Section 8 `建议` exception) SHALL vertically align along the primary left baseline (0 indent).
2. **Child Alignment**: All Child Labels SHALL vertically align along a secondary indented baseline, ensuring all child labels in the same section align flush with each other.

#### Scenario: Parent labels align flush along left edge
- **WHEN** rendering Section 1 rows `1.1  产品名称：`, `1.2  使用建议：`, `1.3  供应商信息：`
- **THEN** their left text edges align along the same vertical line

#### Scenario: Child labels align flush along secondary indent
- **WHEN** rendering Section 1 rows `中文名称：`, `供应商名称：`, `电话：`
- **THEN** their left text edges align along a uniform secondary indented vertical line

#### Scenario: Section 8 recommendation aligns with parent baseline
- **WHEN** rendering Section 8 row `建议：`
- **THEN** its text aligns with `8.1  暴露控制：` and `8.2  工程控制：` on the primary parent baseline, without child indentation
