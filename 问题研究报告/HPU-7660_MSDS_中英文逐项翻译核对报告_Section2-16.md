# HPU-7660 MSDS 中英文逐项翻译核对报告

> **核对范围**：Section 2–Section 16（不包含 Section 1）  
> **中文依据**：`HPU-7660 msds_CN 冠志.pdf`，8 页  
> **英文依据**：`HPU-7660 msds_EN Guanzhi.pdf`，8 页  
> **产品型号**：HPU-7660  
> **文件版本**：V1.0  
> **两版修订日期**：2026/11/16  
> **核对方式**：按编号、子项及语义行逐条比较；跨页内容按完整句子合并判断。  
> **核对目标**：判断英文是否完整、准确表达中文原文；不独立认证安全分类、试验数据或法规适用性。

## 一、结论摘要

英文版 Section 2–16 的整体结构、技术数值、CAS 编号、OECD 测试方法、运输方式及绝大多数安全说明与中文版基本一致。**最明确的重要漏译位于 Section 9.3：英文缺少 pH 测量时“按 1:10 的比例用水稀释”的条件**。另外，Section 9.11 的指标名称与单位之间存在需要核实的技术表达问题，Section 8.2 两版法规编号后缀不同，Section 3.2 的化学名称应规范化。其他问题多属于轻微增译、范围变化或专业术语差异。

### 需优先处理的问题清单

| 编号 | 位置 | 中文依据 | 英文现状 | 问题 | 建议 | 优先级 |
|---|---|---|---|---|---|---|
| P01 | 9.3 | pH 值：7–9（按 1:10 的比例用水稀释） | `pH value: 7-9` | **遗漏测试条件** | `pH value: 7–9 (diluted with water at a ratio of 1:10).`；确认比例指向 | **高** |
| P02 | 9.11 | 相对密度：约 1.06 g/cm³ | `Density: Approx. 1.06 g/cm³.` | 中文“相对密度”与英文“密度”指标不一致，且相对密度通常无量纲 | 查产品技术数据表，确认要统一为“密度/Density”还是“相对密度/Relative density” | **高** |
| P03 | 3.2 | N,N-二甲基乙醇胺（CAS 108-01-0） | `2-Dimethylaminoethanol` | 名称结构不够规范、存在歧义 | `N,N-Dimethylethanolamine` 或 `2-(Dimethylamino)ethanol` | **中** |
| P04 | 8.2 | `2006/121/EG` | `2006/121/EC` | 文档后缀不一致 | 对照法规原文核实；英文如采用英文官方缩写通常用 `EC` | **中** |
| P05 | 5.3 | 燃烧时释放……少量的氰化氢 | `Combustion may release ... trace amounts of hydrogen cyanide.` | 英文加 `may` 降低确定性；`trace amounts` 与“少量”不完全相同 | 若严格依中文：`Combustion releases ... small amounts of hydrogen cyanide.`；最终须与安全依据一致 | 中 |
| P06 | 11.7 | 亚急性、亚慢性和延迟毒性 | `Subacute, subchronic and prolonged toxicity` | `prolonged` 不完全等于“延迟” | 若严格依中文：`Subacute, subchronic and delayed toxicity` | 中 |
| P07 | 11.12 | 体内基因毒性 | `Germ cell mutagenicity (in vivo)` | “基因毒性”与“生殖细胞致突变性”范围不同 | 如以中文为准：`In vivo genotoxicity`；如使用 SDS 分类名则双语同时统一 | 中 |
| P08 | 4.2 | 须就医 | `Seek medical attention immediately.` | 英文增译“立即” | 若要求严格对应，删除 `immediately` | 低 |
| P09 | 7.2 | 必须遵守……储存条件 | `strictly follow ...` | 英文增加“严格”程度 | 可用 `follow` | 低 |
| P10 | 11.11 | 体外染色体畸变试验 | `In vitro mammalian chromosome aberration test` | 英文补充“哺乳动物”；与 OECD 473 常用名称相符 | 可在中文补充“哺乳动物”，无需机械删除英文 | 低 |
| P11 | 16 | 其它制程中使用 | `in any process` | 英文范围略宽 | `in any other process` | 低 |
| P12 | 2、15 | 章节/子标题 | `mixture: .`、`Other provisions: .` 等 | 多余句点 | 删除多余的 `.` | 低 |

**判定说明**：

- **准确**：中文含义和关键事实均得到保留。
- **基本准确**：含义基本保留，但存在语气、用词或补充限定差异。
- **建议修改**：术语、范围或确定性有值得修正的差异。
- **漏译**：英文缺少中文原文包含的实质信息。
- **需核实**：仅凭两份译文无法确定哪一版技术指标或法规表述正确。

---

## 二、Section 2 — Hazards Identification / 危险性概述

**页码**：中文第 1 页；英文第 1 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 2 标题 | 危险性概述 | Hazards Identification | 准确 |
| 2.1 标题 | GHS 危险性类别 | Classification of the substance or mixture | 基本准确，英文表述更完整 |
| 2.1 内容 | 根据 GHS 不属于危险物 | Not classified as a hazardous chemical according to GHS. | 准确 |
| 2.2 标题 | GHS 标签要素 | GHS Label Elements | 准确 |
| 2.2 子项 | GHS 象形图 | GHS pictograms | 准确 |
| 2.2 内容 | 根据 GHS 不属于危险物 | Not applicable. | 基本准确：英文省略了“不属于危险物”的完整说明，但表达无适用象形图的结果 |
| 2.3 标题 | 其他危害 | Other hazards | 准确 |
| 2.3 内容 | 无适用资料 | No applicable information. | 准确 |

**修改意见**：2.2 若要求逐字对应，可改为 `Not classified as hazardous according to GHS; no GHS pictogram is required.` 但原版 `Not applicable` 作为象形图状态也可以接受。删除 2.1、2.2、2.3 标题附近的多余句点（英文版出现 `: .`）。

**本节结论**：没有实质安全信息漏译。

## 三、Section 3 — Composition/Information on Ingredients / 成分与组成

**页码**：中文第 1 页；英文第 1 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 3 标题 | 成分/组成资料 | Composition/Information on Ingredients | 准确 |
| 3.1 | 产品类型：混合物 | Product type: Mixture | 准确 |
| 3.2 | 成分 | Ingredients | 准确 |
| 表头 | 化学品名称 | Chemical name | 准确 |
| 表头 | CAS 编号 | CAS NO. | 准确 |
| 表头 | 含量%（w/w） | Concentration % (w/w) | 准确 |
| 聚合物名称 | 聚氨酯聚合物 | Polyurethane polymer | 准确 |
| 聚合物 CAS | 商业机密 | Trade secret | 准确 |
| 聚合物含量 | ＞35 | ＞35% | 一致，英文补百分号 |
| 水名称 | 水 | Water | 准确 |
| 水 CAS | 7732-18-5 | 7732-18-5 | 一致 |
| 水含量 | ＞60 | ＞60% | 一致 |
| 胺名称 | N,N-二甲基乙醇胺 | 2-Dimethylaminoethanol | **建议修改**，英文命名不够规范 |
| 胺 CAS | 108-01-0 | 108-01-0 | 一致 |
| 胺含量 | 1-5 | 1-5% | 一致 |

**建议用语**：`N,N-Dimethylethanolamine`，或更明确的结构命名 `2-(Dimethylamino)ethanol`。上述译名与原文 CAS 108-01-0 相对应。**本节未见 CAS、百分数或组分条目的遗漏。**

## 四、Section 4 — First aid measures / 急救措施

**页码**：中文第 2 页；英文第 2 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 4 标题 | 急救措施 | First aid measures | 准确 |
| 4.1 标题 | 一般措施 | General measures | 准确 |
| 4.1 内容 | 立即脱掉所有被污染的衣物 | Remove all contaminated clothing immediately. | 准确 |
| 4.2 标题 | 误服 | Ingestion | 准确 |
| 4.2 内容 | 禁止催吐，须就医 | Do NOT induce vomiting. Seek medical attention immediately. | 基本准确；增译“立即” |
| 4.3 标题 | 接触眼睛 | Eye contact | 准确 |
| 4.3 内容① | 撑开眼睑 | Hold eyelids open | 准确 |
| 4.3 内容② | 用温水长时间冲洗（至少 10 分钟） | Flush with plenty of warm water for at least 10 minutes. | 准确 |
| 4.3 内容③ | 就诊眼科医生 | Consult an ophthalmologist. | 准确 |
| 4.4 标题 | 接触皮肤 | Skin contact | 准确 |
| 4.4 内容① | 立即用肥皂和大量的水冲洗 | Wash immediately with plenty of soap and water. | 准确 |
| 4.4 内容② | 若发生皮肤反应，就医 | If skin reaction occurs, seek medical advice. | 准确 |
| 4.5 标题 | 吸入 | Inhalation | 准确 |
| 4.5 内容 | 若刺激呼吸道，就医 | If respiratory irritation occurs, seek medical advice. | 准确 |

**修改意见**：4.2 如严格逐字对照可用 `Do not induce vomiting. Seek medical attention.`。但医嘱应以安全资料和专业审核为准，不应仅为了直译而降低必要的紧急程度。

## 五、Section 5 — Fire fighting measures / 消防措施

**页码**：中文第 2 页；英文第 2 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 5 标题 | 消防措施 | Fire fighting measures | 准确 |
| 5.1 标题 | 合适的灭火剂 | Suitable extinguishing agents | 准确 |
| 5.1 内容① | 二氧化碳（CO2）、泡沫、灭火粉末 | Carbon dioxide (CO2), foam, extinguishing powder. | 准确 |
| 5.1 内容② | 大火时应用喷洒水 | For large fires, use water spray. | 准确 |
| 5.2 标题 | 不合适的灭火剂 | Unsuitable extinguishing agents | 准确 |
| 5.2 内容 | 高流量的水喷射 | High-volume water jet. | 准确 |
| 5.3 标题 | 物质或混合物的特殊危害 | Special hazards of substances or mixtures | 准确 |
| 5.3 内容① | 燃烧时释放一氧化碳、二氧化碳、氮氧化物和少量的氰化氢 | Combustion may release carbon monoxide, carbon dioxide, nitrogen oxides and trace amounts of hydrogen cyanide. | 建议修改：`may release` 比“释放”更不确定；`trace amounts` 比“少量”更窄 |
| 5.3 内容② | 在着火或爆炸情况下，不要吸进烟尘 | In case of fire or explosion, do not breathe fumes/smoke. | 准确 |
| 5.4 标题 | 消防预防措施和保护设备 | Firefighting precautions and protective equipment | 准确 |
| 5.4 内容① | 消防人员必须佩戴自供气式呼吸器 | Firefighters must wear self-contained breathing apparatus (SCBA). | 准确 |
| 5.4 内容② | 禁止污染的灭火用水流入土壤、地下水或地表水中 | Do not allow contaminated firefighting water to enter soil, groundwater or surface water. | 准确 |

**译文统一建议（仅针对文字对应）**：`Combustion releases carbon monoxide, carbon dioxide, nitrogen oxides, and small amounts of hydrogen cyanide.` 是否使用确定性措辞仍需依据产品安全资料最终确定。

## 六、Section 6 — Measures for accidental leakage / 意外泄漏措施

**页码**：中文第 2 页；英文第 2 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 6 标题 | 意外泄漏措施 | Measures for accidental leakage | 准确 |
| 6.1 标题 | 个人预防措施、应急程序 | Personal precautions, protective equipment and emergency procedures | 准确，英文标题增加“防护设备” |
| 6.1 内容① | 戴防护设备 | Wear protective equipment. | 准确 |
| 6.1 内容② | 远离火源 | Keep away from ignition sources. | 准确 |
| 6.1 内容③ | 确保充分的通风/排气 | Ensure adequate ventilation. | 基本准确；未明确单列“排气” |
| 6.1 内容④ | 令未授权人员离开 | Keep unauthorized persons away. | 准确 |
| 6.2 标题 | 环境保护措施 | Environmental precautions | 准确 |
| 6.2 内容 | 禁止排入下水道、废水或土壤中 | Do not discharge into drains, wastewater, or soil. | 准确 |
| 6.3 标题 | 污染物收集和清除的方法 | Methods and material for containment and cleaning up | 准确 |
| 6.3 内容① | 用化学品吸收材料或必要时用干沙收集 | Absorb with chemical absorbent material or dry sand if necessary | 准确 |
| 6.3 内容② | 并储存于密闭容器中 | And store in tightly closed containers. | 准确 |

**本节结论**：无实质漏译。若要求尽量保留“排气”，6.1 可用 `Ensure adequate ventilation/exhaust.`。

## 七、Section 7 — Operation and storage / 操作和储存

**页码**：中文第 2–3 页；英文第 2–3 页。跨页句已合并检查。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 7 标题 | 操作和储存 | Operation and storage | 准确 |
| 7.1 标题 | 安全操作防范 | Precautions for safe handling | 准确 |
| 7.1 内容① | 操作时遵守化学品的常见预防措施 | Observe common chemical precautions during handling. | 准确 |
| 7.1 内容② | 避免与皮肤和眼睛接触 | Avoid contact with skin and eyes. | 准确 |
| 7.1 内容③ | 远离食物、饮料和烟草 | Keep away from food, drink and tobacco. | 准确 |
| 7.1 内容④ | 休息以前和工作结束时洗手 | Wash hands before breaks and at the end of workday. | 准确 |
| 7.1 内容⑤ | 将工作服单独存放 | Store work clothing separately. | 准确 |
| 7.1 内容⑥ | 更换被污染或浸湿的衣物 | Change contaminated or soaked clothing. | 准确 |
| 7.2 标题 | 安全储存条件 | Conditions for safe storage | 准确 |
| 7.2 内容① | 容器保持紧闭 | Keep containers tightly closed | 准确 |
| 7.2 内容② | 存储在干燥通风处 | In a dry, well-ventilated place | 准确 |
| 7.2 内容③ | 为保持产品质量，必须遵守我们产品信息表的储存条件 | To maintain product quality, strictly follow the storage conditions in our technical data sheet. | 基本准确；`strictly` 稍加强语气 |

**建议**：`To maintain product quality, follow the storage conditions in our technical data sheet.`；跨页无遗漏。

## 八、Section 8 — Exposure control / personal protection / 接触控制与个人防护

**页码**：中文第 3 页；英文第 3 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 8 标题 | 接触控制/个人防护 | Exposure control / personal protection | 准确 |
| 8.1 标题 | 暴露控制 | Exposure controls | 准确 |
| 呼吸防护 | 呼吸系统防护 | Respiratory protection | 准确 |
| 呼吸要求 | 喷涂过程中要求有呼吸防护设备 | Respiratory protection equipment is required during spraying. | 准确 |
| 手部防护 | 手部防护 | Hand protection | 准确 |
| 手套材料标题 | 防护手套的合适材料 | Suitable material for protective gloves | 准确 |
| 手套标准 | EN 374-3 | EN 374-3 | 一致 |
| 氟橡胶类别 | 氟化橡胶 – FKM | Fluororubber - FKM | 准确 |
| FKM 厚度 | ≥0.4 mm | Thickness ≥0.4 mm | 一致 |
| FKM 穿透时间 | ≥480 min | Breakthrough time ≥480 min | 一致 |
| 丁基橡胶类别 | 丁基橡胶 – IIR | Butyl rubber - IIR | 准确 |
| IIR 厚度 | ≥0.5 mm | Thickness ≥0.5 mm | 一致 |
| IIR 穿透时间 | ≥480 min | Breakthrough time ≥480 min | 一致 |
| 丁腈橡胶类别 | 丁腈橡胶 – NBR | Nitrile rubber - NBR | 准确 |
| NBR 厚度 | ≥0.35 mm | Thickness ≥0.35 mm | 一致 |
| NBR 穿透时间 | ≥480 min | Breakthrough time ≥480 min | 一致 |
| 建议 | 污染的手套应废弃 | Discard contaminated gloves. | 准确 |
| 眼防护 | 戴眼罩/面罩 | Wear protective goggles/face shield. | 准确 |
| 身体防护 | 穿着适当的防护服 | Wear appropriate protective clothing. | 准确 |
| 8.2 标题 | 工程控制 | Engineering controls | 准确 |
| 8.2 内容 | 根据 EC 指令 2006/121/EG，无可用的接触限值信息 | No exposure limit information is available under EC Directive 2006/121/EC. | **需核实**：中文 `EG`，英文 `EC` |

**重点**：法规编号后缀不同，不宜仅为了文字一致直接机械替换，需核对法规原始文本、引用语言版本和适用性。防护手套厚度、穿透时间均一致。

## 九、Section 9 — Physical and chemical properties / 物理和化学特性

**页码**：中文第 3–4 页；英文第 3–4 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 9 标题 | 物理和化学特性 | Physical and chemical properties | 准确 |
| 9.1 | 外观：透明至半透明液体 | Appearance: Transparent to translucent liquid. | 准确 |
| 9.2 | 嗅觉阀值：无数据 | Odour threshold: No data available. | 准确 |
| 9.3 | pH 值：7-9（按 1:10 的比例用水稀释） | pH value: 7-9 | **重要漏译**：缺少稀释比例及测试条件 |
| 9.4 | 离子性：阴离子 | Ionicity: Anionic | 准确 |
| 9.5 | 初沸点：约100℃ | Initial boiling point: Approx. 100 °C | 准确 |
| 9.6 | 闪点：初沸点以下无闪点 | Flash point: No flash point below initial boiling point. | 准确 |
| 9.7 | 蒸发速率：无数据 | Evaporation rate: No data available. | 准确 |
| 9.8 | 可燃性（固态、气态）：不适用 | Flammability (solids, gases): Not applicable | 准确 |
| 9.9 | 燃烧值：不适用 | Combustion value: Not applicable | 准确 |
| 9.10 | 相对蒸气密度：无数据 | Relative vapour density: No data available. | 准确 |
| 9.11 | 相对密度：约1.06 g/cm³ | Density: Approx. 1.06 g/cm³. | **需核实**：指标名称不一致且单位与“相对密度”不完全匹配 |
| 9.12 | 水溶性：可混溶 | Solubility in water: Miscible with water. | 准确 |
| 9.13 | 表面张力：无数据 | Surface tension: No data available. | 准确 |
| 9.14 | 辛醇/水分配系数的对数值：无数据 | log Pow (n-octanol/water partition coefficient): No data available. | 准确 |
| 9.15 | 自燃温度：不适用 | Auto-ignition temperature: Not applicable | 准确 |
| 9.16 | 引燃温度：约 420℃ | Ignition temperature: Approx. 420 °C | 准确 |
| 9.17 | 动力粘度：＜1000 mPa·s | Dynamic viscosity: < 1000 mPa·s | 准确 |
| 9.18 | 固体含量：37±2% | Solid content: 37±2% | 准确 |
| 9.19 内容① | 上述数据非产品指标 | The above data are not product specifications. | 准确 |
| 9.19 内容② | 产品指标请参见产品技术信息表 | Please refer to the product technical information sheet for specifications. | 准确 |

### 9.3 修订建议（优先级最高）

- 中文原文：`pH 值：7-9（按 1:10 的比例用水稀释）`
- 英文现状：`pH value: 7-9`
- 建议英文：`pH value: 7–9 (diluted with water at a ratio of 1:10).`
- **说明**：使用前最好确认“1:10”是样品:水还是样品:稀释后溶液，避免在英文中额外引入未经原始测试确认的定义。

### 9.11 修订建议（先核实）

- 中文的 **相对密度** 通常对应 `Relative density`，一般不直接采用 `g/cm³` 作为单位。
- 英文的 `Density` 与单位 `g/cm³` 更匹配。
- 所以此处不应只把 `Density` 直接改成 `Relative density`；应先查技术数据表，决定统一修改中文名称，或调整英文名称及单位。

**本节结论**：最重要实质性遗漏为 9.3，其余多数物性数值无误。

## 十、Section 10 — Stability and reactivity / 稳定性和反应性

**页码**：中文第 4 页；英文第 4 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 10 标题 | 稳定性和反应性 | Stability and reactivity | 准确 |
| 10.1 标题 | 化学稳定性 | Chemical stability | 准确 |
| 10.1 内容 | 根据规范使用，不会发生分解 | No decomposition if used according to specifications. | 准确 |
| 10.2 标题 | 危险分解产物 | Hazardous decomposition products | 准确 |
| 10.2 内容 | 在热分解过程中生成易燃有害气体 | Flammable and harmful gases generated during thermal decomposition. | 准确 |
| 10.3 标题 | 可能的危害反应 | Possibility of hazardous reactions | 准确 |
| 10.3 内容 | 正确储存或操作时，无危害反应 | No hazardous reactions when stored and handled correctly. | 准确 |

**本节结论**：无明显错译或漏译。

## 十一、Section 11 — Toxicity information / 毒性资料

**页码**：中文第 4–6 页；英文第 4–7 页。英文的章节跨页位置与中文版不同，但相关内容均能对应。

### 11.0 引言及 11.1–11.6

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 11 标题 | 毒性资料 | Toxicity information | 准确 |
| 引言① | 该产品无可用的毒理学研究 | No toxicological studies are available on the product. | 准确 |
| 引言② | 下面是这些成分的毒理学数据 | The following is toxicological data for these ingredients. | 准确 |
| 11.1 标题 | 急性毒性，经口 | Acute toxicity, oral | 准确 |
| 11.1 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.1 数值 | 半数致死剂量（LD50）大鼠：＞2,000 mg/kg | LD50 / Oral / Rat: > 2,000 mg/kg. | 准确 |
| 11.1 方法 | OECD 化学品测试指南 423 | Method: OECD Test Guideline 423. | 准确 |
| 11.1 研究 | 对类似产品的毒理学研究 | Studies on a similar product. | 准确 |
| 11.2 标题 | 急性毒性，经皮 | Acute toxicity, dermal | 准确 |
| 11.2 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.2 评估 | 此物质或混合物无急性皮肤毒性 | The substance or mixture has no acute dermal toxicity. | 准确 |
| 11.2 研究 | 对类似产品的研究 | Studies on a similar product. | 准确 |
| 11.3 标题 | 急性毒性，吸入 | Acute toxicity, inhalation | 准确 |
| 11.3 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.3 环境 | 试验环境：粉尘/烟雾 | Test atmosphere: dust/mist. | 基本准确；`mist` 常指雾滴，中文“烟雾”稍宽 |
| 11.3 评估 | 此物质或混合物无急性呼吸毒性 | The substance or mixture has no acute respiratory toxicity. | 准确 |
| 11.3 方法 | OECD 化学品测试指南 403 | Method: OECD Test Guideline 403. | 准确 |
| 11.3 研究 | 对类似产品的研究 | Studies on a similar product. | 准确 |
| 11.4 标题 | 主要皮肤刺激性 | Primary skin irritation | 准确 |
| 11.4 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.4 物种 | 家兔 | Species: Rabbit | 准确 |
| 11.4 结果 | 轻微刺激 | Result: Slight irritation. | 准确 |
| 11.4 分类 | 无皮肤刺激 | Classification: No skin irritation. | 准确 |
| 11.4 方法 | OECD 化学品测试指南 404 | Method: OECD Test Guideline 404. | 准确 |
| 11.4 研究 | 对类似产品的研究 | Studies on a similar product. | 准确 |
| 11.5 标题 | 主要粘膜刺激性 | Primary mucosal irritation | 准确 |
| 11.5 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.5 物种 | 家兔 | Species: Rabbit | 准确 |
| 11.5 结果 | 轻微刺激 | Result: Slight irritation. | 准确 |
| 11.5 分类 | 无眼睛刺激 | Classification: No eye irritation. | 准确 |
| 11.5 方法 | OECD 化学品测试指南 405 | Method: OECD Test Guideline 405. | 准确 |
| 11.5 研究 | 对类似产品研究 | Studies on a similar product. | 准确 |
| 11.6 标题 | 致敏性 | Respiratory or skin sensitization | 基本准确；英文更具体，增加呼吸道范畴 |
| 11.6 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.6 Buehler | Buehler（经皮试验）皮肤致敏性 | Buehler Test (dermal) | 基本准确 |
| 11.6 物种① | 豚鼠 | Species: Guinea pig. | 准确 |
| 11.6 结果① | 阴性 | Result: Negative. | 准确 |
| 11.6 分类① | 不引起皮肤过敏 | Classification: Did not cause skin sensitization. | 准确 |
| 11.6 方法① | OECD 化学品测试指南 406 | Method: OECD Test Guideline 406. | 准确 |
| 11.6 研究① | 对类似产品研究 | Studies on a similar product. | 准确 |
| 11.6 LLNA | 皮肤致敏性（局部淋巴结试验 LLNA） | Local lymph node assay (LLNA) | 基本准确 |
| 11.6 物种② | 小鼠 | Species: Mouse | 准确 |
| 11.6 结果② | 阴性 | Result: Negative. | 准确 |
| 11.6 分类② | 不引起皮肤过敏 | Classification: Did not cause skin sensitization. | 准确 |
| 11.6 方法② | OECD 化学品测试指南 429 | Method: OECD Test Guideline 429. | 准确 |
| 11.6 研究② | 对类似产品研究 | Studies on a similar product. | 准确 |

**审阅注记**：11.4/11.5 的“轻微刺激”是结果描述，而“不分类为刺激性”是分类结论；两者不能简单判断为翻译矛盾。11.6 虽采用含呼吸道致敏性的通用标题，文中列出的具体研究只有皮肤致敏性，不能据标题推断已完成呼吸道致敏性试验。

### 11.7–11.16

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 11.7 标题 | 亚急性、亚慢性和延迟毒性 | Subacute, subchronic and prolonged toxicity | **建议修改**：`prolonged` ≠ “延迟” |
| 11.7 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.7 数据 | 无数据资料 | No data available. | 准确 |
| 11.8 标题 | 致癌性 | Carcinogenicity | 准确 |
| 11.8 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.8 数据 | 无数据资料 | No data available. | 准确 |
| 11.9 标题 | 生殖毒性/生育力 | Reproductive toxicity - fertility | 准确 |
| 11.9 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.9 数据 | 无数据资料 | No data available. | 准确 |
| 11.10 标题 | 生殖毒性/致畸形 | Reproductive toxicity - teratogenicity | 准确 |
| 11.10 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.10 数据 | 无数据资料 | No data available. | 准确 |
| 11.11 标题 | 体外遗传毒性 | Germ cell mutagenicity (in vitro) | 基本准确，但术语范围有差异 |
| 11.11 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.11 试验① | 沙门氏菌/微粒体试验（Ames 试验） | Test type: Salmonella/microsome test (Ames test). | 准确 |
| 11.11 活化① | 代谢活化：有/无 | Metabolic activation: with/without. | 准确 |
| 11.11 结果① | 阴性 | Result: Negative. | 准确 |
| 11.11 方法① | OECD 化学品测试指南 471 | Method: OECD Test Guideline 471. | 准确 |
| 11.11 研究① | 对类似产品研究 | Studies on a similar product. | 准确 |
| 11.11 试验② | 体外染色体畸变试验 | Test type: In vitro mammalian chromosome aberration test. | 基本准确；英文增“哺乳动物” |
| 11.11 活化② | 代谢活化：有/无 | Metabolic activation: with/without. | 准确 |
| 11.11 结果② | 阴性 | Result: Negative. | 准确 |
| 11.11 方法② | OECD 化学品测试指南 473 | Method: OECD Test Guideline 473. | 准确 |
| 11.11 研究② | 对类似产品研究 | Studies on a similar product. | 准确 |
| 11.12 标题 | 体内基因毒性 | Germ cell mutagenicity (in vivo) | **建议统一术语**，英文描述的范围较特定 |
| 11.12 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.12 数据 | 无数据资料 | No data available. | 准确 |
| 11.13 标题 | STOT 评估—一次性接触 | Specific target organ toxicity (single exposure) | 准确 |
| 11.13 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.13 评估 | 基于现有数据，未满足分类标准 | Based on available data, the classification criteria are not met. | 准确 |
| 11.14 标题 | STOT 评估—重复性接触 | Specific target organ toxicity (repeated exposure) | 准确 |
| 11.14 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.14 数据 | 无数据资料 | No data available. | 准确 |
| 11.15 标题 | 吸入危害 | Aspiration hazard | 准确，英文是标准的“吸入性/误吸危害”分类术语 |
| 11.15 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.15 数据 | 无数据资料 | No data available. | 准确 |
| 11.16 标题 | CMR 评估 | CMR assessment | 准确 |
| 11.16 物质 | 聚氨酯分散体 | Polyurethane dispersion. | 准确 |
| 11.16 致癌性 | 致癌性：无数据资料 | Carcinogenicity: No data available. | 准确 |
| 11.16 致突变 | 致突变性：基于现有数据，未满足分类标准 | Mutagenicity: Based on available data, the classification criteria are not met. | 准确 |
| 11.16 致畸 | 致畸性：无数据资料 | Teratogenicity: No data available. | 准确 |
| 11.16 生殖 | 生殖毒性/生育力：无数据资料 | Reproductive toxicity / fertility: No data available. | 准确 |

**术语修订建议**：

1. 11.7 若严格译“延迟毒性”，使用 `Subacute, subchronic and delayed toxicity`，但仍建议与毒理报告原分类名比对。
2. 11.11 的 `mammalian` 是 OECD 473 常见试验名称的组成部分；如需完全双语一致，可考虑补充中文“哺乳动物”而非删除英文。
3. 11.12 中文“体内基因毒性”更直接对应 `In vivo genotoxicity`；如希望使用 `Germ cell mutagenicity (in vivo)` 作为标准分类标题，建议同步调整中文。

**本节结论**：LD50、试验物种、OECD 423/403/404/405/406/429/471/473 编号、阳阴性结果、无数据结论均有英文对应，未见重大数据漏译。

## 十二、Section 12 — Ecological information / 生态信息

**页码**：中文第 6–7 页；英文第 7 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 12 标题 | 生态信息 | Ecological information | 准确 |
| 12.1 标题 | 生态毒性 | Ecotoxicity | 准确 |
| 12.1 内容① | 该产品无可用的生态毒理学研究 | No ecotoxicological studies are available for this product. | 准确 |
| 12.1 内容② | 禁止排入下水道、废水或土壤中 | Do not discharge into drains, wastewater, or soil. | 准确 |
| 12.2 标题 | 持久性和降解性 | Persistence and degradability | 准确 |
| 12.2 数值 | 生物降解性：＜60%，28d | Biodegradability: < 60%, 28 d | 准确 |
| 12.2 评估 | 该产品不易生物降解 | The product is not readily biodegradable. | 准确 |
| 12.2 方法 | OECD 化学品测试指南 301D | Method: OECD Test Guideline 301D. | 准确 |
| 12.2 研究 | 对类似产品的研究 | Studies on a similar product. | 准确 |
| 12.3 标题 | 其他不利的影响 | Other adverse effects | 准确 |
| 12.3 数据 | 无数据资料 | No data available. | 准确 |

**本节结论**：无漏译，降解率、周期和方法编号一致。

## 十三、Section 13 — Disposal considerations / 处理注意事项

**页码**：中文第 7 页；英文第 7 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 13 标题 | 处理注意事项 | Disposal considerations | 准确 |
| 法规① | 必须遵守适用的国标、国家或当地法规进行废弃 | Dispose of in accordance with applicable national standards and national or local regulations. | 准确 |
| 法规② | 在欧盟领域内废弃，应根据欧洲废弃物分类（EWC）的适当法规 | Within the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC). | 准确 |
| 方法标题 | 处理方法 | Disposal methods | 准确 |
| 方法① | 尽可能将容器倒空 | Empty containers as completely as possible | 准确 |
| 方法② | 例如经倾倒、刮擦或排干直至“滴干” | E.g., by pouring, scraping, or draining until "drip-dry" | 准确 |
| 方法③ | 可根据化学工业现存的回收方案送往适当的收集点处理 | They may be sent to an appropriate collection point under existing chemical industry recycling schemes. | 准确 |
| 方法④ | 容器应按照国家法令和环境相关法规进行回收 | Recycle containers in accordance with national regulations and applicable environmental requirements. | 准确 |
| 方法⑤ | 不能将废弃物通过废水排放 | Do not discharge waste via wastewater. | 准确 |

**本节结论**：全文对应，未见漏译。

## 十四、Section 14 — Transportation information / 运输信息

**页码**：中文第 7 页；英文第 7–8 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 14 标题 | 运输信息 | Transportation information | 准确 |
| 14.1 标题 | 公路和铁路运输 | Road and rail transport | 准确 |
| 14.1 内容 | 非危险品陆运输方式 | Not classified as dangerous goods for land transport. | 准确 |
| 14.2 标题 | 海上运输 | Maritime transport | 准确 |
| 14.2 内容 | 非危险品海运方式，符合 IMDG 准则 | Not classified as dangerous goods for sea transport, in accordance with IMDG regulations. | 准确 |
| 14.3 标题 | 空运 | Air transport | 准确 |
| 14.3 内容 | 非危险品运输方式，符合 IATA 准则 | Not classified as dangerous goods for air transport, in accordance with IATA regulations. | 准确 |
| 14.4 标题 | 用户特殊注意事项 | Special precautions for user | 准确 |
| 14.4 内容 | 非危险货物 | Not regulated as dangerous goods. | 准确 |

**本节结论**：文本完整且对应；仅能确认“两份文档翻译一致”，不能据此单独验证实际危险货物运输分类。

## 十五、Section 15 — Regulatory information / 法规信息

**页码**：中文第 7 页；英文第 8 页。

| 条目 | 中文原文 | 英文原文 | 结论 / 说明 |
|---|---|---|---|
| 15 标题 | 法规信息 | Regulatory information | 准确 |
| 引言 | 物质或混合物的相关安全、健康和环保法律法规 | Relevant safety, health and environmental regulations for the substance or mixture. | 准确 |
| 子标题① | 其它的规定 | Other provisions | 准确 |
| 子标题② | 符合下列法规要求 | Complies with the following regulations | 准确 |
| 法规① | 危险化学品安全管理条例，国务院令591号 | Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591. | 准确 |
| 法规② | GB/T 16483 化学品安全技术说明书内容和项目顺序 | GB/T 16483 Safety data sheet for chemical products - Content and order of sections. | 准确 |
| 法规③ | GB 13690 化学品分类和危险性公示通则 | GB 13690 General rules for classification and hazard communication of chemicals. | 准确 |
| 法规④ | GB 30000.2-29 化学品分类和标签规范 | GB 30000.2-29 Rules for classification and labelling of chemicals. | 准确 |
| 法规⑤ | GB 15258 化学品安全标签编写规定 | GB 15258 General rules for preparation of precautionary label for chemicals. | 基本准确；若对外正式引用，建议核对标准官方英文名称 |

**格式问题**：英文 `Other provisions: .`、`Complies with the following regulations: .` 多了句点。**本节结论**：法规条目和编号没有漏译；法规现行效力或标准版本不在本次翻译审核范围内。

## 十六、Section 16 — Other information / 其他信息

**页码**：中文第 7–8 页；英文第 8 页。依语义对长句拆分核对。

| 条目 | 中文原文 | 英文原文（对应片段） | 结论 / 说明 |
|---|---|---|---|
| 16 标题 | 其他信息 | Other information | 准确 |
| 第一句 | 就我们所掌握的知识信息，截止本安全技术说明书发布之日，它提供的资料是正确的。 | To the best of our knowledge, the information provided in this Safety Data Sheet is accurate as of the date of publication. | 准确 |
| 第二句① | 所提供的信息仅仅作为安全处理、使用、生产、储存、运输、处置和排放的指导书 | The information given is designed only as guidance for safe handling, use, production, storage, transportation, disposal, and release | 准确 |
| 第二句② | 而不是一份担保或品质说明书 | And is not to be considered a warranty or quality specification. | 准确 |
| 第三句① | 本资料只针对所指定的具体物料 | The information relates only to the specific material designated | 准确 |
| 第三句② | 而对这种物料与其它物料混合使用 | And may not be valid for such material used in combination with any other materials | 准确 |
| 第三句③ | 或在其它制程中使用的情况，则未必有效 | Or in any process | 基本准确；英文范围略广，建议加 `other` |
| 第三句④ | 除非在文本中有特别说明 | Unless specified in the text. | 准确 |

**建议**：将 `or in any process` 修改为 `or in any other process`。本节声明跨页部分未漏译。

---

## 十七、按章节的整体判定表

| Section | 判定 | 核心说明 |
|---|---|---|
| 2 | 基本准确 | 2.2 更概括；有多余句点 |
| 3 | 建议修改 | 3.2 化学名称规范化 |
| 4 | 基本准确 | 4.2 略有增译 |
| 5 | 建议修改 | 5.3 释放确定性与数量描述变化 |
| 6 | 准确 | 无实质性问题 |
| 7 | 基本准确 | 7.2 略有语气加强 |
| 8 | 需核实 | 8.2 法规缩写 `EG/EC` 不一致 |
| 9 | **漏译且需核实** | 9.3 重要漏译；9.11 指标名称及单位需确认 |
| 10 | 准确 | 无实质性问题 |
| 11 | 基本准确，术语待统一 | 11.7、11.11、11.12 术语及范围 |
| 12 | 准确 | 无实质性问题 |
| 13 | 准确 | 无实质性问题 |
| 14 | 准确 | 无实质性问题 |
| 15 | 基本准确 | 多余句点；官方标准译名可再核对 |
| 16 | 基本准确 | `any process` 范围略宽 |

## 十八、建议执行顺序

1. **立即处理 9.3**：补回 pH 稀释条件，并确认 1:10 比例的定义。
2. **核实 9.11**：以产品技术资料确认密度/相对密度及单位，**同步**修订中英文，而不是单独直译。
3. **规范 3.2 化学名**：在不更改 CAS 和含量前提下采用明确英文名称。
4. **核实 8.2 法规引用**：统一正规引用和后缀。
5. **技术人员审阅 5.3**：确定燃烧释放描述应为 `releases` 还是 `may release`，并确认 `small amounts/trace amounts` 的依据。
6. **统一 11.7、11.11、11.12 毒理术语**：优先遵循原始试验报告和所采用的 SDS 编写规则。
7. **进行排版修正**：删除英文标题多余句点，检查跨页排版、单位空格、大小写与术语一致性。

## 十九、报告适用范围与注意事项

本报告**仅以两份用户提供的 PDF 为依据**。对于“是否有漏译、是否与中文原文含义一致”的判断，本报告可以直接使用；但下列事项需额外专业证据，**本报告不对其独立作出确认**：

- 所列成分浓度与产品真实配方是否一致；
- GHS 危险性分类、运输危险货物分类是否符合法规；
- 毒理学、生态毒理学研究是否真实且适用本产品；
- 引用标准与法规在当前日期是否仍然有效；
- pH 稀释比例的实验定义和相对密度的实际计量方式。

**最终结论**：英文版 Section 2–16 总体翻译可靠，结构完整，未见大面积错译。需要优先解决的**明确漏译是 9.3**；另外 **3.2、8.2、9.11** 建议完成修订/核实后再正式对外发布。
