# Spec Delta: annotation-anchor-and-agent-review

## Purpose

提供逐标签、逐值、逐位置多层级稳定锚点定位，三方证据快照，批注状态流转，正式 MSDS 与 Agent 专属审阅包 (annotations.ndjson + manifest.json) 分离导出及导出门禁能力。

## ADDED Requirements

### Requirement: Multi-Layer Semantic Anchor System
The system SHALL provide a multi-layer semantic anchor system across matching results, source recognition, and editor cells, covering `section`, `row`, `cell`, `label`, `value`, and `position` anchors, using `sectionNumber`, `slotId`, `rowFingerprint`, `cellRole`, and `valueHash` for pruning-resilient unique identification.
系统必须为匹配结果、源识别结果和模板编辑器提供多层级稳定锚点体系，覆盖 `section`、`row`、`cell`、`label`、`value` 和 `position` 六类形态，通过 `sectionNumber`、`slotId`、`rowFingerprint`、`cellRole` 和 `valueHash` 实现抗剪枝删行与抗重编号的唯一稳定标识。

#### Scenario: Anchor resolves correctly after row pruning and renumbering
- **WHEN** 某一章节（如 Section 2 或 Section 10）发生无值物理删行或序号连续重编号
- **THEN** 既有标签或值批注的锚点仍能通过 `slotId` 与 `rowFingerprint` 精准重新索引到目标实体，而不会因为物理 `rowIndex` 偏移而错位。

#### Scenario: Sublabel and multi-column cell anchoring in complex sections
- **WHEN** 用户在 Section 3（三列结构）或 Section 11（多列子标签）中对特定组分 CAS 单元格或毒理子标签进行批注
- **THEN** 锚点必须携带具体的 `cellRole`（如 `component_cas`、`sublabel`）及逻辑单元格索引，精确区分标签与值。

### Requirement: Tripartite Evidence and Snapshot Tracking
The system SHALL persist source evidence (`sourceEvidence`), match evidence (`matchEvidence`), template evidence (`templateEvidence`), and content snapshot signatures (`snapshot`) for every annotation.
每条批注记录必须持久化存储源事实证据 (`sourceEvidence`)、匹配证据 (`matchEvidence`)、模板证据 (`templateEvidence`) 以及快照签名 (`snapshot`)，以便 Agent 进行全链路事实还原与差异判定。

#### Scenario: Preserving complete evidence chain on annotation creation
- **WHEN** 针对某个匹配条目创建批注
- **THEN** 生成的批注实体中必须包含 source locator/text、match key/slotId/confidence、template role/placeholder 以及当前 label/value 的哈希快照。

#### Scenario: Content mutation triggers stale state detection
- **WHEN** 批注目标所在的值被编辑器或重新匹配更新导致 `valueHash` 不一致
- **THEN** 系统自动将批注状态标记为 `stale`，提示需要重新核验。

### Requirement: Review State Machine and Severity Gatekeeping
The system SHALL maintain an 8-state review lifecycle and 4 severity levels, and SHALL enforce gatekeeping before exporting official MSDS.
批注系统必须维护包含 8 种状态（`open`、`acknowledged`、`in_progress`、`resolved`、`accepted`、`rejected`、`stale`、`orphaned`）和 4 种严重程度（`blocker`、`error`、`warning`、`info`）的状态机，并在导出正式 MSDS 时执行严格的门禁检查。

#### Scenario: Export blocked when unresolved blockers or errors exist
- **WHEN** 当前审阅会话中存在状态为 `open`、`acknowledged` 或 `in_progress` 的 `blocker` 或 `error` 级别批注
- **THEN** 系统必须阻止正式 MSDS 导出并返回拦截原因与未解决批注列表。

#### Scenario: Export permitted with warnings recorded in manifest
- **WHEN** 当前仅存在 `warning` 或 `info` 级别批注且无未解决阻断项
- **THEN** 系统允许导出正式文档，同时在 `manifest.json` 中将 `exportStatus` 标记为 `allowed_with_warnings` 并如实记录统计项。

### Requirement: Tri-Panel Annotation Interface and Drawer
The system SHALL provide interactive annotation triggers, status badges, and a review drawer across `source_table`, `matched_table`, `source_preview`, and the template editor.
系统必须在原始识别表 (`source_table`)、标准匹配表 (`matched_table`)、源文件原版式预览 (`source_preview`) 及模板编辑器中提供交互式批注入口、状态徽标与右侧审阅抽屉。

#### Scenario: User opens annotation modal and sees contextual snapshot
- **WHEN** 用户点击任意标签、值或行上的批注操作
- **THEN** 弹窗自动预填充当前点击对象的面板属性、槽位标识、三方事实快照与期望/实际比对输入框。

#### Scenario: Review drawer filters and navigates to target element
- **WHEN** 用户在审阅抽屉中按章节、严重程度或状态进行筛选并点击某条批注
- **THEN** 界面高亮定位并平滑滚动到对应的表格单元格或预览位置。

### Requirement: Separation of Clean MSDS DOCX and Agent Review Bundle
The system SHALL separate clean official MSDS DOCX from review evidence, and SHALL generate an agent-friendly review bundle (`msds-review-bundle/v1`).
系统在导出时必须严格隔离正式交付物与审阅证据，确保正式 DOCX 中绝对不包含任何内部批注文字、测试标记或红框，并输出 Agent 专用的结构化审阅包。

#### Scenario: Generating official clean DOCX deliverable
- **WHEN** 触发正式 MSDS 导出
- **THEN** 导出的 DOCX 必须保持原模板样式、干净的产品标签与值，禁止插入任何审阅人、批注正文或调试信息。

#### Scenario: Generating msds-review-bundle/v1 package
- **WHEN** 触发审阅包导出
- **THEN** 导出的压缩包或目录体系必须包含 `manifest.json`、`annotations.ndjson`、`source-facts.ndjson`、`matching-slots.ndjson`、`section-summary.json`、`review-summary.md` 以及正式 `MODEL_MSDS_CN_冠志.docx`。

#### Scenario: Agent directly ingests annotations without browser context
- **WHEN** 外部 Agent 读取导出的 `annotations.ndjson`
- **THEN** Agent 无需依赖任何前端 UI 坐标或浏览器 DOM 即可独立根据 `anchor`、`expected`、`actual` 与 `sourceEvidence` 识别出全部问题位置并生成修复方案。
