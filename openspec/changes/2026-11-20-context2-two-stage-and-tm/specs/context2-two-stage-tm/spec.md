# Spec: Context 2 先中后英双阶流程与翻译记忆库契约

## REQ-01: 先中后英双阶作业与 `<MODEL>_untranslated.json` 导出
- `buildStructuredContext2` SHALL 优先完成全 16 章节中文分类、格位定位、S1.1 CN 规范化与 S3→S2 迁移。
- 当 `untranslatedItems.length > 0` 时，`run_standard_production.mjs` 与 `msds_mcp_gateway.mjs` SHALL 在输出目录自动生成 `<MODEL>_untranslated.json`（以归一化中文原文为键、空字符串 `""` 为值，去重排序）。

## REQ-02: 持久化映射数据库 (`web/src/translation-memory.json`)
- `buildStructuredContext2` SHALL 自动加载 `web/src/translation-memory.json` 作为持久化翻译记忆库（优先级：本次 `--translations` > 记忆库 TM > 内置标准词典）。
- 当通过 `--translations` 回填且新译文不含中文、通过数字守恒校验时，`saveTranslationsToMemory(newTranslations)` SHALL 自动合并写入 `web/src/translation-memory.json`（按 key 排序持久化）。

## REQ-03: 数字/CAS 守恒与零中文残留门禁
- `buildStructuredContext2` SHALL 校验每条有效英文译文是否保留了对应中文原文中的核心数字串（含 CAS 号、百分比、温度数值、型号数字等，过滤掉纯章节序号前缀后比对）。
- 若存在数字丢失或中文残留，`validation.isValid` SHALL 为 `false`，并输出 `numericMismatches` 与 `untranslatedItems`。
