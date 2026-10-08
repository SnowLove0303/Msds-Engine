# Design: 逐标签值位置批注与 Agent 友好导出系统设计

## Context

参见 `proposal.md` 与《问题研究报告/匹配结果逐标签值位置批注与Agent友好导出开发方案.md》。当前 MSDS Studio 的抽取引擎 (`docx-engine.js`)、匹配引擎 (`smart-matching.js`) 和事实交接模块 (`msds-handoff.js`) 已经能生成结构化数据，但在面对人工审阅、差异定位与多 Agent 自动化协同（审阅、修复、二次质检）时，缺乏统一的细粒度锚点模型和标准化的审阅物导出协议。

## Goals / Non-Goals

**Goals:**
- 实现跨 16 个章节的 6 维稳定锚点定位系统（`section`、`row`、`cell`、`label`、`value`、`position`），对剪枝删行、序号重排具有强鲁棒性；
- 记录源事实、匹配决策、模板目标三方证据快照，支持内容变更自动检测与状态流转；
- 严格分离正式产品文档与审阅证据包：正式 DOCX 保持 100% 洁净，同时生成 Agent 机器友好的 `msds-review-bundle/v1`（包含 `annotations.ndjson`、`manifest.json` 等）；
- 实现严格的导出门禁规则（Blocker/Error 拦截，Warning 标记放行）；
- 提供匹配页（原始识别表、标准匹配表、原版式预览）与模板编辑器的全生命周期批注 UI。

**Non-Goals:**
- 不向正式 MSDS DOCX 中注入 Word Native Comment XML（`<w:comment>`）或行间标注文字；
- 不把 Excel 作为 Agent 的唯一事实来源（Excel 仅作为可选的人类辅助查看表）；
- 不引入重型后端数据库，前端及 Node 运行环境均基于标准 JSON/NDJSON 和内存会话。

## Decisions

### 1. 架构分层与新增模块 (Module Separation)
- **新增 `web/src/annotation-engine.js`**：
  - 核心类/函数：
    - `ReviewSessionManager`: 维护审阅会话生命周期、`reviewSessionId` 生成与状态追踪；
    - `AnchorResolver`: 负责锚点生成 (`createAnchor`)、指纹计算 (`computeRowFingerprint`, `computeCellFingerprint`)、锚点重索引 (`resolveAnchor`) 与漂移检测 (`detectAnchorDrift`)；
    - `AnnotationStateMachine`: 管理 8 种批注状态转换与变更时 `stale`/`orphaned` 自动标记；
    - `Gatekeeper`: 执行正式导出前阻断校验 (`checkExportGate`)；
    - `BundlePacker`: 导出 `manifest.json`、`annotations.ndjson`、`source-facts.ndjson`、`matching-slots.ndjson`、`section-summary.json`、`review-summary.md` 并打包。
- **对现有模块的最小侵入**：
  - `docx-engine.js`: 仅暴露必要的数据读取与原生干净导出，不改动 Word 生成内核；
  - `smart-matching.js`: 在 `matchedRows` 注入 `rowFingerprint` 与 `slotId`，配合 `msds-handoff.js` 构建事实快照；
  - `main.js`: 接入 `annotation-engine.js`，通过事件委托绑定数据属性 `data-anchor-*`，渲染批注徽标与抽屉。

### 2. 稳定指纹算法 (Row & Cell Fingerprint)
- **问题**：Section 2、9、10、11、12、15 经常发生整行物理剪枝或重新编号（如 2.1~2.3 连续排号），单纯依靠 `rowIndex` 会在删行后发生全局偏移。
- **决策**：
  - 行指纹采用复合哈希：`rowFingerprint = hash(sectionNumber + ':' + slotId + ':' + normalizedLabel + ':' + cellRoles.join(','))`；
  - 单元格指纹：`cellFingerprint = hash(rowFingerprint + ':' + cellRole + ':' + colIndex)`；
  - 重索引策略：当按 `rowIndex` 查找失效或内容不符时，优先回退到 `slotId` 与 `rowFingerprint` 匹配，精准恢复目标实体。

### 3. Agent 优先的 NDJSON/JSONL 导出规范 (NDJSON vs Excel)
- **决策**：将 `annotations.ndjson` 作为核心审阅证据：
  - 每行一个完整的 JSON 实体，包含 `annotationId`、`status`、`severity`、`expected`、`actual`、`anchor`、`sourceEvidence`、`matchEvidence`、`templateEvidence` 和 `snapshot`；
  - Agent 可按行流式消费、去重、过滤，直接提取 `slotId` 和 `expected` 执行自动化修补；
  - 配套 `manifest.json` 包含全局统计、文件哈希与门禁状态，作为 Agent 的导航入口。

### 4. 导出隔离与门禁机制 (Export Gating & Clean Isolation)
- **决策**：
  - 导出正式 DOCX 时，调用 `checkExportGate(reviewSession)`：
    - 若有未解决的 `blocker` 或 `error`，抛出或弹窗提示拦截，阻止产出带病文档；
    - 若仅有 `warning`，在 `manifest.json` 记录 `allowed_with_warnings`，允许生成正式 DOCX；
  - 正式 DOCX 直接由 `templateEngine.exportArrayBuffer()` 输出，绝不混入批注文字，确保交付物纯净合规。

## Risks / Trade-offs

- **[Risk 1: 内存状态与多页面切换丢失批注]**
  → **Mitigation**: 批注保存在当前的全局 `reviewSession` 中，在“导入模板编辑”及 Section 切换时完整传递，支持保存到浏览器 `localStorage` 或导出为 `.ndjson` 本地备份。
- **[Risk 2: DOM 渲染重绘导致批注弹窗失焦]**
  → **Mitigation**: 批注徽标采用声明式渲染，通过表格上的 `data-anchor-*` 属性委托挂载，重新渲染后根据 `annotation-engine` 内存数据瞬时恢复徽标状态。
- **[Risk 3: 大文档或多条批注下的导出性能]**
  → **Mitigation**: 纯前端利用 JSZip 和原生字符串流进行序列化，无网络往返，毫秒级完成审阅包生成。

## Migration Plan

1. 保持当前所有的导出接口 (`exportDocx`, `exportJson`) 100% 向后兼容；
2. 新增 `annotation-engine.js` 并接入 `smart-matching.js` 与 `main.js`；
3. 新增导出审阅包按钮（“导出正式 MSDS 与 Agent 审阅包”），与现有的“导出 DOCX”互不干扰。
