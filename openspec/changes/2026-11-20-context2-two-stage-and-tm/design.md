# Design: Context 2 先中后英双阶流程与翻译记忆库架构

## 1. 翻译解析优先级
`resolveEn(cnText, fallbackEn, keyHint)`:
1. `options.translations`（Agent 本次传入的 `--translations`）
2. `translation-memory.json`（持久化映射数据库，归一化 `\r\n` -> `\n` 后精确匹配）
3. 内置 `STANDARD_LABEL_EN` / `STANDARD_SECTION_TITLE_EN` / `translateLineEn` / `translateChemicalTerm`

## 2. 先中文、后英文双阶执行流
1. **Stage 3A (中文治理 + 导出待译模板)**：运行 `run_standard_production.mjs`（或 `msds_mcp_gateway.mjs --tool=msds_govern_context2`），产出中文结构完整的 `<MODEL>_context2.md`；若 `untranslatedCount > 0`，同步写出 `<MODEL>_untranslated.json`。
2. **Stage 3B (Agent 逐句翻译 + 记忆库沉淀)**：Agent 填充 `<MODEL>_untranslated.json` 中所有 `""` 值并回传 `--translations=<MODEL>_untranslated.json`，引擎校验 `untranslatedCount === 0` 且数字守恒通过后，自动沉淀写入 `web/src/translation-memory.json`。
