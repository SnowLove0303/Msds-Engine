# Proposal: 底层统一语义槽位归属与全篇表格标签/值纯左对齐立法 (Systemic Slot Attribution & Global Left Alignment)

## Why

在多批次 MSDS 工业化产出及 BL-8129A 审计过程中，暴露出两类深植于底层的系统性架构缺陷：
1. **语义槽位物理归属倒置问题 (Semantic Slot Attribution)**：
   - 源文件表格中常存在“前序标签附属的空标签行”（如 Section 5 第 4 行无标签，文字为“在着火或爆炸情况下，不要吸进烟尘。”紧随第 3 行“物质或混合物的特殊危害”）。
   - 既有 `smart-matching.js` 采用孤立关键字强判，错误地将“不要吸进烟尘”强行归入 `protective_actions`（5.4 消防预防措施和保护设备），甚至主动正则抹除 `special_hazards`（5.3）中的烟尘警示，导致中英文产出物中 5.3 缺失核心安全事实、5.4 赘余。
   - 官方母版及化学化工常识法定明确：燃烧烟尘吸入危害属于 5.3 特殊危害，5.4 专职负责 SCBA 装备与灭火水环境防范。必须从底层机制上纠偏。
2. **表格标签与数值对齐混乱及英文两端对齐拉伸问题 (Table Labels & Values Global Left Alignment)**：
   - 官方母版由于历史排版，在部分单元格（如 Section 11 多行折叠槽位、Section 13）遗留了 `<w:jc w:val="both"/>` 或 `<w:jc w:val="center"/>`。
   - 既有排版函数（如 `formatSection11LabelCell`、`formatSection14LabelCell`、`applyStandardHangingIndent`）仅注入了悬挂缩进（`w:ind`）和间距，却未对段落级对齐属性 `w:jc` 进行清理和强制规范。
   - 这导致长英文标签（如 `11.4 Respiratory or skin sensitization:`）在渲染时触发两端对齐（`both`），单词之间被强行横向拉伸，词距极度失真；同时部分代码误将 Section 13 标签设为水平居中（`center`）。
   - 既有全篇排版校正及门禁（Gate 6）仅扫描了数值单元格（`c >= 1`），完全放任了第 0 列标签单元格（`c === 0`）。

必须从系统底层（底层匹配、底层几何排版、全篇文档巡检、出厂质量硬门禁）彻底统一处理，一劳永逸根除同类隐患。

## What Changes

1. **底层语义槽位归属与无标签续行归并 (Systemic Slot Attribution)**：
   - 修正 `smart-matching.js`：将“不要吸进烟尘/不要吸入烟尘/避免吸入烟尘/inhale smoke/breathe fumes”的词法槽位正确定位为 `special_hazards`（5.3），彻底废除在 `special_hazards` 中强制抹除烟尘语句的破坏性逻辑。
   - 统一规范未命名续行合并：当解析源文件多行表格时，紧随特定插槽后且标签为空的行，一律视为前序槽位的从属陈述，完整保留并合流至前序槽位。
   - 修正 `pipeline-engine.js`：5.3（`sec5.specific_hazards`）双语装配时，将燃烧产物与烟尘警示（“In case of fire or explosion, do not breathe fumes/smoke.”）作为不可分割的 5.3 事实链；5.4（`sec5.protective_equipment`）纯净收敛至 SCBA 及灭火水防护。
2. **全篇表格标签与数值绝对纯左对齐机制 (Global Left-Alignment Unification)**：
   - 改造 `applyStandardHangingIndent`（`docx-engine.js`）：在设置悬挂缩进的同时，自动确保 paragraph 属性中的 `w:jc` 具有 `w:val="left"`，坚决剔除任何 `both`、`distribute`、`center` 属性。
   - 改造 `formatSection11LabelCell` 与 `formatSection14LabelCell`：在创建/重置标签段落时，显式写入 `<w:jc w:val="left"/>`。
   - 修正 `enforceSection13DoubleCenter`：仅保留垂直对齐居中（`w:vAlign val="center"`），水平文字对齐 `w:jc` 严格采用 `left`，杜绝任何标签文字水平居中。
   - 扩展 `pipeline-engine.js` 全篇几何巡检（Step 12）：遍历全文档所有表格的所有单元格（覆盖 `c === 0` 与 `c >= 1`），统一强制 `w:jc w:val="left"`（除法定豁免的 CAS/浓度居中列及 CN Section 13 尾行方法长文本），同时保留既有悬挂缩进与制表位。
   - 升级 Gate 6 质量门禁：对全篇所有表格第 1 列标签单元格执行非左对齐零容忍硬阻断断言。
3. **BL-8129A 八格式交付与物理对账验收**：
   - 以修正后的底层流水线重新编译产出 BL-8129A 的 8 份标准交付物（4 DOCX + 4 PDF）。
   - 执行主审计套件（165 项门禁），验证退出码 0，并同步推送至 `E:\冠志\TDS MSDS (2)\待处理文件\BL-8129A\`。

## 1:1 需求物理对账矩阵 (RTM)

- `REQ-S5-CLASSIF-01`: 确认源文事实指纹，“在着火或爆炸情况下，不要吸进烟尘。”物理归属 5.3 物质或混合物的特殊危害，中英文 5.3 完整包含烟尘警示，5.4 纯净化。
- `REQ-LABEL-ALIGN-02`: 全局表格标签（Col 0）与数值（Col >= 1）统一纯左对齐（`left`），消除 11.4 `Respiratory or skin sensitization:` 两端对齐拉伸及 Section 13 居中对齐，保留悬挂缩进与序号间距。
- `REQ-PROD-SYNC-03`: BL-8129A 八格式交付物重新生成、两阶深度物理审计通过（退出码 0）与业务目录物理同步。
