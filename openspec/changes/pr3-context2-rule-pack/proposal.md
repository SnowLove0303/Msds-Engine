# Proposal: PR-3 Context 2 通用分类与可插拔 Rule Pack

## 背景与问题
当前 `web/src/context-governor.js` 在 Section 2、Section 8 等处硬编码了大量特定规范改写逻辑（如自动补全 `2.1 物质或混合物的分类`、`2.2 标签要素`、将 `2.0` 重排为 `2.1..2.4`、注入 `P2xx` 中文子标签、强制 `8.1/8.2` 顺序等），面对多样化源文件或不同行业/国际模板时，容易强行篡改原文结构。

## 目标
1. 新增 `web/src/rule-pack-registry.js`，定义可插拔的规范规则包（`CN_GB_MSDS_DEFAULT` 与 `PURE_SOURCE_PRESERVATION`）及基于通用结构特征的行分类器 `classifyLineByGenericFeatures`。
2. 在 `context-governor.js` 的 `buildStructuredContext2(context1, options)` 中支持 `options.rulePack` 与 `options.roleOverrides`，将硬编码改写收拢至规则包开关控制，默认保持对既有标品的向后兼容，切换为 `PURE_SOURCE_PRESERVATION` 时 100% 忠实保留原文层级与编号。
3. 支持按 `context1.sections` 实际章节动态治理，不再锁死 16 章节。
