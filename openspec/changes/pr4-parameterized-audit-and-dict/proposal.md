# Proposal: PR-4 参数化机械审计与词库外置

## 背景与问题
1. `web/src/staged-mechanical-audit.js` 中的 `auditPhase1Context1` 与 `auditPhase2Context2` 写死了 `1..16` 章节检查，导致非 16 章节模板无法通过前置机械审计。
2. `web/src/context-governor.js` 内置了数百行硬编码 `CHEMICAL_TRANSLATION_DICT`，不利于词库独立维护与热更新。

## 目标
1. `auditPhase1Context1` 与 `auditPhase2Context2` 支持传入 `templateProfile`，按模板实际章节列表动态校验完备性与规范性（默认未传时保持 `1..16` 向后兼容）。
2. 将 `CHEMICAL_TRANSLATION_DICT` 外置为 `web/src/base-translation-dict.json`，`context-governor.js` 运行时加载并保持 `Object.freeze` 导出兼容。
