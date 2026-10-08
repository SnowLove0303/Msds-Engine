# Tasks

## 1. 核心批注与锚点数据引擎

- [ ] 1.1 创建 `web/src/annotation-engine.js`，实现 `ReviewSessionManager`，支持会话创建、会话哈希计算与元数据持久化
- [ ] 1.2 实现 `AnchorResolver`，覆盖 6 种锚点形态（section、row、cell、label、value、position）及基于 slotId/cellRole 的抗剪枝 rowFingerprint 算法
- [ ] 1.3 实现三方证据快照链（sourceEvidence、matchEvidence、templateEvidence 与 contentHash）
- [ ] 1.4 实现批注状态机（8 种状态流转），以及当底层文本变更时的 stale/orphaned 自动判定逻辑

## 2. 导出门禁与 Agent 审阅包序列化

- [ ] 2.1 实现 `checkExportGate` 导出门禁逻辑，断言在存在未解决 blocker 或 error 时坚决阻止正式导出
- [ ] 2.2 实现 `BundlePacker`，按照 `msds-review-bundle/v1` 规范生成 `manifest.json`、`annotations.ndjson`、`source-facts.ndjson`、`matching-slots.ndjson`、`section-summary.json` 和 `review-summary.md`
- [ ] 2.3 保证导出的正式 DOCX 100% 洁净（无内部批注文字/调试标记），并支持与审阅包统一打包

## 3. 前端交互与工作台集成

- [ ] 3.1 在原始识别表、标准匹配表、原版式预览及模板编辑器中渲染 `data-anchor-*` 语义属性
- [ ] 3.2 增加细粒度批注交互弹窗与批注状态徽标展示（支持多面板 source_table / matched_table / source_preview）
- [ ] 3.3 增加右侧审阅抽屉组件，支持按章节、状态、严重程度筛选及点击跳转精确定位
- [ ] 3.4 集成工作台操作栏：支持将批注带入模板编辑器，并支持触发“导出正式 MSDS 及 Agent 审阅包”

## 4. 自动化测试套件与回归验收

- [ ] 4.1 编写 `web/tests/test_annotation_anchor_system.mjs`，断言全 16 章节锚点生成、抗删行重索引、三方证据链与状态机流转 100% 通过
- [ ] 4.2 验证导出门禁拦截能力，以及 Agent 直接消费 `annotations.ndjson` 时的零 UI 坐标依赖问题定位
- [ ] 4.3 验证导出 DOCX 重载无批注文字污染，并全量运行已有回归套件（`test_pu_series_standard_parity.mjs`、`smoke.mjs`、`npm run build`）确保零回归
