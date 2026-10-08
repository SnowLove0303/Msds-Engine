# Tasks: 智能匹配模板残留清零、零臆造规约与导入前审计门禁

## 1. 模板工作副本注入前全量清零协议实现 (Pre-Injection Clean Slate Implementation)

- [x] 1.1 在 `web/src/smart-matching.js` 中新增 `cleanSlateTemplateRecord(tRecord, sectionNumber, editorEngine)`：在执行匹配注入前，扫描除表头与固定标签外的所有值单元格（`valCell`），统一安全清空，消除模板内嵌示范文本。
- [x] 1.2 改造 Section 3 组分注入机制：清空模板中原有的“成分1/商业机密”、“成分2/7732-18-5”等示例行，依据源文档真实提取组分动态构建，若无提取组分则仅保留单行标准空值行，杜绝遗留假组分。
- [x] 1.3 改造 Section 11（毒理资料）与 Section 12（生态信息）注入逻辑：清除模板内嵌的“二乙二醇单丁醚”及其 LD50/LC50/OECD 301C 等历史试验数据，确保源文档未提供时对应单元格保持绝对干净。
- [x] 1.4 改造 `applyMatchResultToEditor`：将先清零后写入的协议贯通至 Section 1~16 全域，对于匹配状态为 `EMPTY` 的插槽保持干净清空，严禁旧模板数据残留。

## 2. 零臆造规约与来源事实绑定 (Zero-Hallucination Safeguards & Evidence Binding)

- [x] 2.1 改造 Section 15 法规归集逻辑：剔除无源事实支撑时自动硬编码 5 条国标的逻辑，仅在有确凿源法规证据时格式化聚合，无来源时标记为 `EMPTY` 并保持单元格清空。
- [x] 2.2 优化 Section 14 运输信息审慎级联：剔除无来源特殊注意事项的盲目臆造，只有源文档确有温控/避光说明时才提取填入。
- [x] 2.3 完善 `matchedRows` 溯源证据链字段：为所有注入槽位绑定 `sourceSnippet`、`sourceLocation` 与 `reason`，保证每一格输出皆有据可查。

## 3. 智能匹配工作台审计看板与导入阻断门禁 (Workbench Audit Gate & UI Enhancements)

- [x] 3.1 在 `web/src/main.js` 匹配顶部栏增加审计状态摘要（已匹配、已安全清空未提供、待复核冲突、未匹配源行）。
- [x] 3.2 实现导入编辑模块安全门禁拦截：当 `unmatchedFields > 0` 或 `reviewAmbiguousFields > 0` 时，拦截直接跳转，弹出复核提示浮层，由用户知悉确认后方可移交模板编辑器。

## 4. 真实样本端到端反向残留排查测试与验证 (Real-Sample End-to-End Regression)

- [x] 4.1 编写专用回归测试 `web/tests/test_template_residual_clearing.mjs`，加载真实样本文档（PU-1007、PU-1036、PA-3617）及官方模板：断言注入后模板中绝无“二乙二醇单丁醚”、“CAS: 112-34-5”、“成分1/商业机密”等模板残留字符。
- [x] 4.2 执行 `npm run test:smoke` 与 `npm run build`，确保生产打包通过且所有自动化测试全绿。
