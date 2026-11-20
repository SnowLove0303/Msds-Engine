# Spec: Context 2 全量逐句英译与标准化表格契约

## REQ-01: Context 2 全量逐句英译强制门禁
- `buildStructuredContext2(context1, { translations })` SHALL 接收可选的 Agent 逐句翻译映射（按 `S<sec>:R<row>` 或原文文本索引），优先应用 Agent 专业语义英译，再辅以 `STANDARD_LABEL_EN` / `translateChemicalTerm` 一致性校验。
- `buildStructuredContext2` SHALL 对所有英文输出槽位执行 CJK 字符扫描（`/[\u4e00-\u9fff]/`），输出 `validation.untranslatedCount`、`validation.untranslatedItems` 与 `validation.needsAgentTranslation`。
- WHEN `validation.untranslatedCount > 0`, `validation.isValid` SHALL 为 `false`，流程/门禁 MUST 阻断进入下游写盘并提示 Agent 对 `untranslatedItems` 逐句补译。

## REQ-02: 全 16 章节标准化表格与多行多列/合并结构
- Section 3（以及 Section 8 多列 OEL 等多列表）中的多行堆叠组分单元格（含 `\n` 的名称/CAS/浓度）SHALL 机械拆分为**一行一条记录**的独立 `COMPONENT_ROW`（3 列：`Col 0` 名称 | `Col 1` CAS | `Col 2` 浓度）。
- 每个标注项 SHALL 携带显式网格拓扑元数据 `placement`（`gridType`: `1_COL_MERGED` | `2_COL_KV` | `3_COL_TABLE` | `MULTI_COL_TABLE`，`colSpan`，`targetCols`）。
- `serializeContext2ToMarkdown` SHALL 按各节实际表格形态输出标准化 Markdown 表格（通栏合并行标明 `colSpan=2/全宽合并`，双列 KV 明确分列 `Col 0` 与 `Col 1`，多列表格独立成表），并补齐 `OEL_ROW` 渲染分支。
