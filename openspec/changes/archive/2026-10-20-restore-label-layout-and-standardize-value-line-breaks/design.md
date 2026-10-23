# Design: 恢复标签视觉分行排版与内容值多行语义换行规范设计

## Context

在先前的迭代中，由于对用户诉求“英文换行问题”产生了偏差，误将用户原本精心要求的“标签视觉分行排版”进行了平整化处理，破坏了标签原有的视觉分行规范；而真正关键的“中英文内容值（Value）换行不统一、英文值大量挤压在单行未做语义换行”的问题未得到解决。

用户明确指正：
1. 标签的视觉分行是用户显式要求的既定规范，必须立刻恢复；
2. 核心痛点在于**内容值（Value）换行**的统一规范化。

## Architecture Decisions

### 1. 彻底撤销标签平整化 (Remove Label Flattening)
- 从 `docx-engine.js` 与 `pipeline-engine.js` 中移除 `harmonizeTableLabels`；
- 对所有底模的标签单元格（Label Cell），不再做强制单段合并；
- 完整保留底模制作时既有的多段视觉分行（例如 `12.2 Persistence and\ndegradability：`、`5.3 Special hazards of\nsubstances or mixtures：`、`9.16 Auto-ignition\ntemperature：`）。

### 2. 建立中英文内容值（Value）语义分行统一标准 (Symmetrical Value Line Breaks)
在 `pipeline-engine.js` 的 `buildEnglishFacts` 中，为所有复合叙述章节注入与中文版 100% 对齐的语义换行符（`\n`）：
- **Section 5.3 (物质或混合物的特殊危害)**：
  - 中文：`燃烧时释放一氧化碳、二氧化碳、氮氧化物和少量的氰化氢。\n在着火或爆炸情况下，不要吸进烟尘。`
  - 英文：`Combustion may release carbon monoxide, carbon dioxide, nitrogen oxides and trace amounts of hydrogen cyanide.\nDo not breathe fumes/smoke in case of fire or explosion.`
- **Section 5.4 (消防预防措施和保护设备)**：
  - 中文：`消防人员必须佩戴自供气式呼吸器。\n禁止污染的灭火用水流入土壤，地下水或地表水中。`
  - 英文：`Firefighters must wear self-contained breathing apparatus.\nDo not allow contaminated fire-fighting water to enter soil, groundwater, or surface water.`
- **Section 6.1 (个人预防措施、应急程序)**：
  - 中文：`戴防护设备。\n确保充分的通风/排气。令未授权人员离开。`
  - 英文：`Wear protective equipment.\nEnsure adequate ventilation. Keep unauthorized persons away.`
- **Section 7.1 (安全操作防范)**：
  - 中文：
    `操作时遵守化学品的常见预防措施。避免与皮肤和眼睛接触。\n远离食物、饮料和烟草。休息以前和工作结束时洗手。将工作服单独存放。\n更换被污染或浸湿的衣物。`
  - 英文：
    `Observe common chemical precautions during handling. Avoid contact with skin and eyes.\nKeep away from food, drink and tobacco. Wash hands before breaks and at the end of workday. Store work clothing separately.\nChange contaminated or soaked clothing.`
- **Section 12.1 (生态毒性)**：
  - 中文：`该产品无可用的生态毒理学研究。\n禁止排入下水道，废水或土壤中。`
  - 英文：`No ecotoxicological studies are available for this product.\nDo not allow to enter drains, water courses or soil.`
- **Section 14.4 (用户特殊注意事项)**：
  - 中文：
    `非危险货物。\n温度不可高于+40℃，温度不可低于+5℃。\n远离食物、酸和碱。`
  - 英文：
    `Not regulated as dangerous goods.\nTemperature must not exceed +40℃ and must not fall below +5℃.\nKeep away from food, acids and bases.`
- **Section 2.1 / 2.2 / 2.3**：
  保持标准分行（分类名称与H代码分行、象形图与说明分行、预防措施与处置措施分行）。

### 3. 保留自适应通用页尾时间中枢
保持通过 `extractAdaptiveRevisionDate` 从源文档真实抽取日期（`2026/10/20`），并多模态注入 Footer。

## Verification Plan

1. 验证生成的英文 DOCX 中，标签单元格保持用户原本的视觉分行（例如 `12.2` 保持 2 个段落）；
2. 验证生成的英文 DOCX 中，Section 5.3、5.4、6.1、7.1、12.1、14.4 的内容值已具有规范的 `<w:br/>` 语义换行；
3. 验证页脚中依然保持自适应提取的真实日期 `2026/10/20`；
4. 运行 OpenSpec strict 校验并通过归档。
