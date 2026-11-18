# Proposal: 优化 MSDS 源文件识别模块与 Context 1 语义属性立法 (optimize-msds-source-recognition)

## 一、背景与动机 (Background & Context)
当前 MSDS 生产管线在阶段 1 与阶段 2 的执行过程中存在两大约束短板：
1. **执行碎片化与临时脚本冗余**：识别与提取缺乏一体化、确定性的秒级直接入口，在排查与转换时编写了多个临时诊断脚本，导致执行速度被动拉长；
2. **Context 1 语义归类粗糙与属性混淆**：既有识别器未对抽取内容打上明确的语义属性标签，且在单列通栏、提示说明行及无冒号行中，存在将说明行或具体参数值误归类为“标签”的系统性缺陷，无法满足下游 Context 2 治理的高精度事实对账需求。

为此，本变更在通用识别模块中固化统一的原生执行入口，引入多维特征分类器（加粗、冒号、序号、跨列、句式），并为 Context 1 报告全面注入规范化“属性列”（`章节标题`、`序号标签`、`标签`、`数据值`、`说明行`、`表头`）。

---

## 二、1:1 需求物理对账矩阵 (Spec-Kit RTM Ingestion)

本提案严格 1:1 注入 Step 0 门禁 1 中锁定的 4 项全量需求，条目数量与指纹严格守恒：

| 需求编号 | 需求名称与内容 | 关联 OpenSpec 契约 | 验收标准索引 |
| :---: | :--- | :--- | :--- |
| **REQ-1** | 识别流程极速固化与零临时脚本契约 | `specs/source-recognition-governance/spec.md#req-1` | `tasks.md#task-1` |
| **REQ-2** | Context 1 识别结果补属性列，明确标明语义类型 | `specs/source-recognition-governance/spec.md#req-2` | `tasks.md#task-2` |
| **REQ-3** | 仔细遍历源文件，杜绝将值或说明行误归类为标签 | `specs/source-recognition-governance/spec.md#req-3` | `tasks.md#task-3` |
| **REQ-4** | 结构排版符合规范，层次一目了然，杜绝过多口水说明 | `specs/source-recognition-governance/spec.md#req-4` | `tasks.md#task-4` |

---

## 三、影响面与爆炸半径控制 (Blast Radius)
- **直接受影响模块**：
  - `web/src/recognition-engine.js`：增强行/格语义分类器，支持 `semanticType` 输出；内置 `serializeFactsToMarkdown`。
  - `web/scripts/run_source_recognition.mjs`：提供固化的原生 CLI 运行入口。
  - `web/src/mcp-server.js`：`msds_recognize_source` 扩展支持 Markdown 序列化与属性透出。
- **绝对不触碰范围 (保持现状)**：
  - `web/src/docx-engine.js` 底层 DOM 核心解析与保存逻辑；
  - `web/src/template-editor.js` 与 `web/src/universal-editor-primitives.js` 中的不可变设计令牌封印；
  - 官方底模 `web/public/templates/*.docx`；
  - 其他型号的既有生产产出物。
