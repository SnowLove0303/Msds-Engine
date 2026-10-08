# Proposal: 匹配结果逐标签、逐值、逐位置批注与 Agent 友好导出开发体系

## Why

在当前的 MSDS Studio 工作流中，虽然已实现高精度的智能匹配、段落级抽取与模板写入，但当遇到源文件存在歧义、匹配结果需要人工/Agent 复核、或需要记录审阅意见与修复依据时，系统缺乏标准化的细粒度批注与审计追溯能力：
1. 缺乏逐标签、逐值、逐单元格、逐行的统一稳定锚点体系，剪枝删行或重编号后无法重新定位；
2. 缺乏 Agent 可直接消费的机器友好结构化审阅包（当前仅有针对前端展示的内部状态），Agent 无法直接获取三方证据链（源事实、匹配理由、模板目标）；
3. 批注信息若直接混入正式文档会污染产品交付件，若仅保存在内存中则无法持久化与跨会话回放。

因此，亟需建立一套**稳定锚点驱动、数据模型分离、Agent 机器友好导出**的完整批注与审阅闭环体系。

## What Changes

- **新增统一锚点体系 (Multi-Layer Semantic Anchor System)**：
  - 支持 `section`、`row`、`cell`、`label`、`value`、`position` 六种锚点形态；
  - 建立基于 `sectionNumber` + `templateRecordId` + `rowFingerprint` + `slotId` + `cellRole` + `valueHash` 的抗剪枝/抗重编号稳定指纹定位机制；
  - 区分逻辑路径（主定位）与视口坐标（辅助定位）。
- **新增三方证据与快照数据模型 (Tripartite Evidence & Snapshots)**：
  - 记录 `sourceEvidence`（源事实、源定位、段落片段）；
  - 记录 `matchEvidence`（匹配键、slotId、匹配置信度与理由）；
  - 记录 `templateEvidence`（模板角色、编辑前占位值、合并签名）；
  - 记录 `snapshot`（源/模板/匹配哈希与当前值哈希，支持变化检测）。
- **新增状态机与严重程度门禁 (Review State Machine & Gatekeeping)**：
  - 状态：`open`、`acknowledged`、`in_progress`、`resolved`、`accepted`、`rejected`、`stale`、`orphaned`；
  - 严重等级：`blocker`、`error`、`warning`、`info`；
  - 导出守卫：存在未解决的 `blocker` 或 `error` 时禁止导出正式 MSDS，存在 `warning` 时记录并允许放行。
- **新增多面板批注与交互组件 (Tri-Panel Annotation UI)**：
  - 在原始识别表 (`source_table`)、标准匹配表 (`matched_table`)、原版式预览 (`source_preview`) 与模板编辑器中提供细粒度批注触发与徽标指示；
  - 右侧审阅抽屉与上下文面板，支持快速筛选、跳转与状态流转。
- **新增 Agent 友好审阅包规范导出 (msds-review-bundle/v1)**：
  - 导出正式干净的 `MODEL_MSDS_CN_冠志.docx`（严禁注入任何内部批注文字）；
  - 同步导出 `manifest.json`、`annotations.ndjson`（Agent 主消费格式）、`source-facts.ndjson`、`matching-slots.ndjson`、`section-summary.json` 与 `review-summary.md`；
  - 支持将审阅包打包并支持重载校验。

## Capabilities

### New Capabilities
- `annotation-anchor-and-agent-review`: 提供逐标签、逐值、逐位置多层级稳定锚点定位，三方证据快照，批注状态流转，正式 MSDS 与 Agent 专属审阅包 (`annotations.ndjson` + `manifest.json`) 分离导出及导出门禁能力。

### Modified Capabilities
<!-- 无现有 capability 契约变更 -->

## Impact

- **数据层**：新增 `web/src/annotation-engine.js`，实现审阅会话、锚点生成与解析、指纹计算、状态流转与序列化；
- **匹配与模型层**：在 `smart-matching.js` 与 `msds-handoff.js` 中补充暴露 `rowFingerprint`、`slotId`、`sourceLocator` 等可定位上下文；
- **渲染与交互层**：在 `web/src/main.js` 及各渲染表格中注入 `data-anchor-*` 属性，新增批注弹窗、状态徽标与审阅列表抽屉；
- **导出层**：新增审阅包生成与打包逻辑，保留 `exportDocx()` 的正式洁净性，增加 `exportReviewBundle()`；
- **测试套件**：新增针对锚点稳定性、剪枝抗性、状态流转、导出门禁及 NDJSON 格式规范的自动化测试套件。
