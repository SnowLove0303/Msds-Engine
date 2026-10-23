# Proposal

## Why

在八格式（4 DOCX + 4 PDF）MSDS 标准化交付体系中，英文产出物（EN 冠志 / EN 国彩）直接面向外贸及国际化工合规监管。然而，在现有产出流程中，英文底模存在大量历史残留与结构错位：
1. 页眉页脚未调用底层 XML 物理覆写，残留中文公司抬头与占位型号（`PEA-4139-MSDS`）；
2. Section 2 模板留有 16 行，多余 10 行存在占位字母（`G~Q`）；
3. Section 5 灭火剂逻辑判定倒置导致 5.2 填入适用灭火剂；
4. Section 8 残留无关异氰酸酯（HDI）控制参数底模表格；
5. Section 9 固含因单复数正则脱靶导致漏填；
6. Section 11、12、14、15、16 存在大面积中文未翻译文本、无关物质（DMAc、二乙二醇单丁醚）残留及占位字符（`AA, BB, CC`）。

必须在 OpenSpec 体系下确立英文 16 个 Section 的权威规范，消除全部底模残留、占位符与中文残留，保障双语 100% 语义对齐与合规交付。

## What Changes

- **页眉页脚底层物理重写**: 强制在英文 DOCX 构建管道中调用 `updateHeaderFooterData`，对 `word/header1.xml`、`word/footer1.xml` 及 `document.xml` 实施物理覆盖，确保品名、型号、英文主体名称与版本日期正确同步。
- **Section 2 结构剪枝与无空行对齐**: 将 16 行底模动态剪枝为 5 行标准结构（2.1 分类、2.2 标签要素、2.3 防范说明、2.4 其他危害），彻底清除 `G~Q` 占位字母。
- **Section 5 灭火剂优先级判定修正**: 修正灭火剂正则匹配顺序，优先匹配 `Unsuitable`，确保 5.2 严格填入 `High-volume water jet.`。
- **Section 8 物理剪枝与无害化**: 物理删除第 12 行起的无关工作场所限值底模表格（HDI/PMA），标准收敛至 12 行。
- **Section 9 物理特性全英文化与固含修正**: 正则兼容 `/Solid(?:s)?\s*content/i`，精准填入 `53±2%` / `52±2%`，所有“无数据”替换为 `No data available.`。
- **Section 11 毒理学基准收敛**: 彻底清除二乙二醇单丁醚、DMAc 中文测试数据及 `AA, BB, CC` 占位符，对齐基准收敛为 2 行金标结构。
- **Section 12 生态学基准收敛**: 删除底模冗余中文通则导语，收敛至标准 4 行（12.1 生态毒性、12.2 持久性、12.3 其他危害）纯英文化。
- **Section 13~16 国际化规范覆写**: 严格遵循 Section 13 3 行金标，Section 14 覆盖海运 `Maritime transport`，Section 15 全量填入官方英文标准法规名，Section 16 填入英文标准免责声明。

## Capabilities

### New Capabilities
- `english-sixteen-sections-standardization`: 规范化英文 MSDS 16 个 Section 的术语标准、槽位映射、结构剪枝与零中文/零占位符审计门禁。

### Modified Capabilities
- `section-slot-routing-and-label-protection`: 扩展英文 Section 2、8、11、12、13 的剪枝收敛与槽位保护约束。

## Impact
- 受影响模块：`web/generate_eight_deliverables.mjs`、`web/src/docx-engine.js`、`web/src/smart-matching.js`。
- 受影响文件：`算法训练材料/EP-1702/` 与 `算法训练材料/EP-1704/` 下的 4 份英文 DOCX 与 4 份英文 PDF。
- 系统无外部依赖破坏性变更，与现有中文匹配引擎完全兼容。
