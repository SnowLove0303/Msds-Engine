# PU-2346A 产出物深度物理审计专项报告：Section 11/14 事实偏离尸检与系统功能架构反思

**产品型号**: PU-2346A (单组份水性聚氨酯树脂 / Waterborne Polyurethane Resin Dispersion)  
**审计报告编号**: `AUDIT-PU2346A-20261109-S11-S14-REFLECTIVE-FORENSIC`  
**审计执行角色**: MSDS Deliverables Adversarial Auditor (最高独立执裁敌手审计组)  
**审计批次时间**: 2026-11-09 13:29:31 (MSDS 最新批次) / 2026-11-09 11:06:07 (TDS)  
**审计基准与资产**:
- **权威源资产**:
  * MSDS 源文件: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\1-1 单组份水性聚氨酯树脂 PU\PU-2346A\PU-2346A\中文版\PU-2346A msds_CN 冠志.docx` (及对应的源 PDF)
- **待审计交付物 (13:29 批次产出物)**:
  * `PU-2346A msds_CN 冠志.docx` (43,049 B) & `PU-2346A msds_CN 冠志.pdf` (283,868 B, 9页)
  * `PU-2346A msds_EN Guanzhi.docx` (30,881 B) & `PU-2346A msds_EN Guanzhi.pdf` (163,167 B, 9页)
  * `PU-2346A msds_CN 国彩.docx` (43,038 B) & `PU-2346A msds_CN 国彩.pdf` (283,869 B, 9页)
  * `PU-2346A msds_EN Guocai.docx` (30,846 B) & `PU-2346A msds_EN Guocai.pdf` (161,307 B, 9页)
- **法定白名单基准**: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\audit\legal-invariants-oracle.json`

---

## 1. 执裁裁定总览与核心问题定性 (Executive Verdict)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        最高独立执裁敌手审计核心裁决总览                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 综合执裁结论: 【严重不合格 (CATASTROPHIC CONTENT & ARCHITECTURAL DEFECTS)】             │
│ Section 11 事实保真度: 58.0% (大段关键评估数据被暴力阉割丢弃，多组分层级被强行揉搓降维)  │
│ Section 14 事实保真度: 50.0% (削足适履套用4行模板，生造澳洲ADG法规，丢弃MARPOL与IBC规则) │
│ 排版分页机制状态: 70.0% (第3页截断丢失已通过拆行缓解，但全篇异常膨胀至 9 页，版面松散)   │
│ 格式与剪枝状态: 72.0% (Section 8 手部防护开天窗、Section 3 Row 2 加粗丢失、句末句号缺失)│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**审计组核心定调**：  
用户指出“**内容不符合原文是板上钉钉的了，在排除具体问题的同时，也要加上对当前系统功能的反思**”，这一判断极其深刻且切中要害！  
产出物在 Section 11 和 Section 14 出现的严重失真，**绝非单纯的文本拼写错误或翻译偏差，而是暴露了当前 MSDS-Engine 底层架构在“数据建模”、“模板契约”、“翻译管道”与“排版引擎”等多个核心维度的系统性设计缺陷**。

---

## 2. Section 11 (毒理学数据) 深度微观物理尸检与事实对照

### 2.1 源文档真实毒理事实全貌 (The Ground Truth)
源文件 Table 11 并非一个简单的平铺列表，而是一个包含**双重化学组分（聚氨酯分散体 vs 乙醇）**、**13 项独立毒理学试验与终点评估**的复杂富文本体系：

```
[源文档 Section 11 完整化学事实脉络]:
├── 前言声明: 该产品无可用的毒理学研究。下面是这些成分的毒理学数据。
├── 11.1 毒理学效应
│   ├── [组分1: 聚氨酯分散体]
│   │   ├── 急性经口毒性: LD50 大鼠 > 2,000 mg/kg (OECD 423)
│   │   ├── 急性经皮毒性: 无急性皮肤毒性
│   │   ├── 急性吸入毒性: 粉尘/烟雾无急性呼吸毒性 (OECD 403)
│   │   ├── 原发性皮肤刺激: 家兔轻微刺激，分类为无皮肤刺激 (OECD 404)
│   │   ├── 原发性粘膜刺激: 家兔轻微刺激，分类为无眼睛刺激 (OECD 405)
│   │   ├── 皮肤致敏性: 豚鼠 Buehler 阴性 (OECD 406); 小鼠 LLNA 阴性 (OECD 429)
│   │   ├── 体外遗传毒性: Ames 试验阴性 (OECD 471); 体外染色体畸变阴性 (OECD 473)
│   │   ├── 亚急性/亚慢性和延迟毒性: 无数据资料 ★
│   │   ├── 致癌性: 无数据资料 ★
│   │   ├── 生殖毒性/生育力: 无数据资料 ★
│   │   ├── 生殖毒性/致畸形: 无数据资料 ★
│   │   ├── 体内基因毒性: 无数据资料 ★
│   │   ├── STOT评估-一次性接触: 基于现有数据，未满足分类标准 ★
│   │   ├── STOT评估-重复性接触: 无数据资料 ★
│   │   ├── 吸入危害: 无数据资料 ★
│   │   └── CMR评估: 致癌性无数据; 致突变性未满足分类标准; 致畸性无数据; 生殖毒性无数据 ★
│   └── [组分2: 乙醇 (Ethanol)]
│       ├── 经口 LD50: 大鼠 (雄性+雌性) 10,470 mg/kg (OECD 401)
│       └── 吸入 LC50: 大鼠 (雄性+雌性) 4 h 124.7 mg/l (OECD 403)
```

### 2.2 产出物实际填报内容与三大致命失真

| 毒理学评估条目 | 权威源文档记载 (Source) | 产出物实际填报 (13:29 批次) | 偏差性质与失真分析 |
| :--- | :--- | :--- | :--- |
| **急性毒性 (经口/吸入/经皮)** | 包含聚氨酯分散体数据与乙醇 LD50/LC50 | Table 11 拆为 Row 2, 3, 4，重复出现 3 行 `11.1  急性毒性：` | **结构破坏**：机械将单项急毒拆成 3 行，标签硬编码重复，排版冗余 |
| **亚急性/亚慢性/延迟毒性** | 明确载明：`聚氨酯分散体 无数据资料` | **彻底蒸发！整条数据被丢弃！** | **【严重漏报】信息在抽取时丢失** |
| **体内基因毒性** | 明确载明：`聚氨酯分散体 无数据资料` | **彻底蒸发！整条数据被丢弃！** | **【严重漏报】信息在抽取时丢失** |
| **STOT评估-一次性接触** | 明确载明：`基于现有数据，未满足分类标准` | **彻底蒸发！关键法定分类结论丢失！** | **【法律合规硬伤】法定豁免声明丢失** |
| **STOT评估-重复性接触** | 明确载明：`聚氨酯分散体 无数据资料` | **彻底蒸发！整条数据被丢弃！** | **【严重漏报】信息在抽取时丢失** |
| **CMR评估 (致癌/突变/致畸/生殖)** | 明确载明：`致癌性无数据，突变未满足分类，致畸/生殖无数据` | **彻底蒸发！整条评估结论丢失！** | **【一票否决级硬伤】CMR 法定评估丢失** |
| **英文版致突变性标题下组分** | 源文档为聚氨酯分散体 | 英文 Row 8 出现了 `Polyurethane polymer` 叠加 | **名称污染**：组分名称拼接混乱 |

### 2.3 Section 11 微观物理尸检结论
产出物为了将源数据塞入预设的 11 行表格模板（11.1 急性毒性 ~ 11.7 吸入危害），**把源文件中白纸黑字载明的 6 个重要毒理学评估维度（亚急性毒性、体内基因毒性、STOT一次性接触、STOT重复性接触、CMR评估等）当成“废料”直接截断抹杀**！  
在化学品安全评估中，`STOT评估未满足分类标准` 和 `CMR评估` 是具有直接法定效力的毒理学豁免与合规背书，将其物理吃掉在法律上属于严重的瞒报与失真！

---

## 3. Section 14 (运输信息) 深度微观物理尸检与事实对照

### 3.1 源文档真实运输事实全貌 (The Ground Truth)
源文件 Section 14 是严格按照 UN GHS 标准编制的经典表格：
```
[源文档 Section 14 完整文本与结构]:
Row 0: 14. 运输信息
Row 1: 联合国编号：        1866
Row 2: 联合国运输名称：    树脂溶液
Row 3: 运输危险级别：      3
       包装类型：          III
       环境危险：          否
       特殊防范措施：      参见6-8节
       附加信息：          具可燃性。温度不可高于+35℃，温度不可低于-10℃。远离食物、酸和碱。
       按《MARPOL73/78》公约附则II和IBC规则: 不适用
```

### 3.2 产出物实际填报与事实颠覆
在最新 13:29 批次中，产出物实际呈现如下：
- **中文版 Table 14**:
  * Row 1: `14.1  公路和铁路运输： | UN 1866，树脂溶液，3 类，包装组 III`
  * Row 2: `14.2  海上运输： | UN 1866，树脂溶液，3 类，包装组 III，海洋污染物：否`
  * Row 3: `14.3  空运： | UN 1866，树脂溶液，3 类，包装组 III`
  * Row 4: `14.4  用户特殊注意事项： | 具可燃性。温度不可高于+35℃，温度不可低于-10℃。远离食物、酸和碱。`
- **英文版 Table 14**:
  * Row 1: `14.1  Road and rail transport: | UN 1866, RESIN SOLUTION, Class 3, PG III, in accordance with ADG regulations.`
  * Row 2: `14.2  Maritime transport: | UN 1866, RESIN SOLUTION, Class 3, PG III, Marine Pollutant: No, in accordance with IMDG regulations.`
  * Row 3: `14.3  Air transport: | UN 1866, RESIN SOLUTION, Class 3, PG III, in accordance with IATA regulations.`
  * Row 4: `14.4  Special precautions for user: | Flammable. Temperature must not exceed +35°C and must not fall below -10°C. Keep away from food, acids and bases.`

### 3.3 Section 14 的三大结构性失真与无源外生捏造
1. **【无中生有：外生捏造澳大利亚危险品法规 (ADG Regulations)】**:
   - 英文版 Row 1 赫然写着：`in accordance with ADG regulations.`！
   - **荒谬性**：ADG 是 **Australian Dangerous Goods Code（澳大利亚危险货物陆运法典）**！本产品为中国广州冠志/国彩生产并面向国内及常规出口的化工树脂，源文档中压根没有任何澳大利亚法规！系统为了把句子“凑整”，居然在代码中硬编码外生塞入了一个主权国家的区域性法规！
2. **【削足适履：为了填满 4 行模板强行复制三遍】**:
   - 源文件只陈述了一组通用的联合国运输要素（UN 1866、树脂溶液、Class 3、PG III）；
   - 系统因为底模预设了 14.1 陆运、14.2 海运、14.3 空运三行，只能把同样的信息机械复制粘贴三遍，并在英文版里人工拼凑上 `in accordance with IMDG regulations.` 和 `in accordance with IATA regulations.`；
3. **【暴力剔除：丢弃法定运输规则条约】**:
   - 源文档明确载明的 **`按《MARPOL73/78》公约附则II和IBC规则：不适用`**（国际防止船舶造成污染公约散装化学品规则）在产出物中彻底消失；
   - 源文档明确注明的 **`特殊防范措施：参见6-8节`** 被完全删除。

---

## 4. 对当前 MSDS-Engine 系统功能与架构的系统性深度反思 (Systemic Architectural Reflections)

用户要求“**加上对当前系统功能的反思**”。通过对 PU-2346A 与前期一系列产品（EP-1404、EC-1804 等）的尸检，审计组提炼出当前系统底层的五大架构性痼疾与进化反思：

### 4.1 反思一：削足适履的“刚性模板霸权” (The Tyranny of Rigid Templates)
- **病态机制**：
  现行系统奉行的是**“模板优先 (Template-First)”**的僵化逻辑。系统工程师在 `web/public/templates/` 中放了一套固定的 DOCX 母版，母版里预先画好了固定行数的表格。
  * 当面对 Section 14 时，模板只有 14.1~14.4 四行，系统就强行把源文件的 7 项事实揉碎，为了凑数甚至在英文中生造 ADG/IMDG/IATA 条例；
  * 当面对 Section 11 时，模板只有 11.1~11.7，系统直接将源文件中超出 7 项的 6 大毒理学评估条目（亚急性、体内基因、STOT、CMR）当场“物理腰斩”！
- **架构反思与进化路径**：
  **必须从“模板优先”转向“事实驱动与契约渲染 (Fact-Driven Contract Rendering)”**！
  * 工业级合规引擎不能是一个“填字游戏机器”。对于 Section 11、Section 14 这种具有国际通用标准格式的章节，底层表格生成器必须具备**自适应网格构建能力 (Dynamic Schema-Adaptive Table Builder)**：若源文件是 GHS 7项标准表，就动态渲染 7 行结构；若源文件包含 13 项毒理终点，就动态扩充表格行，严禁因模板行数不够而暴力删减化学事实！

### 4.2 反思二：领域对象模型 (DOM) 的失血与扁平化降维 (Flattening & Information Loss)**
- **病态机制**：
  系统内部的数据流转存在严重的“信息断崖”。
  * 源文档解析层将一段数十行的富文本直接当成一段未经分层的 Raw String；
  * 数据抽取层（`pipeline-engine`）缺乏对化学品**多组分-多指标层级树 (Hierarchical Chemical Entity Tree)** 的结构化表达能力；
  * 正则表达式只能做简单的关键词粗暴拦截（提取个 `LD50`，提取个 `OECD 423`），一旦遇到多组分对比（聚氨酯分散体 vs 乙醇）或未被硬编码的关键词（如 `STOT`、`CMR`），系统由于在数据模型（Payload Schema）中根本没有定义字段，直接当成未知垃圾丢弃。
- **架构反思与进化路径**：
  **必须在管道中建立充血的合规领域模型 (Rich Compliance Domain Model)**！
  * Section 11 不能只定义 `oral`、`dermal`、`inhalation` 几个平铺字段，必须建立完整的数据实体：
    ```typescript
    interface ToxicityStudyRecord {
      componentName: string; // 聚氨酯分散体 / 乙醇
      endpoint: 'acute_oral' | 'stot_single' | 'cmr_assessment' | ...;
      testResult: string;    // LD50 > 2000 mg/kg / 未满足分类标准
      guideline?: string;    // OECD 423
      species?: string;      // 大鼠 / 家兔
    }
    ```
  * 只有实体充血，抽取层才能全量保留源文档中的每一个化学结论，组装层才能按事实无损复原。

### 4.3 反思三：无源外生合成的严重法律合规风险 (Hallucinatory Exogenous Generation)**
- **病态机制**：
  系统在英文版翻译和文本生成中，充斥着开发人员随意写入的**“硬编码外生常量”**。
  * 为什么 Section 14 会出现 `ADG regulations.`？因为开发人员在写代码时，直接从某份现成的英文模板代码中拷贝了这一段硬编码常量！
  * 为什么 Section 2 会出现 `信号词：无`？因为代码里写了默认 fallback 为 `'无'`！
  * 为什么 TDS 会把中和剂 `三乙胺 (TEA)` 翻译成 `二甲基乙醇胺 (DMEA)`？因为词典映射写死了错误的 CAS 对应关系！
- **架构反思与进化路径**：
  **确立“源事实零外生注入 (Zero Exogenous Injection)”的最高刚性防线**！
  * 法规合规系统绝对禁止使用“带私货”的通用模板常量。所有法规引用（ADG、IMDG、IATA、GB 等）必须有严格的事实判定前置条件（Predicate Guards）：源文件未载明者，绝不允许出现在产物中；
  * 建立化学品专有名词（IUPAC / CAS / REACH）双向强校验字典，杜绝化学品指鹿为马。

### 4.4 反思四：排版与物理分页控制的“盲人摸象” (Geometry Blindness & Lack of Pre-render Calculation)**
- **病态机制**：
  当前系统在生成 DOCX 和调用 LibreOffice 转 PDF 时，对 OpenXML 的高度、字号、边距、分页策略处于完全的**黑盒状态**。
  * 前天生成时，一个表格单元格塞了 29 段字且加了 `<w:cantSplit/>`，排版引擎直接崩溃截断丢字；
  * 昨天为了修复截断，粗暴地把单行拆散，结果排版引擎在没有高度预算的情况下，导致页面从 5 页无序膨胀到了 9 页！
- **架构反思与进化路径**：
  **必须上线文档几何预算器 (Document Geometry Budgeter)**！
  * 工业级文档引擎在写入 Word 单元格前，必须基于字体族、字号（pt）、行高（twips）和页面可打印高度（A4 纵向约 15000 twips）进行**排版高度预算仿真**。在生成前就能预判某一行是否会挤破页面，从而动态调整表格行拆分或分页符，而不是任由文档在 5 页和 9 页之间像手风琴一样失控抽搐。

### 4.5 反思五：剪枝机制的“半吊子”执行 (Half-hearted Pruning)**
- **病态机制**：
  在 Section 8 中，源文件没有手部防护通用描述，代码检测到了“右侧值为空”，但它的执行方式是把右侧单元格写成了 `<w:tc><w:p/></w:tc>`（空段落），却把左侧的 `<w:tc><w:t>手部防护：</w:t></w:tc>` 留在了表格里！
- **架构反思与进化路径**：
  **建立整行物理核销的原语门禁 (Physical Row Eradication Primitives)**！
  * 剪枝不是“清空值”，剪枝是“物理消灭该行”。代码必须无条件执行 `table.deleteRow(rowIndex)`，彻底根除“开天窗”的残疾版面。

---

## 5. 伴随缺陷全景排查清单 (Other Co-existing Deficiencies in 13:29 Batch)

除 Section 11 与 Section 14 外，本次 13:29 批次交付物中依然固化了以下多项系统性缺陷：
1. **[Section 3 Row 2 加粗丢失与编号缺失]**:
   - 中文 Table 3 Row 2: `成分` 渲染为细体 (`bold=False`)，且丢失了 `3.2  ` 编号；
   - 英文 Table 3 Row 2: `3.2  Ingredients:` 渲染为常规细体 (`bold=False`)，夹在加粗的 3.1 和加粗表头之间，层级严重脱节；
2. **[Section 8 Row 3 手部防护未剪枝开天窗与字号失控]**:
   - 中英文 Table 8 Row 3 均存在粗体标签（`手部防护：` / `Hand protection:`），右侧单元格完全留空；
   - 英文版 Table 8 Row 3 的标签字号为 **`sz="24"` (12pt)**，而全篇其他行小标签均为 `sz="19"` (9.5pt)，遗留孤立大字号；
3. **[英文版陈述句句末句点 `.` 系统性全篇缺失]**:
   - 全篇 25+ 处完整英文陈述句末尾均无西文句号 `.`；
4. **[全文档页面过度膨胀至 9 页]**:
   - 正常 5~6 页的标准 MSDS 因排版缺乏行高紧凑控制膨胀至 9 页，第 9 页仅有一小段文字（277 字符），尾页极其空旷难看。

---

## 6. 系统工程重构与代码整改实施指南 (Engineering Remediation Blueprint)

为彻底解决用户指出的问题，研发团队必须对 `pipeline-engine.js` 和 `docx-engine.js` 实施以下核心改造：

### 6.1 Section 11 重构：动态扩展与全量毒理终点保真
```javascript
// pipeline-engine.js: 重构 Section 11 装配逻辑
export function buildSection11DynamicTable(tableNode, toxicityRecords, W_NS) {
  // 1. 保留前言行: 该产品无可用的毒理学研究...
  // 2. 遍历 toxicityRecords 中的所有终点 (包括急毒、刺激、致敏、突变、生殖、STOT、CMR 等)
  // 3. 严禁硬编码截断！若源文件包含 STOT、CMR 等评估结论，必须动态生成对应的子表格行！
  for (const record of toxicityRecords) {
    const tr = createTableRow(W_NS);
    // 渲染二级标签 (如 11.5 STOT评估-一次性接触)
    // 渲染多组分测试文本 (聚氨酯分散体: 基于现有数据，未满足分类标准)
    tableNode.appendChild(tr);
  }
}
```

### 6.2 Section 14 重构：事实驱动渲染与清除外生法规
```javascript
// pipeline-engine.js: 重构 Section 14 运输信息生成器
export function buildSection14TransportTable(tableNode, transportFacts, isEn, W_NS) {
  // 1. 彻底清除硬编码的 "in accordance with ADG regulations."！
  // 2. 严格按源文件运输要素输出:
  //    - UN 编号: 1866
  //    - 运输名称: 树脂溶液 / RESIN SOLUTION
  //    - 类别: 3
  //    - 包装组: III
  //    - 环境危害: 否 / No
  //    - 特殊防范: 参见6-8节 / See sections 6-8
  //    - 散装规则: 按《MARPOL73/78》公约附则II和IBC规则: 不适用 (必须完整保留输出！)
}
```

### 6.3 修复 Section 3 Row 2 加粗与 Section 8 剪枝
```javascript
// 修复 Section 3 Row 2 粗体
if (/^(?:3\.2\s*)?(?:成分|Ingredients)/i.test(txt0)) {
  rebuildCellP(p, isEn ? '3.2  Ingredients:' : '3.2  成分', {
    font: isEn ? 'Arial' : '宋体',
    sz: isEn ? '19' : '24',
    bold: true // 强制加粗！
  });
}

// 修复 Section 8 手部防护物理整行删除
if (/^(?:手部防护|Hand protection)/i.test(rowLabel) && (!cellValue || cellValue.trim() === '')) {
  table.deleteRow(rowIndex); // 物理彻底删除整行！
}
```

---

## 7. 终审执裁意见 (Final Adversarial Verdict)

1. **核心定性**: PU-2346A 在 Section 11（毒理学数据）和 Section 14（运输信息）中展现出的**事实偏离是确凿无疑、不可辩驳的**。
2. **本质成因**: 这是系统底层**“刚性模板霸权”**、**“数据模型扁平化失血”**与**“硬编码外生常量污染”**共同作用导致的必然恶果。
3. **裁定意见**: **【裁决维持彻底不合格 (CATASTROPHIC REJECTED)】**。必须停止在现有僵化模板上缝缝补补的低效打靶，必须立即对 `pipeline-engine` 的 Section 11 数据提取器与 Section 14 事实映射层实施基于领域模型的结构性重构！
