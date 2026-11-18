# Proposal: Hierarchical Label Semantics and Project Knowledge Base (hierarchical-label-semantics-and-knowledge-base)

## Why

在 MSDS-Engine 识别模块与 Context 1 生产的工程实践中，用户明确提出两项关键改进要求：
1. **建立专属项目开发知识库目录**：将数次实操中沉淀的 7 大表格语义分类（章节标题、序号标签、父级标签、子标签、值/数据值、说明行、数据值行）与 6 大词法边界法则（10字阈值、同行父级上下文、INV-PRUNE-01父级留空免剪枝白名单、引导语冒号解耦等）正式入库固化，杜绝后续迭代发生认知遗忘与规范漂移；
2. **将通用“标签”细化解耦为“父级标签”与“子标签”**：在 Context 1 表格中，原笼统的“标签”无法直观反映分类层级（如 Section 8 的 `手部防护：` 为统领下属多行规格的父级题头，而 `手套材料：` 为具体细分子属性；Section 1 的 `供应商信息：` 与 `供应商名称：`/`电话：` 亦然）。必须将 `标签` 精准细分为 `父级标签` 与 `子标签`，并在 `PA-3612_context1_recognition.md` 中完成全景重新审计与对齐。

## What Changes

本变更严格 1:1 承接 Step 0 Spec-Kit RTM 矩阵中的 3 项需求：
- **REQ-KB-1**：在 `docs/knowledge-base/` 目录下创建《MSDS 表格结构与语义层级定义规范手册》（`MSDS_TABLE_SEMANTICS_AND_LABEL_TAXONOMY.md`），详尽定义 7 大分类与 6 大词法边界判定公理；
- **REQ-TAG-2**：升级 `web/src/recognition-engine.js` 中的语义类型体系与判定算法：
  - 将 `SEMANTIC_TYPES.LABEL`（通用标签）升级为 `SEMANTIC_TYPES.PARENT_LABEL`（`父级标签`）与 `SEMANTIC_TYPES.CHILD_LABEL`（`子标签`）；
  - 注入父级标签识别逻辑：统领下属多行规格的分类题头（如 Section 8 的 `手部防护：`、`建议：`，Section 1 的 `供应商信息：` 等，以及值格为空且下方跟随子标签的统领行）归为 `父级标签`；
  - 注入子标签识别逻辑：具体细分属性（如 `手套材料：`、`中文名称：`、`电话：`、`GHS分类：` 等短标签）归为 `子标签`；
- **REQ-AUD-3**：重新全量运行原生 CLI 生成 `PA-3612_context1_recognition.md`，同步更新 brain 与 output 产物，并出具 1:1 双向物理核销清算表与审计对照报告。

## Capabilities

### New Capabilities
- `project-knowledge-base`: 在 `docs/knowledge-base/` 沉淀 MSDS 表格结构与语义分类法定手册。
- `hierarchical-label-semantics`: 区分并精准识别 `父级标签` 与 `子标签` 的层级关系。

### Modified Capabilities
- `source-recognition-engine`: `recognition-engine.js` 语义属性词汇库由 7 项升级为包含层级父子标签的精细分类体系。

## Impact
- `docs/knowledge-base/MSDS_TABLE_SEMANTICS_AND_LABEL_TAXONOMY.md`: 新建项目开发知识库手册；
- `web/src/recognition-engine.js`: 升级属性分类状态机；
- `output/PA-3612/PA-3612_context1_recognition.md` & brain 对应文件: 重新审计与属性对齐。
