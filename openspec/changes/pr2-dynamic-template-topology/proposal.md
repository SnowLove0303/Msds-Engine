# Proposal: PR-2 模板动态认知与能力驱动匹配 (Dynamic Template Topology)

## 背景与问题
当前 `web/src/template-topology-recognizer.js` 与 `web/src/topology-matcher.js` 中存在硬编码的 `1..16` 章节循环、`tblNodes.length === 16` 假设以及基于特定章节号（`if (s === 2)`）的编译分发，导致接入非 16 章节或不同拓扑结构的自定义模板时直接报错 `[TOPOLOGY_MISMATCH]`。

## 目标
1. 在 `template-topology-recognizer.js` 中实现动态 Section 发现（不写死 `1..16`），识别每个 Section 的 `layoutType`（`FULL_WIDTH_OUTLINE` / `KV_TWO_COL` / `MULTI_COL_GRID` / `HYBRID`）与 `capabilities`，并导出可移植的 `Template Profile`（`buildTemplateProfile`）。
2. 在 `topology-matcher.js` 中移除 `1..16` 硬编码循环，支持从 `templateSchema.sections`（对象或数组）动态迭代，并基于 `layoutType` 能力驱动分发通栏大纲与多列网格编译策略。
3. 保持对既有 16 章节官方母版的 100% 向后兼容。
