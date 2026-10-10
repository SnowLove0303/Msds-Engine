# Capability Spec: Section 9 源实证存在性门控规约 (section9-source-grounded-pruning)

## 1. 业务定义与背景

本规范正式收敛并终局确立 **Section 9（物理和化学特性）** 在智能匹配与模板安全覆写过程中的去留判定标准：
- **核心原则**：以**源文件内容为主（Source-Grounded First）**；
- **保留铁律**：凡源文件中明确列出或提及的理化特性条目，即使其数值为“无数据资料”、“未测定”、“—”或“无资料”，**必须 100% 给予保留**，并在对应值单元格中规范填充法定合规用语 `无数据资料。`；
- **剪枝铁律**：凡模板中预置但源文件通篇**完全未提及**的理化特性条目，**严禁保留**，必须判定为 `PRUNED` 并执行物理整行安全删除（`deleteRow`）；
- **重排铁律**：所有剪枝删行完成后，必须联动执行节内自增连续重排（`renumberRecord`），使保留行从 `9.1` 起连续递增，绝不允许出现断号或孤儿空白标签。

---

## 2. 行为要求与算法契约 (Requirements & Contracts)

### Requirement 1: 源实证提及状态判定 (Source Mention Detection)
系统在第一遍（Pass 1）解析源文档 Section 9 时，必须通过加粗标签、冒号语法及别名映射，准确构建当前文档的源实证槽位集合 `source_mentioned_slots`。
- **正向匹配条件**：只要源文档某一行匹配到 `SECTION_SLOT_REGISTRY` 中定义的名词或其别名（如“pH值”、“沸点”、“闪点”、“气味”、“外观”），该 slot 即被加入 `source_mentioned_slots`；
- **实质否定与未测识别**：
  - 若源文本为 `无数据资料`、`未测`、`暂无资料`、`无适用资料`、`未测定`、`—`、`None`、`Not determined` 等，该槽位依然判定为 `mentioned = true`，其抽取值被标记为 `EXPLICIT_MISSING`。

### Requirement 2: 模板插槽去留决策 (Template Row Decision)
在将识别事实应用到模板编辑器（`applyMatchResultToEditor` / `smart-matching`）时：
- **分支 A（源有提及且有具体值）**：
  - 写入源数值（含单位与度量衡）；
  - 若源文本中包含受控测定条件（如 `1%水溶液`、`25℃`），遵循受控标签追加协议将条件追加在标签冒号前，并补偿 5 宽对齐空格。
- **分支 B（源有提及但声明未测）**：
  - **保留模板物理行**；
  - 标签保持官方母版原生加粗形态；
  - 值单元格写入标准 12pt（小四）非加粗宋体（中文版）或 Times New Roman（英文版）文案：`无数据资料。`（中文）/ `No data available.`（英文）。
- **分支 C（模板有但源完全无提及）**：
  - 判定该行为 `PRUNED`；
  - 收集该模板物理行的索引 `rowIndex`，在注入第二遍（Pass 2）阶段自底向上调用 `docx-engine.deleteRow(tableIndex, rowIndex)` 执行物理删除；
  - 终面成品中严禁残留该无源条目的加粗标签与空白单元格。

### Requirement 3: 连贯连续重排 (Post-Omission Renumbering)
所有 `PRUNED` 行被物理删除后：
- 必须针对 Section 9 对应表格触发 `docx-engine.renumberRecord(tableIndex, 9)`；
- 检查存活行的第一列或首个段落序号，强制格式化为 `9.1  `、`9.2  `... 并保持 5 个半角空格的等宽对齐基线；
- 严格保护 Row 0 章节题头（`9. 物理和化学特性`），禁止将题头误改为 `9.1`。

---

## 3. 验收标准 (Acceptance Criteria)

1. **情景 1：半测定半未测源文件**
   - 源文件列出了 12 项理化特性，其中 9 项有实际温度/数值，3 项明确写着“未测定”；其余 12 项模板预设参数未在源文档出现；
   - **验收断言**：导出 DOCX 中 Section 9 总行数必须精确为 13 行（1 行题头 + 12 行数据行）；3 项未测定项目均在表格中保留且文字显示为“无数据资料。”；其余 12 项被彻底删净；序号从 `9.1` 连续排列至 `9.12`，无断号。
2. **情景 2：全量 24 项理化特性源文件**
   - 源文件对 24 项法定参数均有详细记录；
   - **验收断言**：Section 9 保留全部 24 行数据行，无任何行被删除，序号保持 `9.1` 至 `9.24`。
3. **情景 3：终审审计器（Audit Engine）门禁**
   - 导出的 DOCX 必须通过 `auditSequenceContinuity`，断号数断言为 0；
   - 必须通过 `auditGhostResidual`，杜绝模板示例残留；
   - 必须通过 `auditBoldInvariance`，加粗标签未被破坏。
