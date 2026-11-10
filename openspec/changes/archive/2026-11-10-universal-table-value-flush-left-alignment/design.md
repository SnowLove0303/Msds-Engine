# 技术架构方案：全 16 章节多列表格值单元格纯净左对齐、通栏层级缩进与 Section 14 源文件主权动态重构

## 1. 架构因果拓扑与状态机

### 1.1 全局表格对齐拓扑分流状态机 (Universal Alignment Topology)

```mermaid
flowchart TD
    Row[读取当前表格行 tr] --> ColCheck{当前行单元格数量 cells.length > 1 ?}
    
    ColCheck -- 是: 多列表格 (Multi-Column) --> MultiCol[应用多列表格排版公理]
    MultiCol --> Col0[Column 0: 序号/标签列]
    Col0 --> Anchor[注入 9.1 黄金标尺 420 dxa 悬挂缩进 + <w:tab/> + 80.28pt 锚点]
    MultiCol --> Col1[Column >= 1: 独立值列]
    Col1 --> CleanIndent[彻底清除段落级 w:left 缩进与 w:leftChars]
    CleanIndent --> FlushLeft[纯净左对齐: 直接顶齐单元格左边距 (Flush Left)]

    ColCheck -- 否: 单列通栏 (Full-Width / Section 2) --> FullWidth[应用通栏层级缩进公理]
    FullWidth --> LabelP[标签段落: 基础左缩进 s2BaseIndent]
    FullWidth --> ValueP[值段落: 继承层级向右阶梯缩进 s2SubValueIndent]
```

### 1.2 Section 14 源文件主权动态构建引擎 (Section 14 Dynamic Reconstruction Engine)

```mermaid
flowchart TD
    SrcS14[解析源文件 Section 14 文本与结构] --> ModeCheck{是否包含联合国危化品要素 (UN No / 运输危险类别)?}
    
    ModeCheck -- 是: UN GHS 规范要素模式 --> GHSFlow[提取 7 大 UN GHS 事实要素]
    GHSFlow --> E1[14.1 联合国编号: 1866]
    GHSFlow --> E2[14.2 联合国运输名称: 树脂溶液 / RESIN SOLUTION]
    GHSFlow --> E3[14.3 运输危险类别: 3]
    GHSFlow --> E4[14.4 包装组: III]
    GHSFlow --> E5[14.5 环境危害: 否 / No]
    GHSFlow --> E6[14.6 用户特殊防范措施: 参见6-8节... / See sections 6-8...]
    GHSFlow --> E7[14.7 按MARPOL73/78公约附则II和IBC规则: 不适用 / Not applicable.]
    
    E1 & E2 & E3 & E4 & E5 & E6 & E7 --> BuildGHSTable[参考模板拓扑与写法构建 7 行标准表格]
    BuildGHSTable --> ApplyFormat[套用标准行几何: 2800 dxa / 6981 dxa, 420 dxa 悬挂 + 制表符, 纯净左对齐值]

    ModeCheck -- 否: 运输方式模式 (非危化品) --> ModeFlow[提取陆运 / 海运 / 空运事实]
    ModeFlow --> BuildModeTable[参考模板构建 4 行运输方式表格]
    BuildModeTable --> ApplyFormat
```

---

## 2. 核心技术改动要点

### 2.1 底层编辑器排版投射引擎 (`universal-editor-primitives.js`)
- **废除错误缩进分支**：
  彻底废除 `if (isSubLabelRow && cIdx === 1) { ind.setAttribute('w:left', '240'); }` 逻辑；
- **确立值单元格纯净左对齐**：
  遍历多列表格（`cells.length > 1`）中的值单元格（`cIdx >= 1`）：
  - 清理段落中所有多余的 `w:left` 与 `w:leftChars` 属性；
  - 确保段落直接贴齐单元格内左边距（Flush Left）；
  - 保障 `w:jc` 设置为 `left` 或 `both`。

### 2.2 通栏单列渲染引擎 (`docx-engine.js:renderFullWidthRow`)
- **不变性封印**：
  显式保护 Section 2 的 5 级缩进状态机与 `s2SubValueIndent`（840 dxa CN / 677 dxa EN），通栏内部的值段落保持阶梯缩进，主从分明。

### 2.3 Section 14 动态构建流水线引擎 (`pipeline-engine.js:buildDynamicSection14Table`)
- **彻底告别“削足适履”**：
  废除将 UN 编号、危险类别等危化品要素生硬拼装进底模既有“公路和铁路运输”、“海上运输”、“空运”标签的做法；
- **基于源文件事实的动态行重构**：
  1. 识别源文件承载的运输分类要素：
     - 若源文件包含 UN 编号、危险类别等 GHS 危化品要素，动态创建/对齐 7 行：
       - `14.1 联合国编号` / `14.1 UN number`
       - `14.2 联合国运输名称` / `14.2 UN proper shipping name`
       - `14.3 运输危险类别` / `14.3 Transport hazard class`
       - `14.4 包装组` / `14.4 Packing group`
       - `14.5 环境危害` / `14.5 Environmental hazards`
       - `14.6 用户特殊防范措施` / `14.6 Special precautions for user`
       - `14.7 按《MARPOL73/78》公约附则II和IBC规则` / `14.7 MARPOL 73/78 Annex II and IBC Code`
     - 若源文件为传统运输方式模式（陆/海/空），则参考模板构建运输方式行；
  2. 对重构后的每一行统一应用标准行几何：
     - 列宽：2800 dxa / 6981 dxa；
     - 标签单元格：`formatSection14LabelCell` 注入 `14.X` 序号、420 dxa 悬挂缩进 + `<w:tab/>` 黄金锚点，字阶 12pt 宋体粗体 / 9.5pt Arial 粗体；
     - 值单元格：写入源文件对应事实值，纯净左对齐（无段落左缩进），字阶 12pt 宋体 / 9.5pt Arial 常规。

### 2.4 中央主审计套件 (`run_master_msds_audit.mjs`)
- **Item 151 / 155 断言调整**：
  - Item 151（Section 14 结构审计）：核销 Section 14 具备源文件事实对应的规范行数与标准序号标签；
  - Item 155（全局对齐审计）：核销多列表格值单元格段落 `w:left` 为 0（纯净左对齐），同时核销 Section 2 通栏值保持层级阶梯缩进；
- **主审计套件 170/170 项全绿通过**，真实退出码 0。
