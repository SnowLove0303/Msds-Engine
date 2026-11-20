# Spec: Context 2 至编辑器拓扑匹配编译器契约

## REQ-01: 拓扑对齐与安全索引编译
- `compileTopologyOps(context2, templateSchema, { language, presetKey })` SHALL 为全部 16 章节生成前置 `clearSectionValues` 操作。
- 对于 `2_COL_KV` 条目，编译器 SHALL 优先按 `seq`（如 `9.3`）与归一化中文/英文标签匹配模板行，缺失行自动 `insertRowAfter`，多余模板行按行号从大到小倒序 `deleteRow`。
- 对于 `1_COL_MERGED` 条目（含 S2、纯说明型 S11/S12/S13/S15），编译器 SHALL 对齐通栏合并单元格（`mergeCells` / `morphToFullWidth`）并剪枝多余空白端点行。
- 对于 `3_COL_TABLE`（S3 组分）与 `MULTI_COL_TABLE`（S8 OEL），编译器 SHALL 按记录数动态伸缩行数并逐列写入 `Col 0..N-1`。

## REQ-02: 零内容捏造与未知拓扑硬阻断
- 若 `context2.validation?.isValid !== true`，`compileTopologyOps` SHALL 立即抛出 `[TOPOLOGY_COMPILE_BLOCKED]` 错误。
- 若 `templateSchema` 缺失 `sections` 或缺失任一标准章节（1~16），`compileTopologyOps` SHALL 立即抛出 `[TOPOLOGY_MISMATCH]` 错误。
- 编译器 SHALL NOT 修改或捏造任何化学事实或翻译文本。

## REQ-03: MCP 工具注册与可读编译计划
- `mcp-server.js` SHALL 注册 `msds_compile_topology_ops`（输入 `context2JsonPath` 或 `sourceFilePath` + `templateKey` + 可选 `translationsJsonPath` / `presetKey` / `execute`）。
- `formatTopologyPlanMarkdown(compiled)` SHALL 输出紧凑的 16 章节动作汇总表（清零/增行/删行/合并/写入）。
