# Proposal: 模板拓扑对齐策略识别、执行与机械审计闭环

## 1. 背景与根因
在 `HPU-7651` 审计中暴露出：`Section 3` 组分表前几行（`S3R3`~`S3R5`）携带母版遗留的 `w:ind`（`left/right/hanging`），而克隆新增的第 3 条成分（`S3R6`）无缩进，导致整表虽均为 `jc="center"` 却视觉偏心；同时 `inspectTemplateSchema` 在识别模板拓扑时未提取对齐策略，`template-editor.js` 未清除居中单元格的 `w:ind`，`staged-mechanical-audit.js` 也未校验居中单元格的 `w:ind` 残留及 Section 8 控制参数物质表（OEL 多列表）的对齐策略。

## 2. 1:1 需求物理对账矩阵 (RTM)

| 需求编号 | 需求描述 | 纳入的扩展提案 | 对应规格与任务 |
| :--- | :--- | :--- | :--- |
| **RTM-01** | 底层模板拓扑识别（`inspectTemplateSchema`）提取并确认各行/单元格的对齐方式与对齐策略（`jc`、`vAlign`、`alignmentPolicy`）。 | **提案 B**：显式区分三类行角色对齐策略（多列数据表 / 2列键值行 / 通栏说明行）。 | `specs/alignment-topology/spec.md` / `T-01` |
| **RTM-02** | 拓扑装配、克隆增行与排版锁定（`formatSection3GridCenter`、`applyTopologyTypographyLock`）严格执行对齐策略，清除居中单元格残留 `w:ind`。 | **提案 A**：多列数据网格通用对齐契约（表头与第 1..N 行同轴居中且零缩进干扰）。 | `specs/alignment-topology/spec.md` / `T-02` |
| **RTM-03** | Section 8 控制参数物质表（OEL 多列表）统一适用对齐策略（表头与数据行居中、零 `w:ind`、`vAlign="center"`；说明行左对齐）。 | **提案 A** + **提案 B**。 | `specs/alignment-topology/spec.md` / `T-02` |
| **RTM-04** | 机械审计（`staged-mechanical-audit.js`）纳入对齐方式、居中零 `w:ind` 干扰及 Section 8 OEL 表对齐策略硬校验。 | **提案 C**：覆盖全交付矩阵（CN/EN × 冠志/国彩）。 | `specs/alignment-topology/spec.md` / `T-03`, `T-04` |
