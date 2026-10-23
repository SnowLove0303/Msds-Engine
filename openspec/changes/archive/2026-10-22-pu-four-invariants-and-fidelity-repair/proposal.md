# Proposal

## Why

在对 `PU-202A` 进行标准八格式全量生产时，虽然调用了 MSDS Studio Agent API，但在比对用户亲手修改的权威基准文件（`PU-202A msds_CN 冠志.docx`）时，暴露出了 4 项未收敛的结构、格式与数据回退问题：
1. **Section 9.22 固体含量文本格式错位**：条件限定词 `（150℃，30min）` 移入左列标签后，缺少规范的 `<w:ind w:left="457" w:hanging="457"/>` 悬挂缩进和 `<w:tab w:pos="459"/>` 制表位，且序号与中文标签混在单一 Run 内，未按标准分离为 Times New Roman 10.5pt Bold 与 黑体 12pt Bold；
2. **Section 11.7 多列残留与 11.9 附加信息碎行/空格缺失**：11.7 残留底模复杂 3 列空单元格；11.9 附加信息被机械切分为多行无序号碎块，且 `replaceSequence` 编号补白算法将 `padLen` 设为 5，导致 `11.9` 仅分配到 1 个空格（`11.9 附加信息：`），破坏了 2 空格全局对齐律；
3. **Section 12 核心说明行被误杀**：源文件明确记载首行“该产品无可用的生态毒理学研究。”，但引擎在识别到组分具体端点后，激进地执行无差别清空 1-cell 行及硬编码 `deleteRow`，将合规说明行彻底误删；
4. **页尾修订日期跌落至写死假数据**：源文件页脚日期为 `2025-12-3`（应自适应格式化为 `2025/12/03`），但因 Word 底层将文本跨 `<w:t>` 节点截断，单节点正则解析失败后跌落至 `msds-api-controller.js` 中的 `2026/10/10` 默认假数据。

必须将这 4 项不变量正式立项为 OpenSpec 规格，并通过代码修改、VS Code Review、单元验证及 API 重跑彻底闭环。

## What Changes

- **Section 9 标签格式重构**：在写入 9.22 及带条件限定词的标签时，强制注入 `applyStandardHangingIndent(cell0, '457', '457', '459')`，并将序号与中文标签拆分为两个独立的 Run：序号为 Times New Roman 10.5pt Bold 加 `<w:tab/>`，标签为黑体 12pt Bold。
- **Section 11 结构收敛与对齐优化**：
  - 将 11.7 清除多余列，恢复为规范的两列结构；
  - 将分散的多段附加信息（饮酒、重复剂量经口、吸入）结构化合并为单条目 `11.9  附加信息：`；
  - 修正 `replaceSequence` 中第 11 章节的 `padLen` 为 6，确保 `11.9` 严格生成 2 个对齐空格。
- **Section 12 说明行保护机制**：
  - 改造 `smart-matching.js`：保护 Row 1 单格说明行，仅清除 Row 2 的过时组分引用题头；
  - 改造 `pipeline-engine.js`：废除硬编码的 `deleteRow(engine, s12, 1)` 误删行为，同步保护英文 Row 1 说明行。
- **页脚跨节点纯文本提取与假数据清零**：
  - 优化 `extractAdaptiveRevisionDate`：先剔除页脚 XML 标签纯化文本流后再正则提取；
  - 废除 `msds-api-controller.js` 中的 `2026/10/10` 假数据回退，确保自适应日期 `2025/12/03` 权威覆盖全部八格式。

## Capabilities

### New Capabilities

- `pu-four-invariants-and-fidelity-repair`: 涵盖 Section 9.22 双 Run 悬挂缩进排版、Section 11.7/11.9 两列与空格对齐、Section 12 说明行受控保护、以及页脚跨节点自适应提取四大约束。

## Impact

- 代码受管范围：`web/src/smart-matching.js`、`web/src/docx-engine.js`、`web/src/pipeline-engine.js`、`web/src/msds-api-controller.js`。
- 交付成果：重新调用 API 产出符合所有规格要求的 `PU-202A` 标准八格式交付物，并与用户手工基准严格对账。
