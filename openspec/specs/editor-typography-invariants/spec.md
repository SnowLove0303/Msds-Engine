# editor-typography-invariants Specification

## Purpose
TBD - created by archiving change global-editor-topology-typography-governance. Update Purpose after archive.

## Requirements

### Requirement: REQ-TOPO-01 页眉与页脚设计令牌契约 (Header & Footer Typography Contract)
The system SHALL strictly enforce unified design tokens on Header and Footer XML nodes: header titles and page numbers SHALL be 9pt (`sz="18"`) Regular, model codes SHALL be 9pt Bold, and company names SHALL be 9pt Regular left-aligned (`w:jc w:val="left"`).

#### Scenario: 中英文页眉页脚标准化渲染
- **WHEN** exporting CN or EN MSDS documents;
- **THEN** header model code MUST be 9pt Bold, and footer company name MUST be 9pt Regular left-aligned.

### Requirement: REQ-TOPO-02 16 章节大标题设计令牌契约 (Section Header Typography Contract)
The editor topology SHALL enforce standard Section Header typography across Row 0 of all 16 tables: CN MUST be Simsun 12pt (`sz="24"`) Bold, and EN MUST be Arial 11pt (`sz="22"`) Bold.

#### Scenario: 16 章节大标题均一性投影
- **WHEN** projecting table typography across all 16 sections;
- **THEN** Row 0 Section Header MUST be 12pt Simsun Bold in CN and 11pt Arial Bold in EN.

### Requirement: REQ-TOPO-03 全局序号设计令牌与悬挂缩进契约 (Sequence Number Topology Contract)
When Column 0 contains sequence numbers, the system SHALL enforce standard hanging indents (420 dxa for Tier A, 560 dxa for Tier B), and the sequence number run followed by `<w:tab/>` SHALL be Arial 9.5pt (`sz="19"`) Bold in EN and Times New Roman 10.5pt (`sz="21"`) or 9.5pt (`sz="19"`) Bold in CN; the system MUST NOT downgrade EN sequence numbers to 18 or 15.

#### Scenario: 英文全章节序号 9.5pt 恒定
- **WHEN** rendering or projecting EN Column 0 paragraphs with sequence numbers;
- **THEN** sequence number runs MUST be 9.5pt (`sz="19"` and `szCs="19"`) Bold followed by `<w:tab/>`.

### Requirement: REQ-TOPO-04 全局标签设计令牌契约 (Label Typography Contract)
Column 0 label text SHALL be strictly governed by design tokens: CN MUST be Simsun 12pt (`sz="24"`) Bold with full-width colon, EN MUST be Arial 9.5pt (`sz="19"`) Bold with half-width colon; the system MUST NOT enlarge Section 8 labels to 24.

#### Scenario: 中英文标签设计令牌强制应用
- **WHEN** formatting Column 0 labels;
- **THEN** CN labels MUST be 12pt Simsun Bold and EN labels MUST be 9.5pt Arial Bold.

### Requirement: REQ-TOPO-05 全局填写值设计令牌与常规体二元分离契约 (Table Value Typography Contract)
All value cells in columns c >= 1 and single-cell description rows SHALL be flush-left aligned; CN values MUST be Simsun 12pt (`sz="24"`) Regular, EN values MUST be Arial 9.5pt (`sz="19"`) Regular; unauthorized bolding MUST be stripped.

#### Scenario: 跨章节填写值字阶与常规体零方差
- **WHEN** traversing table value cells;
- **THEN** EN values MUST be 9.5pt Arial Regular and CN values MUST be 12pt Simsun Regular without bolding.

### Requirement: REQ-TOPO-06 复合通栏行原生拓扑解耦契约 (Composite Full-Width Decoupling Contract)
In composite full-width rows (Section 2, 11, 15), when label and value are in the same line, the editor SHALL decouple them natively into a Bold label run and a Regular value run.

#### Scenario: 通栏行标签加粗与值常规体隔离
- **WHEN** projecting composite full-width paragraphs;
- **THEN** structural labels MUST be Bold runs and following values MUST be Regular runs.
