# MSDS Studio 工业级产物全景审计体系标准规范文档 (Master Audit Methodology Manual)

> **文件版本**：v6.0-ENTERPRISE (UNIFIED MASTER ARCHITECTURE)  
> **法定效力**：全系统最高产物质量核销法定大纲（Supreme Deliverable Audit Constitution）  
> **适用范围**：MSDS-Engine / MSDS Studio 全套标准交付物（4 DOCX + 4 PDF：冠志中英 × 国材中英）  
> **体系咬合**：OrbitStack 轨道工程体系、Ps-openspec 双门禁研发架构、两阶双轨通用深度审计体系、法医级反直觉白名单 Oracle  

---

## 目录 (Table of Contents)

- [一、 体系总纲与两阶双轨架构 (The Architectural Governance)](#一-体系总纲与两阶双轨架构-the-architectural-governance)
  - [1.1 核心自审哲学：从“证明没有错”到“敌手挑刺证伪”](#11-核心自审哲学从证明没有错到敌手挑刺证伪)
  - [1.2 裁执物理隔离机制 (Producer vs. Auditor Separation)](#12-裁执物理隔离机制-producer-vs-auditor-separation)
  - [1.3 两阶双轨统一审计架构拓扑](#13-两阶双轨统一审计架构拓扑)
  - [1.4 阶一：机械确定性硬阻断审计 (Step 1 Mechanical Deterministic Audit - 准入钥匙 1)](#14-阶一机械确定性硬阻断审计-step-1-mechanical-deterministic-audit---准入钥匙-1)
  - [1.5 阶二：智能体语义与敌手显微镜对账审计 (Step 2 Cognitive Adversarial Audit - 准出钥匙 2)](#15-阶二智能体语义与敌手显微镜对账审计-step-2-cognitive-adversarial-audit---准出钥匙-2)
  - [1.6 逆向反例变异与反弱断言欺诈门禁 (Negative Mutation & Anti-Fraud Gates)](#16-逆向反例变异与反弱断言欺诈门禁-negative-mutation--anti-fraud-gates)
  - [1.7 规范项数 1:1 绝对守恒与遗漏熔断 (Zero-Omission Circuit Breaker)](#17-规范项数-11-绝对守恒与遗漏熔断-zero-omission-circuit-breaker)
- [二、 十大全局物理不变量与排版门禁 (Macro Invariants)](#二-十大全局物理不变量与排版门禁-macro-invariants)
  - [2.1 格式服从于原文公理 (Format Follows Source Content)](#21-格式服从于原文公理-format-follows-source-content)
  - [2.2 工作流法定预清空第一步 (cleanSlateTemplate Pre-clear)](#22-工作流法定预清空第一步-cleanslatetemplate-pre-clear)
  - [2.3 全局表格边框统一规范 (Unified Table Border Invariant: 外实内虚)](#23-全局表格边框统一规范-unified-table-border-invariant-外实内虚)
  - [2.4 页眉页脚安全几何公理 (Footer Margin & Truncation Invariant)](#24-页眉页脚安全几何公理-footer-margin--truncation-invariant)
  - [2.5 多语言媒体资产纯度公理 (Multilingual Media Asset Purity)](#25-多语言媒体资产纯度公理-multilingual-media-asset-purity)
  - [2.6 双实体预设物理隔离公理 (Dual-Entity Isolation Invariant)](#26-双实体预设物理隔离公理-dual-entity-isolation-invariant)
  - [2.7 法规时效性正向演进公理 (Statutory Modernity Evolution Invariant)](#27-法规时效性正向演进公理-statutory-modernity-evolution-invariant)
  - [2.8 交付物时间戳同步与末页防纯空门禁 (Timestamp & Anti-Blank-Page)](#28-交付物时间戳同步与末页防纯空门禁-timestamp--anti-blank-page)
  - [2.9 标签类型严格二分法与唯一父级题头免剪枝白名单公理 (Label Dichotomy & Non-Prunable Skeleton)](#29-标签类型严格二分法与唯一父级题头免剪枝白名单公理-label-dichotomy--non-prunable-skeleton)
  - [2.10 标点符号纯度与中西文严格隔离公理 (Punctuation Purity Axiom)](#210-标点符号纯度与中西文严格隔离公理-punctuation-purity-axiom)
  - [2.11 中英事实同构与防外生底模编造公理 (Isomorphic Grounding & Anti-Fabrication Axiom)](#211-中英事实同构与防外生底模编造公理-isomorphic-grounding--anti-fabrication-axiom)
  - [2.12 化工专业定性公理 (Chemical Domain Qualitative Invariant)](#212-化工专业定性公理-chemical-domain-qualitative-invariant)
- [三、 16 章节微观逐节审计规范与判定细则 (Section-by-Section Master Audit Specifications)](#三-16-章节微观逐节审计规范与判定细则-section-by-section-master-audit-specifications)
  - [Section 1: 化学品及企业标识 (Identification)](#section-1-化学品及企业标识-identification)
  - [Section 2: 危险性概述 (Hazards Identification)](#section-2-危险性概述-hazards-identification)
  - [Section 3: 成分/组成信息 (Composition / Ingredients)](#section-3-成分组成信息-composition--ingredients)
  - [Section 4: 急救措施 (First Aid Measures)](#section-4-急救措施-first-aid-measures)
  - [Section 5: 消防措施 (Fire Fighting Measures)](#section-5-消防措施-fire-fighting-measures)
  - [Section 6: 泄漏应急处理 (Accidental Release Measures)](#section-6-泄漏应急处理-accidental-release-measures)
  - [Section 7: 操作处置与储存 (Handling and Storage)](#section-7-操作处置与储存-handling-and-storage)
  - [Section 8: 接触控制/个体防护 (Exposure Controls / Personal Protection)](#section-8-接触控制个体防护-exposure-controls--personal-protection)
  - [Section 9: 理化特性 (Physical and Chemical Properties)](#section-9-理化特性-physical-and-chemical-properties)
  - [Section 10: 稳定性和反应性 (Stability and Reactivity)](#section-10-稳定性和反应性-stability-and-reactivity)
  - [Section 11: 毒理学信息 (Toxicological Information)](#section-11-毒理学信息-toxicological-information)
  - [Section 12: 生态学信息 (Ecological Information)](#section-12-生态学信息-ecological-information)
  - [Section 13: 废弃处置 (Disposal Considerations)](#section-13-废弃处置-disposal-considerations)
  - [Section 14: 运输信息 (Transport Information)](#section-14-运输信息-transport-information)
  - [Section 15: 法规信息 (Regulatory Information)](#section-15-法规信息-regulatory-information)
  - [Section 16: 其他信息 (Other Information)](#section-16-其他信息-other-information)
- [四、 中英文 16 章节逐行双语对照审计方法论 (Bilingual Line-by-Line Cross-Audit Methodology)](#四-中英文-16-章节逐行双语对照审计方法论-bilingual-line-by-line-cross-audit-methodology)
  - [4.1 双语对称性总则与豁免边界](#41-双语对称性总则与豁免边界)
  - [4.2 16 章节双语对照判定矩阵](#42-16-章节双语对照判定矩阵)
  - [4.3 双语机器对账算法与失配报警机制](#43-双语机器对账算法与失配报警机制)
- [五、 法定免检白名单基准库 (Legal Invariants Oracle & False-Positive Interception)](#五-法定免检白名单基准库-legal-invariants-oracle--false-positive-interception)
  - [5.1 白名单核心作用机制](#51-白名单核心作用机制)
  - [5.2 权威白名单词条清册 (INV-01 ~ INV-11)](#52-权威白名单词条清册-inv-01--inv-11)
  - [5.3 禁止指责话术库 (Forbidden Accusations Database)](#53-禁止指责话术库-forbidden-accusations-database)
- [六、 集中式中央主审计引擎与审计操作 SOP (Central Master Audit Suite & Operations SOP)](#六-集中式中央主审计引擎与审计操作-sop-central-master-audit-suite--operations-sop)
  - [6.1 集中式统一审计指令集](#61-集中式统一审计指令集)
  - [6.2 1:1 双向物理核销清算表输出规范](#62-11-双向物理核销清算表输出规范)
  - [6.3 缺陷驳回与长效防线下沉闭环机制](#63-缺陷驳回与长效防线下沉闭环机制)

---

## 一、 体系总纲与两阶双轨架构 (The Architectural Governance)

### 1.1 核心自审哲学：从“证明没有错”到“敌手挑刺证伪”
传统自动化脚本或大模型自审中最严重的系统性顽疾是**“自编自导自测”**与**“确认偏差（Confirmation Bias）”**：
- 编写代码的智能体往往预设自己的产出是正确的，其编写的测试或审计脚本充斥着弱存在性断言（如简单的关键字扫描 `assert(/工程控制/.test(text))`）；
- 只要命中少数关键字，不论后面是否潜伏着长篇底模外生口水话、虚假化学组分、严重缩进错位或排版截断，系统均会虚假亮起绿灯（退出码 0）。
- 同时，碎片化的单次调试脚本容易在不同型号间硬编码特判（如 `if (model === 'PA-4780') ...`），导致新产品缺乏完整审计、维护成本极高，极易产生**误报合规操作为错误（假阳性）**或**漏审真实缺陷（假阴性）**。

> [!IMPORTANT]
> **MSDS Studio 审计体系的最高法定哲学**：  
> **审计者绝非为了证明产出物没有错而走过场，而是必须预设产出物中必然存在隐藏缺陷、事实篡改、外生口水话与排版畸形，以冷酷敌手（Adversary）的身份主动挑刺、去寻找错误！**  
> 任何审计结论必须以源码物理文件与行号区间（`file:///path#Lxx-Lyy`）、真实 OOXML DOM 节点与真实 PDF 渲染像素为充要凭据。

### 1.2 裁执物理隔离机制 (Producer vs. Auditor Separation)
为彻底杜绝自编自导与利益冲突，系统在组织架构、执行线程与代码实现上实行**裁执物理隔离**：
1. **施工/生产端 (Producer Subagent)**：
   - 专用独立线程与上下文，专注于调度 MSDS Studio 编辑器原语与转换流水线；
   - 严格恪守“法定预清空第一步”、“格式服从源文档”、“大模型逐句英译”；
   - **严禁生产端自我宣布审计合格并自主合流代码**。
2. **审计端 (Auditor Subagent / Main Coordinator)**：
   - 由主协调 Agent 或全新独立 Subagent（`Model='pro'`, `Workspace='branch'`）担任，站在甲方的严苛立场执裁；
   - 拥有独立的只读黄金事实基准库（源文档 100% 留存事实）；
   - 执行集中式三环审计（全局宏观环 + 16 章节专属环 + 法定白名单反欺诈环）；若发现任何违背事实的篡改，坚决下达 `[AUDIT_REJECT]` 驳回令！

### 1.3 两阶双轨统一审计架构拓扑

```mermaid
flowchart TD
    subgraph Phase1_Production["生产阶段 (Producer Subagent)"]
        Src["源文档 (Ground Truth)"] --> Wipe["1. cleanSlateTemplate 强制底模预清空"]
        Wipe --> Parse["2. 零损耗化学事实提取与格式匹配"]
        Parse --> Trans["3. 上下文语义大模型逐句英译"]
        Trans --> Export["4. 批量导出 8 份交付物 (4 DOCX + 4 PDF)"]
    end

    Export -->|交付物移交| Master_Suite["集中式中央主审计引擎 (run_master_msds_audit.mjs)"]

    subgraph Two_Step_Audit["两阶双轨通用深度审计体系"]
        subgraph Step1_Mechanical["第一阶：机械确定性审计 (准入钥匙 1)"]
            direction TB
            Ring1["环 1: 全局宏观物理不变量\n(8格式/新鲜度/OPC/XML/边框/字体/标点)"]
            Ring2["环 2: PDF 物理真实渲染实测\n(说明行9.50pt / S9激光对齐x0=80.28pt / 末页防纯空)"]
            Ring3["环 3: 16 章节局部专属契约\n(S1~S16 逐节槽位/几何合并/反口水话/温控保真)"]
            Ring4["环 4: 中英文 16 章节逐行双语对照\n(行数同构/翻译精准/专业命名/排他断言)"]
            Ring1 --> Ring2 --> Ring3 --> Ring4
        end

        Step1_Mechanical -->|真实退出码 0 (必要条件)| Step2_Cognitive["第二阶：智能体语义与敌手显微镜对账 (准出钥匙 2)"]

        subgraph Step2_Cognitive["第二阶：智能体语义与敌手显微镜对账 (准出钥匙 2)"]
            direction TB
            Oracle["白名单反误判过滤\n(legal-invariants-oracle.json 拦截已知合法反直觉规范)"]
            Adversary["敌手挑刺与证伪攻击\n(主动寻找边界异常/未授权推断/张冠李戴)"]
            Checkoff["1:1 双向物理核销\n(原源文档事实指纹 100% 对应 [Measured] 凭证)"]
            Oracle --> Adversary --> Checkoff
        end
    end

    Master_Suite --> Step1_Mechanical

    Step2_Cognitive -->|发现任一真实缺陷| Reject["🚨 AUDIT_REJECT: 坚决打回整改令\n(精准锚定问题文件与行号)"]
    Reject -->|退回生产端重修| Phase1_Production

    Step2_Cognitive -->|100% 满分无缺陷| Pass["🏆 AUDIT_PASSED: 出具 1:1 双向物理核销清算表"]
    Pass --> Release["交付用户验收归档 (Git Commit 原子归档)"]
```

### 1.4 阶一：机械确定性硬阻断审计 (Step 1 Mechanical Deterministic Audit - 准入钥匙 1)
- **定位**：机器底座准入（钥匙 1）。是审计放行的**必要条件**，未通过前严禁进入第二阶；
- **核心断言库（四大环路）**：
  - **环 1 (全局物理不变量)**：G-01 交付目录纯净与 8 格式存在性；G-36 时间戳同步性差值 $\le 300\text{s}$；G-39 OPC 结构完整性与 `[Content_Types].xml` 声明；G-02/G-03 全文零非法制表符；G-04/G-05 全局表格外实内虚边框完整性；G-06~G-09 标点符号纯度与中西文绝对隔离；
  - **环 2 (PDF 真实渲染硬断言)**：G-37 英文说明行实际像素字号 9.50pt；G-38 Section 9 标签首字激光垂线对齐至 $x_0=80.28\text{pt}$；G-40 末页防纯空门禁（扣除页眉页脚后有效主体文本块 $>0$）；
  - **环 3 (16 章节专属局部契约)**：Section 1 至 Section 16 的结构行数、列数、跨列合并（`gridSpan=3`）、行高收敛、连续递增编号、反口水话排他断言；
  - **环 4 (中英文 16 章节逐行双语对照)**：G-41 至 G-46，除 Section 1 法定结构差异外，Section 2~16 必须 1:1 槽位镜像对应，行数绝对对称，关键化学品名、CAS 号、技术参数、免责陈述 100% 语义对应。

### 1.5 阶二：智能体语义与敌手显微镜对账审计 (Step 2 Cognitive Adversarial Audit - 准出钥匙 2)
- **定位**：语义契约证伪与事实保真（钥匙 2）。是审计放行的**充要条件**；
- **核心操作**：
  1. 解包 DOCX 压缩包，深入 `word/document.xml` 与 `word/footer*.xml` 的底层 XML 标签；
  2. 针对源文档提取的每一个 CAS 号、数值、波浪号公差、标点符号、行数，与交付物中的对应槽位做微观对比；
  3. 审查是否存在大模型通用预训练产生的“自以为是发挥”（如将固化剂写成乳液、强塞通用消防 SCBA、强塞通用排风设备、篡改原文档明确的“建议使用护目镜”等）；
  4. 结合 `legal-invariants-oracle.json` 进行**反直觉合法规范白名单过滤**，杜绝将“手部防护留空”、“Section 9 存活无数据”、“Section 2 缺省显示无”、“Section 1.1 中文留空”等合规行为误判为缺陷。

### 1.6 逆向反例变异与反弱断言欺诈门禁 (Negative Mutation & Anti-Fraud Gates)
为防止审计脚本自身退化为弱断言：
1. **成对排他断言铁律**：凡检查某一项必须输出的内容，必须同步编写对应的逆向反例排他断言。例如：
   - 正向：`assert(/8\.2\s*工程控制/.test(text))`
   - 逆向：`assert(!/使用局部排风或全面通风|低于职业接触限值|洗眼器与安全淋浴设施/.test(text))`
2. **变异元审计杀伤力验证**：若向交付物中人为注入一句底模口水话或多加一行无源数据，审计脚本必须立即变红报错；若变异注入后仍返回 0，直接判定该审计脚本犯有 `TRIVIAL_ASSERTION_FRAUD`（弱断言欺诈），立即锁死流水线。

### 1.7 规范项数 1:1 绝对守恒与遗漏熔断 (Zero-Omission Circuit Breaker)
在终审审计报告中，必须严格出具：
- **全局规范项清单**（$N$ 项，包含十大全局不变量）；
- **局部规范项清单**（$M$ 项，覆盖 16 个章节全部契约）；
- **对账总行数必须严格等于 $N+M$ 行**。少于法定项数直接触发 `SPEC_OMISSION_DETECTED` 熔断阻断，彻底消除审计缺漏死角。

---

## 二、 十大全局物理不变量与排版门禁 (Macro Invariants)

全局不变量为全系统跨章节、跨型号通用的最高法定宪法，任何章节的改动均不得违反以下十大铁律：

### 2.1 格式服从于原文公理 (Format Follows Source Content)
> **公理准则**：“基于模板的格式与基于源文件的内容做匹配，格式服从于原文。”
- 模板提供的是版面几何网格、标准字体与行距骨架，绝对不代表内容事实；
- 若源文件某章节只有叙述性说明行（例如“根据EC指令2006/121/EG,无可用的接触限值信息”），直接匹配到模板的说明行插槽，沿用模板格式；其余多余的空白数据行必须物理删除或剪枝，绝不可为了迁就模板表格而强行塞入捏造的假数据；
- 严禁为了迁就模板结构而凭空捏造端点，严禁为了塞入内容而破坏模板几何总宽。

### 2.2 工作流法定预清空第一步 (cleanSlateTemplate Pre-clear)
> **预清空铁律**：模板载入后的第一行代码，必须无条件调用预清空机制。
- 官方 DOCX 底模内存在大量历史遗留的样例占位符（如二乙二醇单丁醚、3306 mg/kg、局部排风通风长句等）；
- 引擎在调用任何写值函数前，必须首先调用 `cleanSlateTemplate(engine)` 将所有业务值格洗净为纯白板状态（`""`）；
- 严禁对易错章节（如 Section 8）进行粗暴的整体豁免清空；必须建立白名单精细化保护机制（仅保护多列表头与题头，清空全部业务值格）。

### 2.3 全局表格边框统一规范 (Unified Table Border Invariant: 外实内虚)
> **边框铁律**：全文档所有 16 个章节表格，必须统一为**外框实线 (`single`)，内框虚线 (`dotted`)**。
- 表格整体外框（Top, Bottom, Left, Right）线型必须为 `single`（实线）；
- 表格内部水平分割线与垂直分割线（InsideH, InsideV）线型必须为 `dotted`（统一虚线）；
- 动态增行（如 Section 3 组分自适应增行）或动态删行（如 Section 8 无限值剪枝）后，底座必须自动修补边框，严禁出现内部虚线断层或末行底边虚化的缺陷。

### 2.4 页眉页脚安全几何公理 (Footer Margin & Truncation Invariant)
> **页脚安全铁律**：严禁在页脚单元格中注入超出物理可用宽度的异常缩进。
- 底模历史缺陷曾在 `word/footer1.xml` 中潜伏 `w:firstLine="8730"` 异常首行缩进（超出单元格宽度 4984 dxa）；
- 导致无头转 PDF 引擎（LibreOffice/WPS）在渲染右对齐页脚时，首字（如“修”字或“R”字）被物理视口截断；
- 审计必须强制检查 `footer*.xml`，彻底物理剥离异常 `w:ind`，确保“修订日期：YYYY/MM/DD”和“Revision Date: YYYY/MM/DD”在 PDF 中 100% 完整可见。

### 2.5 多语言媒体资产纯度公理 (Multilingual Media Asset Purity)
> **媒体纯度铁律**：英文交付物中的一切插图与象形图，必须使用纯净的多语言图形资产。
- 严禁在英文交付物中复用中文模板带有的带有汉字的光栅位图（如带有“警告”二字、5493 字节的 `image1.jpeg`）；
- 英文交付物中的 GHS 菱形象形图必须使用纯矢量或纯正多语言 PNG 图形资产（如 7450 字节的纯净图形），确保语言纯洁度 100%。

### 2.6 双实体预设物理隔离公理 (Dual-Entity Isolation Invariant)
> **实体隔离铁律**：广州冠志与英德国彩两套预设的全部实体数据必须实现物理级强隔离，严禁任何数据串流。
- **广州冠志版 (Guanzhi)**：
  - 中文公司名：广州冠志新材料科技有限公司
  - 英文公司名：Guangzhou Guanzhi New Material Technology Co., Ltd.
  - 地址：广州市萝岗区科学城掬泉路3号广州国际企业孵化器A区1106室
  - 电话：86-20-82567990 / 传真：86-20-32214789
  - 页眉标识：广州冠志新材料科技有限公司 [型号]-MSDS
- **英德国彩版 (Guocai)**：
  - 中文公司名：英德市国彩精细化工有限公司（或英德国彩新材料）
  - 英文公司名：Yingde Guocai New Material Co., Ltd.
  - 地址：广东省英德市白沙镇太平村更古坑凯迪工业园区
  - 电话：86-763-2811205 / 763-2811205 / 传真：86-763-2811024
  - 页眉标识：英德市国彩精细化工有限公司 [型号]-MSDS
- 审计必须分别检查冠志中英与国彩中英的 Page 1 与页眉，出现任一处实体串流直接一票否决！

### 2.7 法规时效性正向演进公理 (Statutory Modernity Evolution Invariant)
> **法规演化铁律**：针对国家法规与国标，严禁机械复制已废止的历史法律法规，强制正向演进为现行有效标准。
- 危险化学品安全管理条例：强制使用**现行国务院令第 591 号**，严禁倒退为已废止的 344 号令；
- 化学品分类与标签规范：强制使用**现行有效的 GB 30000 系列国标**（GB 30000.2-29），严禁倒退为已废止的 GB 20576 ~ GB 20598 系列；
- 中文源文档若带有历史旧法规条目，中文交付物保持历史原貌，但英文交付物必须正向演进并映射为现行有效国标法规译名。

### 2.8 交付物时间戳同步与末页防纯空门禁 (Timestamp & Anti-Blank-Page)
- **时间戳同步门禁 (G-36)**：全套 8 份文件的最后修改时间差值必须 $\le 300\text{s}$，证明其为同一编译流水线原子输出；
- **末页防纯空门禁 (G-40 - Blank Page Bug Zero-Tolerance)**：
  - 严禁由于多余换行符、过大行高或分页符溢出，导致生成的 PDF 最后一页仅包含页眉页脚而无实质主体文本；
  - 审计必须使用 PyMuPDF 读取末页全部文本块，扣除页眉页脚后主体文本块数量必须 $> 0$。

### 2.9 标签类型严格二分法与唯一父级题头免剪枝白名单公理 (Label Dichotomy & Non-Prunable Skeleton)
> **核心二分法定义**：在表格 DOM 结构中，必须严格区分**普通标签（叶子标签）**与**唯一父级分类题头标签**！
1. **普通标签 (叶子标签 - Leaf Labels)**：
   - 处于树状结构的末端叶子节点，右侧紧跟具体数值，无任何下属子行（例如 10.2 危险分解产物、9.x 理化特性单项、缺席的毒理学端点）；
   - 若源文件无对应值且非法定必填，必须物理整行删除（`deleteRow`），严禁保留空行或无值标签；
2. **唯一父级分类题头标签 (白名单 - Parent Classifier Headers)**：
   - 在表格中起分类聚合、统领下属细分参数或子规格的题头标签（例如 Section 8.1 的 `手部防护：` / `Hand protection:` 统领下属手套材料规格 EN 374-3、FKM、IIR、NBR 及建议行；`8.1  暴露控制：` / `8.1 Exposure controls:`；Section 1 的 `1.1  产品名称：` / `1.1 Product name:`）；
   - **绝对不可整行删除（严禁 `deleteRow`）**！删除唯一父级题头会导致下属子行在视觉与层级拓扑上错位挂靠到上一个同级标签（如手套参数挂靠到呼吸防护），破坏文档语义树；
   - **法定处置规范**：当源文档无独立一句话通用陈述时，**核心法则是【父级标签留空一般允许不删行隐藏】**。必须保留加粗标签（中文字号必须与同级标签一致，统一为 `w:sz="24"` 小四宋体），彻底清洗单元格内的历史残留空行与错位文字，右侧值格保持纯净空白 `""`；审计系统严禁将其判定为“开天窗”或“未剪枝缺陷”！
3. **模板受控留空门控标签 (Controlled Gated Labels)**：
   - 如 Section 8.1 的 `建议：` / `Recommendation:` 属于模板受控建议行（OW-134）；
   - 源文档有建议（如“污染的手套应废弃。”）必须填入，无源建议时保留标签、清空值格，严禁臆造，严禁删行。

### 2.10 标点符号纯度与中西文严格隔离公理 (Punctuation Purity Axiom)
> **标点纯度铁律**：中文交付物必须全量使用中文全角标点，英文交付物必须全量使用西文半角标点，绝不允许混用或游离标点。
- **中文交付物标点规范**：
  1. 所有表格标签冒号及正文子标题冒号必须统一为全角中文冒号 `：`（U+FF1A），严禁使用半角西文冒号 `:`；
  2. 完整陈述句段落末尾必须规范闭合全角中文句号 `。`（U+3002），并列成分使用中文逗号 `，` 或顿号 `、`，括号使用全角括号 `（）`；
  3. 参数、数值、厚度与单位之间严禁残留游离的西文半角句点 `.`（如将“厚度≧0.4mm；穿透时间≧480min”误写为带有游离句点）；
  4. 名词性标签冒号后严禁添加多余句号（如“外观：”后绝不能出现“：。”）。
- **英文交付物标点与字符纯度规范**：
  1. 页眉版本号（`Version: V1.0`）、页脚及正文所有标签冒号必须采用西文半角冒号加单空格 `: `；
  2. 句子末尾使用标准半角句点 `.`，绝不允许残留任何中文全角冒号、句号或逗号；
  3. 度数符号规范：英文文档中绝对严禁使用汉字库全角符号 `℃`（U+2103），必须统一规范转换为西文国际标准 `°C`（U+00B0 + C）；
  4. 词法完整性：英文单词内部严禁出现排版断裂空格（如 `equ ipment` 必须规范为 `equipment`）。

### 2.11 中英事实同构与防外生底模编造公理 (Isomorphic Grounding & Anti-Fabrication Axiom)
> **同构防编造铁律**：英文交付物必须 100% 由中文事实同构派生（Sourced-Grounded Translation），严禁大模型借翻译之名注入通用 GHS 模板预训练外生话术。
- **外生话术零容忍**：严禁注入源文件未提及的消防员 SCBA 呼吸器、虚构危险分解产物、虚构环境排入土壤警告等；
- **核心安全指标保真**：源文档载明的核心安全指标（如 Section 10.3“避免0℃以下和超过70℃高温”）必须 1:1 精准翻译保留在 10.3（`Avoid low temperatures below 0°C and high temperatures above 70°C.`），严禁遗漏或用通用废话替代；
- **底模死标签彻底清除**：英文版必须按中文母版事实 1:1 动态装配，彻底剔除英文底模历史残留标签（如 Section 10 残留的 `Hazardous decomposition products:`）。

### 2.12 化工专业定性公理 (Chemical Domain Qualitative Invariant)
> **化工定性铁律**：在涂料与高分子化工原理中，固化剂（改性脂肪胺固化剂、异氰酸酯固化剂等）与乳液/分散体（水性环氧乳液、水性聚氨酯分散体等）属于完全对立的双组分反应物料（主剂组分与固化剂组分）。
- **分类匹配优先级**：在生成英文品名或定性分类时，必须建立严格的分类优先级规则，优先匹配 `/固化剂/`、`/curing agent/`、`/hardener/`，绝对严禁因品名含“环氧”二字就武断将环氧固化剂降级或误译为环氧乳液（`Waterborne epoxy emulsion`），必须输出 `Waterborne epoxy curing agent`。

---

## 三、 16 章节微观逐节审计规范与判定细则 (Section-by-Section Master Audit Specifications)

---

### Section 1: 化学品及企业标识 (Identification)

#### 1. 结构与行数契约
- **中文结构**：固定为 10 行标准表格结构：
  - Row 0: 章节标题 `1.物料及供应商标识`
  - Row 1: `1.1 产品名称：` | 值格 (按企业法定标准留空)
  - Row 2: `中文名称：` | 值格 (`[产品名] [型号]`)
  - Row 3: `化学品分类：` | 值格
  - Row 4: `1.2 产品使用建议和使用限制：` | 值格
  - Row 5: `1.3 供应商信息：` (通栏小标题)
  - Row 6: `供应商名称：` | 值格
  - Row 7: `供应商地址：` | 值格
  - Row 8: `电话：` | 值格
  - Row 9: `传真：` | 值格
- **英文结构**：固定为 9 行标准结构（Row 1 为 `1.1 Product name:`，Row 2 为 `Chemical category:`，与中文 1:1 对应）。
- **豁免边界**：中文版与英文版在 Section 1 允许存在法定行数与结构差异（中文 10 行含单独中文名称行，英文 9 行由国际格式规定），**严禁将此项合法差异判定为“中英文不一致”**。

#### 2. 核心判定标准与断言
- **型号精确覆写**：产品名称槽位必须精准包含目标型号，严禁残留其他型号（如把 EC-1804 写成 OS-9547）；
- **化工专业定性校验**：固化剂（改性脂肪胺固化剂等）英文品名必须为 `Waterborne epoxy curing agent [型号]` 或 `Waterborne curing agent [型号]`，绝对严禁误判或降级为乳液（`emulsion`）；
- **英文标题与版本号西文纯度**：Row 0 必须为标准西文加粗标题 `1. Identification`（严禁仅留 `Identification`）；页眉必须输出西文标准半角冒号 `Version: V1.0`（严禁中文全角冒号 `Version：V1.0`）；
- **用途英译定性守恒**：
  - “涂料用添加剂”必须精准英译为 `Additive for coatings.`（严禁泛化为 `Used in coatings` 而丢失“添加剂”定性）；
  - “粘合剂、涂料”精准英译为 `Used in adhesives and coatings.`；
- **实体隔离校验**：冠志版与国材版的供应商名称、地址、电话、传真必须 100% 对应各自实体，严禁错乱；
- **法定免检白名单 (INV-S1-01 / INV-S1-02)**：中文版 1.1 产品名称值格必须法定留空，型号与中文品名单空格拼接；严禁将“1.1 留空”误判为缺陷！

---

### Section 2: 危险性概述 (Hazards Identification)

#### 1. 双模态动态判定契约
- **模态 A：危化品模态 (Hazardous Chemical)**
  - 必须包含清晰的 2.1 分类与 2.2 标签要素；
  - 象形图、信号词（“危险”/“警告”）、H 声明（危险说明）与 P 声明（防范说明）必须完备；
  - 英文版信号词必须精准对应：中文“危险” $\rightarrow$ `Danger`，中文“警告” $\rightarrow$ `Warning`；
  - 严禁底模外生强塞未经源文件授权的 `2.3 其他危害：无适用资料。`；
  - **标点符号纯度**：若存在 2.3 其他危险，必须规范使用中文全角冒号 `2.3 其他危险：无适用资料。`（严禁西文半角冒号 `:` 或缺失冒号）。
- **模态 B：非危品/未分类缺省模态 (Non-Hazardous / Default Mode)**
  - GHS 危险性类别标明“根据 GHS 不属于危险物”或“无”；
  - **象形图与信号词缺省展示准则 (INV-S2-02)**：源文档未提及 GHS 象形图或信号词时，系统默认显式展示：
    * 中文版：`GHS象形图：无`，`信号词：无`；
    * 英文版：`GHS pictograms: None`，`Signal word: None`；
    * 此项属于标准缺省展示，遵循一切内容以源文件事实为主原则，审计系统严禁误报为“外生捏造”或“多余标签”；
  - 英文版严禁出现任何危化品残留词汇：`assert(!/H412|H315|H332|H317|Category/i.test(enText))`；
  - 英文危险性说明必须标准化输出：`Not classified as a hazardous chemical according to GHS.` 与 `No known significant effects or critical hazards.`；
  - **法定免检白名单 (INV-S2-01)**：非危品不设象形图与信号词（写“无”）属于法定合规表现，严禁误报为漏报或缺陷。

---

### Section 3: 成分/组成信息 (Composition / Ingredients)

#### 1. 结构与几何契约
- **行数与组分 1:1 守恒**：中文表格的组分行数与英文表格的组分行数必须绝对相等（`cnSec.rows.length === enSec.rows.length`）；
- **3 列标准网格**：表头必须为 `化学品名称 | CAS编号 | %（w/w）`，英文对应 `Chemical name | CAS NO. | Concentration % (w/w)`；
- **边框保护**：动态增行（如从底模 2 行增至 4 行）时，首行顶框和末行底框必须为实线，内部水平和垂直线必须为统一虚线；
- **子标题跨列合并消除空白单元格**：Table 3 Row 2（`成分` 或 `3.2 Ingredients:`）必须在底层 DOM 中执行跨列单元格合并（`gridSpan=3`, 宽度 `9781` dxa），彻底消除子标题右侧出现空白开天窗单元格的排版缺陷。

#### 2. 核心判定标准与断言
- **商业机密保护**：若 CAS 标明“商业机密”，英文必须标准化翻译为 `Trade secret` 或 `Confidential`；
- **CAS 统一规范定名**：
  - CAS `28182-81-2` 英文必须统一定名为 `Hexamethylene diisocyanate homopolymer`；
  - CAS `7732-18-5` 英文统一定名为 `Water`；
- **浓度数值保真**：源文档的波浪号、正负号（如 `50±5`、`80±2%`）必须 100% 保真覆写，严禁漏掉百分号或公差。

---

### Section 4: 急救措施 (First Aid Measures)

#### 1. 核心判定标准
- **四大接触途径必须完备**：必须同时包含 4.1 一般措施、4.2 误服（食入）、4.3 接触眼睛、4.4 接触皮肤、4.5 吸入；
- **关键医学救护指引保真**：
  - 误服催吐禁令：“禁止催吐”必须精准英译为 `Do NOT induce vomiting.`；
  - 冲洗时间：“冲洗（至少10分钟）”必须精准英译为 `flush with plenty of warm water for at least 10 minutes.`；
  - 就医指引：必须包含 `seek medical attention / advice`；
- **标点闭合**：每一途径陈述末尾，中文必须闭合全角句号 `。`，英文必须闭合西文半角句点 `.`。

---

### Section 5: 消防措施 (Fire Fighting Measures)

#### 1. 核心判定标准
- **合适与不合适灭火剂逻辑排他**：
  - 5.1 合适的灭火剂（二氧化碳、泡沫、灭火粉末、水喷雾）；
  - 5.2 不合适的灭火剂（高流量水喷射、高压水枪）；
  - 审计断言：`5.1 与 5.2 灭火剂内容绝对严禁相同或重叠`！
- **燃烧产物保真与 5.3/5.4 独立解耦**：
  - 5.3 燃烧分解产物（一氧化碳、二氧化碳、氮氧化物、氰化氢等）中英文必须一一对应；
  - 5.4 消防预防措施与保护设备必须独立英译源文件内容（如“在着火或爆炸情况下，不要吸进烟尘。” $\rightarrow$ `In case of fire or explosion, do not breathe fumes/smoke.`）；
  - **严禁强塞 SCBA 外生底模长句**：`assert(!/Firefighters must wear self-contained breathing apparatus/i.test(enSec5))`，绝对严禁将未经源文件授权的消防员空气呼吸器等口水话硬编码进 5.4！

---

### Section 6: 泄漏应急处理 (Accidental Release Measures)

#### 1. 核心判定标准
- **三层防护结构完备**：必须完备包含 6.1 个人防护措施、6.2 环境保护措施、6.3 消除与收集方法；
- **底模错位排查**：严禁残留底模中因表格合并错位产生的“灭火设备”或“急救”标签。

---

### Section 7: 操作处置与储存 (Handling and Storage)

#### 1. 核心判定标准
- **双小节结构**：必须清晰包含 7.1 安全操作防范与 7.2 安全储存条件；
- **温控与避光要求保真**：若源文档包含特定温控范围（如 5-35℃ 或避免霜冻），交付物中英文数值必须完全一致；
- **标点闭合**：操作与储存指引末尾必须规范闭合句点。

---

### Section 8: 接触控制/个体防护 (Exposure Controls / Personal Protection)

> [!CAUTION]
> **本章节为历史外生口水话泄露、虚假组分强塞与标签开天窗的最高发重灾区，执行最高级别严审！**

#### 1. 结构与行数同构律
- **有接触限值产品 (With OEL)**：保持 15 行标准结构（包含“工作场所组分控制参数”通栏题头与“物质 | 依据 | 类型 | 数值” 4 列表格）；
- **无接触限值产品 (No OEL)**：必须彻底剪枝四列表格与通栏题头，严格收敛为 12 行纯净事实；
- **手部防护唯一父级分类题头与受控建议行绝对存活律 (12 行对称同构律)**：
  - Section 8.1 的“手部防护：”为下属手套材料规格（EN 374-3、FKM、IIR、NBR 等）的唯一父级分类题头，绝对不可整行删除（严禁 `deleteRow`）！值格无独立一句话陈述时保持纯净空白 `""`，彻底清除单元格内历史错位文字；
  - **排版字号一致性**：中文版“手部防护：”字号必须与同章节其他三项防护（呼吸系统防护、眼睛防护、身体防护）保持一致，统一为 `w:sz="24"`（小四号宋体加粗），缩进为 `w:firstLine="482"`，右侧值格无多余悬挂缩进；
  - Section 8.1 的“建议：”属于模板受控建议行（OW-134），源文档有建议（如“污染的手套应废弃。”）必须填入，无源时保留标签清空值格，绝对不可剪枝；
  - 无接触限值时，中文表格与英文表格行数必须严格同构收敛为标准的 12 行（`cnS8.rows.length === 12 && enS8.rows.length === 12`）。

#### 2. 外生口水话绝对零容忍硬门禁 (Zero Boilerplate Invariant)
- **工程控制口水话拦截器**：
  - 中文绝对严禁残留底模占位长句：`assert(!/使用局部排风或全面通风|低于职业接触限值|洗眼器与安全淋浴设施/i.test(cnText8))`；
  - 英文绝对严禁残留硬编码长句：`assert(!/Use local exhaust or general ventilation|eyewash and safety shower/i.test(enText8))`；
  - 若源文档未提及工程控制，值格严格置空 `""`！
- **手部防护外生编造拦截器**：
  - 中文严禁凭空编造保底：`assert(!/建议戴上防护手套/i.test(cnText8))`；
  - 英文严禁凭空编造保底：`assert(!/Protective gloves are recommended/i.test(enText8))`；
  - 若源文档仅包含具体材料参数（EN 374-3、FKM、IIR、NBR），手部防护值格必须为空 `""`，材料参数独立成行保留！
- **眼睛防护文字篡改拦截器**：
  - 若源文档明文为“建议使用护目镜。”，中文写“建议使用护目镜。”，英文写 `Protective goggles are recommended.`；
  - 若源文档明文为“戴眼罩/面罩。”，中文必须写“戴眼罩/面罩。”，英文写 `Wear safety glasses/face shield.`；
  - **严禁无视源文档事实，在代码中硬编码暴力覆盖！**

#### 3. 标点符号纯度与数值参数规范
- **标签冒号统一**：`氟化橡胶 –FKM:` 西文冒号必须修正为中文全角冒号 `：`（`氟化橡胶 –FKM：`）；
- **参数数值去游离句点**：手套厚度与穿透时间末尾严禁残留游离句点（必须规范为 `厚度≧0.4mm；穿透时间≧480min`）。

#### 4. 4 列表格排版与虚假数据排除门禁
- **无接触限值商品虚假数据排除**：
  - 若源文档明文为“无可用的接触限值信息”或“不含有职业接触限值的物质”，**严禁残留底模中的“六亚甲基-1,6-二异氰酸酯 0.03 mg/m3”或“丙二醇甲醚醋酸酯 100 mg/m3”**！
- **4 列表格排版规范**：
  - 表头行（物质/依据/类型/数值 / Substance/Basis/Type/Value）：**必须水平居中，彻底去除末尾冒号**；
  - 数据行：**必须水平居中，常规字重 (`bold: false`)，无末尾冒号，字号 Arial 9.5pt**；
  - 空白行剪枝：未填充数据的空白 4 列行必须物理删除。

#### 5. 法定反直觉语义映射免检白名单 (INV-S8-01)
- 源文档 8.1 控制参数进模板 8.2 工程控制；源文档 8.2 暴露控制进模板 8.1 暴露控制。此为企业模板的法定语义映射，绝非颠倒，严禁指责为“层级颠倒”！

---

### Section 9: 理化特性 (Physical and Chemical Properties)

#### 1. 结构与行数 1:1 绝对守恒律
- **源文件底线保留准则 (INV-S9-01)**：遵循一切内容以源文件为主原则！在 Section 9 理化特性中，只要源文档存在该物理属性行，且原文对应值不是空值（即使文本为“无数据”、“无可用数据”、“不适用”、“未提供”、“未测定”、“No data available.”、“Not applicable”等），必须 100% 完整保留！严禁将有源支撑的“无数据”行机械删除，审计系统严禁将其误判为“无效残留行”或“未剪枝缺陷”；
- **行数与小节序号守恒**：中文行数与英文行数必须完全绝对一致（通常为 19 行：9.1 ~ 9.19）；
- **行序守恒公理**：严格服从源文档物理行序，绝对严禁擅自调整前后顺序（例如把闪点提前或把可燃性后移）。

#### 2. 核心判定标准与断言
- **激光垂线绝对对齐 (G-38)**：在 PDF 渲染中，全量指标的标签首字与冒号后数值的起始坐标必须激光对齐（标准坐标 x0=80.28pt 附近），杜绝波浪状参差不齐；
- **标签叠词粘连拦截器**：严禁出现由于正则替换不净导致的标签粘连叠词（如 `Appearance:Appearance:` 或 `Flash point:Flash point:`）；
- **相态与定性修饰词保真**：
  - 可燃性必须包含相态修饰语：`Flammability (solids, gases)`；
  - 闪点必须包含闭杯说明或条件：`(closed cup)` 或 `No flash point below initial boiling point`；
  - 粘度必须保留温度条件：如 `at 25 °C`；
- **TDS 核心理化指标覆写核销**：
  - 固含量（如 `80±2%` / `50±2%`）；
  - 粘度（如 `300±100 mPa·s` / `＜2000 mPa.s`）；
  - 外观（如 `无色至淡黄色透明粘稠液体` / `乳白液体`）；
  - 密度与 NCO 含量（若源文档或 TDS 包含，必须 100% 存在；源文档无则绝不强塞）。

---

### Section 10: 稳定性和反应性 (Stability and Reactivity)

#### 1. 核心判定标准
- **标准小节结构与连续递增编号**：必须从 10.1 开始连续递增编号（10.1, 10.2, 10.3...），严禁跳号（如 10.1 直接跳至 10.3 缺失 10.2）；
- **中英 100% 事实同构与温控指标保真**：
  - 源文档载明的核心操作安全指标（如“避免0℃以下和超过70℃高温”）必须 1:1 精准英译并保存在 10.3（`Avoid low temperatures below 0°C and high temperatures above 70°C.`），严禁遗漏或泛化；
- **英文模板底模残留彻底清除**：
  - 彻底删除英文模板残留的 `Hazardous decomposition products:` 虚构行，按中文母版事实 1:1 动态装配（10.1 稳定性、10.2 危害反应、10.3 避免条件）；
- **法定免检白名单 (INV-S10-01)**：源文档若缺失“应避免条件/禁配物”，对应行安全隐藏消失不留空行，属于企业法定规范，严禁误报为遗漏（但跳号属于真缺陷）。

---

### Section 11: 毒理学信息 (Toxicological Information)

#### 1. 双范式同构契约
- **范式一：通栏详述模式 (Paradigm 1 - Full Width)**：适用于非危复合豁免模态（合并通栏说明）；
- **范式二：标准 8 行插槽模式 (Paradigm 2 - Standard 8-Row Isomorphic)**：
  - Row 0: `11. 毒理学信息` / `11. Toxicity information`
  - Row 1: `该产品无可用的毒理学研究。` / `No toxicological studies were available for this product.`
  - Row 2: `类似产品的风险评估数据：` / `Toxicological data from risk assessment of similar products:`
  - Row 3: `11.1 急性毒性：` (经口 LD50 > 2000 mg/kg 等)
  - Row 4: `11.2 主要皮肤刺激性：` (无刺激 / No irritation)
  - Row 5: `11.3 主要粘膜刺激性：` (轻微刺激 / Slight irritation)
  - Row 6: `11.4 致敏性：` (皮肤接触不致敏 / Not sensitizing)
  - Row 7: `11.5 致突变性：` (AMES 试验无致突变性 / Non-mutagenic)

#### 2. 核心判定标准与断言
- **双语 8 行绝对同构**：中文 8 行，英文必须严格 8 行，1:1 槽位镜像对应；
- **异常行高与底模剪枝**：行高必须收敛为标准 285 twips (0.50cm)，严禁残留模板历史的 1169 twips (2.06cm) 畸形行高；
- **说明行未提及端点清除**：源文件未提及的致癌性、生殖毒性、特异性靶器官（STOT）、吸入危害等端点占位行，中英文必须同步物理删除，绝不可强塞空白或假端点；
- **翻译准确性**：主要粘膜刺激性英文必须为 `Primary mucosal irritation:`，**严禁误写为 `Primary eye irritation:`**；
- **名词性短语标点规范 (INV-S11-01)**：名词性短语末尾严禁强行追加多余句点。

---

### Section 12: 生态学信息 (Ecological Information)

#### 1. 核心判定标准
- **生态毒理语法合规**：
  - 严禁使用有语法病的英语词汇（如 `water courses`）；
  - 必须统一采用国际合规标准表达：`Do not discharge into drains, wastewater, or soil.`，排水用语必须为 `wastewater`；
- **非危品免责说明保真**：若源文档注明“根据生态毒理学资料，该产品被划分为对鱼类和水蚤无害类”，英文必须精准对应：`Based on ecotoxicological data, the product is classified as non-hazardous to fish and daphnia.`。

---

### Section 13: 废弃处置 (Disposal Considerations)

#### 1. 结构与几何契约
- **严格 4 行标准同构结构**：
  - Row 0: 章节标题 `13. 处理注意事项` / `13. Disposal considerations`
  - Row 1: 通栏说明行 1（遵守国家或当地法规废弃说明，9.5pt 常规体，强制左对齐，无缩进）
  - Row 2: 通栏说明行 2（欧洲废弃物分类 EWC 说明，9.5pt 常规体，强制左对齐，无缩进）
  - Row 3: `13.1 废弃处置方法：` | 具体处置方法段落
- **消除两端拉伸失真**：
  - Row 3 的处置方法内容单元格，XML 对齐属性必须为纯左对齐（`w:jc w:val="left"`）；
  - **严禁使用两端对齐 (`w:jc w:val="both"`)**，彻底消除少量文字被两端拉伸失真的排版瑕疵。

---

### Section 14: 运输信息 (Transport Information)

#### 1. 核心判定标准
- **三大国际运输规则完备**：必须完备列明 14.1 公路/铁路运输（ADG）、14.2 海运（IMDG）、14.3 空运（IATA）；
- **用户特殊注意事项 (14.4)**：
  - 非危品明确标识：`Not regulated as dangerous goods.`；
  - 温度范围保真：若源文档包含特定温控范围（如“温度不可高于+50℃，不可低于－5℃”），交付物中英文数值必须 100% 吻合（`Temperature must not exceed +50°C, and must not be below -5°C.`）；
  - 隔离要求：若源文档提及“远离食物、酸和碱”，英文必须完整体现：`Keep away from food, acids and bases.`。

---

### Section 15: 法规信息 (Regulatory Information)

#### 1. 核心判定标准
- **英文版导语行防断层补全**：
  - Row 1 必须完备输出导语 `Relevant safety, health and environmental regulations for the substance or mixture`（Arial 9.5pt 常规体），严禁出现空白断层行；
- **现行有效性正向演进 (INV-S15-01)**：
  - 英文版法规信息必须引用现行有效的国务院令第 591 号（`Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591`）；
  - 必须引用现行有效的 GB 30000 系列国标（`GB 30000.2-29 Rules for classification and labelling of chemicals`）；
  - 严禁倒退为已废止的 344 号令或 GB 20576 系列；
- **排除底模外生强塞法规**：
  - 若源文档仅列明 4 部法规，英文交付物**严禁从底模强塞未经源文件授权的第 5 部法规（如 GB 15258 化学品安全标签编写规定）**。

---

### Section 16: 其他信息 (Other Information)

#### 1. 核心判定标准
- **知识产权与免责声明保真**：完整保留免责声明、知识产权说明与修改记录说明；
- **排版合规**：单单元格通栏，字号 9.5pt，行距标准，与末页防纯空门禁咬合；
- **严禁重复供应商地址**：Section 16 严禁复制粘贴 Section 1 的供应商联系方式。

---

## 四、 中英文 16 章节逐行双语对照审计方法论 (Bilingual Line-by-Line Cross-Audit Methodology)

### 4.1 双语对称性总则与豁免边界
英文交付物不仅是中文交付物的翻译件，更是全球监管机构与跨国客户审视企业合规水平的法医级凭据。
- **总原则**：除法定豁免边界外，Section 2 至 Section 16 的表格行数、列数、参数插槽、小节编号必须**100% 绝对镜像对称（Isomorphic Parity）**；
- **法定豁免边界 (Statutory Variance Whitelist)**：
  1. **Section 1 结构差异**：中文版为国标四段式 10 行结构（含中文名称独立行与留空的 1.1 产品名称）；英文版为国际 GHS 9 行标准结构（1.1 Product name 直接承载专业英文品名与型号）。此项属于法定结构豁免，严禁判定为行数不一致；
  2. **文本排版与标点字体差异**：中文版全量使用宋体/黑体、12pt 小四正文、全角中文标点；英文版全量使用 Calibri/Arial、9.5pt/10pt 正文、半角西文标点与西文度数符号 `°C`。

### 4.2 16 章节双语对照判定矩阵

| 章节 | 中文核心特征 | 英文法定对照要求 | 违规判定依据 (一票否决) |
| :--- | :--- | :--- | :--- |
| **S1** | 10行标准表，1.1留空，中文名称承载品名 | 9行标准表，1.1承载品名与型号，专业化工定性 | 误判为乳液(emulsion)；版本号冒号全角 |
| **S2** | 象形图与信号词源未提默认显示“无” | Pictograms: None, Signal word: None | 外生编造2.3其他危害；残留危化品H声明 |
| **S3** | 3列表格，成分行数与CAS完全忠实原文 | 3列表格，行数绝对相等，3.2跨3列合并消除开天窗 | 英文行数不等于中文行数；CAS定名不规范 |
| **S4** | 四大接触途径完备，禁止催吐，冲洗10分钟 | Inhalation/Skin/Eye/Ingestion 完备，对应翻译 | 遗漏接触途径；丢失禁止催吐指引 |
| **S5** | 5.1合适与5.2不合适灭火剂逻辑排他 | 5.1与5.2灭火剂完全独立，严禁内容相同 | 5.1与5.2相同；强塞消防员SCBA长句 |
| **S6** | 个人防护、环境保护、消除方法三层完备 | 6.1~6.3对应翻译，消除底模灭火错位标签 | 残留灭火设备标签；丢失环境保护措施 |
| **S7** | 7.1操作与7.2储存，温控范围保真 | 7.1~7.2对应翻译，温度数值100%吻合 | 遗漏温控数值；缺少末尾句点 |
| **S8** | 无限值12行，手部防护加粗sz=24值格纯净空白 | 12行绝对同构，Hand protection加粗值格空白 | 误删手部防护父级题头；强塞局部排风口水话 |
| **S9** | 源文件底线保留（含无数据行），序号递增 | 行数1:1对称，序号9.1~9.x连续，激光对齐80.28pt | 机械删除无数据行；序号跳号；标签叠词 |
| **S10** | 10.1~10.3连续编号，源未提项安全隐藏 | 编号连续无跳号，温控指标保真，清除底模死标签 | 10.1直接跳10.3；残留分解产物虚构标签 |
| **S11** | 范式二标准8行，行高285twips，清除未提端点 | 严格8行对称，Primary mucosal irritation | 出现1169twips畸形行高；误译为eye irritation |
| **S12** | 生态毒理事实保真，非危品免责说明 | Do not discharge into wastewater, or soil | 使用语病词汇 water courses；篡改非危结论 |
| **S13** | 严格4行标准表，左对齐消除拉伸失真 | 严格4行标准表，w:jc="left" 纯左对齐 | 出现两端对齐拉伸失真；行数不为4行 |
| **S14** | ADG/IMDG/IATA完备，非危说明，温控保真 | 对应完备，Not regulated, 温度数值吻合 | 虚构未提及温度限制；遗漏隔离要求 |
| **S15** | 现行有效法规演进，国令591号，GB 30000 | Decree No. 591, GB 30000, 导语完备 | 引用废止344号令或GB 20576；强塞GB 15258 |
| **S16** | 免责声明与知识产权保真，单格通栏9.5pt | 对应翻译，排版规范，末页防纯空通过 | 最后一页纯空；重复复制供应商地址 |

### 4.3 双语机器对账算法与失配报警机制
集中式主审计引擎在执行双语对账时，采取以下三阶渐进比对算法：
1. **结构拓扑比对**：提取两份 DOCX 的 `records[sNum].rows.length`，除 Section 1 外强制相等；
2. **槽位标签比对**：遍历第 0 列标签文本，比对中英文对照词典是否吻合；
3. **语义指纹核销**：提取数值、CAS、温度、百分比与否定词（“无”、“未”、“禁止”），验证英文交付物中是否 100% 保真映射，若发现任何事实漂移，立即抛出 `[BILINGUAL_MISMATCH_ALARM]` 阻断。

---

## 五、 法定免检白名单基准库 (Legal Invariants Oracle & False-Positive Interception)

### 5.1 白名单核心作用机制
为防止审计系统将**企业既定合规规范与反直觉处理**误判为缺陷，系统设立机器级白名单基准库 `web/src/audit/legal-invariants-oracle.json`。  
任何审计脚本、Lint 或 Agent 在判定交付物缺陷时，必须无条件调用白名单进行过滤：**凡命中白名单条款与禁止指责话术库的项，严禁归类为缺陷，必须标记为 `[ORACLE_WHITELIST_PASS]` 予以豁免！**

### 5.2 权威白名单词条清册 (INV-01 ~ INV-11)

1. **INV-S1-01 (中文版产品名称值格法定留空)**：
   - 规范：1.1 产品名称右侧值格按企业法定惯例必须留空；型号与品名拼接于 1.2 中文名称。
   - 豁免：严禁指责“产品名称值格留空”或“首页第一项产品名称缺失”。
2. **INV-S1-02 (英文版 Product name 法定构成)**：
   - 规范：1.1 Product name 必须为已评审专业英文名 + 半角空格 + 型号。
3. **INV-S2-01 (非危品/未分类标签要素合法缺省)**：
   - 规范：非危险品无 GHS 象形图、无信号词属于法定正当表现。
4. **INV-S2-02 (Section 2 GHS 象形图与信号词缺省显式展示)**：
   - 规范：源文档未提象形图或信号词时，默认显式展示“GHS象形图：无”、“信号词：无” / “GHS pictograms: None”、“Signal word: None”。
   - 豁免：严禁指责“GHS象形图为无属于外生捏造”或“信号词为无属于多余标签”。
5. **INV-S8-01 (Section 8 反直觉语义对调)**：
   - 规范：源 8.1 控制参数进模板 8.2 工程控制；源 8.2 暴露控制进模板 8.1 暴露控制。此为企业模板法定结构。
   - 豁免：严禁指责“标题与层级严重颠倒”或“颠倒了国标层级”。
6. **INV-PRUNE-01 (唯一父级分类题头与普通标签二分法及免剪枝白名单)**：
   - 规范：普通叶子标签无值必须物理删行；而唯一父级分类题头（如“手部防护：”）统领下属规格行，值格无陈述时保留加粗标签、清空值格，绝对禁止删行！受控建议行（“建议：”）无源值格留空，严禁删行。
   - 豁免：严禁指责“手部防护未整行删除属于开天窗”或“父级标签右侧留空判定为未剪枝缺陷”。
7. **INV-S9-01 (Section 9 源文件底线保留与“无数据”合法存活)**：
   - 规范：只要源文档有该物理属性行且原文对应值不是空值（含“无数据”、“不适用”等），必须 100% 完整保留。
   - 豁免：严禁指责“保留无数据行属于未剪枝”或“Section 9 应该删减到12行”。
8. **INV-S10-01 (源文档缺失项整行安全隐藏抑制)**：
   - 规范：源文档缺失“应避免的条件/禁配物”，模板对应项直接安全隐藏消失不留空行。
9. **INV-S11-01 (名词性短语末尾不加多余句号)**：
   - 规范：名词性短语声明（如“刺激性：无资料”），末尾严禁强行追加多余句点。
10. **INV-S15-01 (现行有效法定法规自动更新合法性)**：
    - 规范：强制升级为国令 591 号与 GB 30000 系列，属于正向演进。
    - 豁免：严禁指责“法规升级为GB 30000属于篡改”。
11. **INV-BILANG-01 (中英文 16 章节逐行对齐与翻译精准性终审规范)**：
    - 规范：中英文除 Section 1 结构及标点字体差异外，Section 2~16 必须 100% 内容一致且翻译准确。

### 5.3 禁止指责话术库 (Forbidden Accusations Database)
审计系统内置违禁词正则库，一旦审计脚本或智能体试图抛出以下话术，系统立即触发 `FALSE_ACCUSATION_INTERCEPTED` 拦截并判定审计判定无效：
- `/产品名称值格留空|产品名称未填入型号|首页第一项产品名称缺失/`
- `/标题与层级严重颠倒|颠倒了国标层级|控制参数与暴露控制混淆/`
- `/手部防护未整行删除属于开天窗|唯一父级题头留存属于未完全剪枝|父级标签右侧留空判定为未剪枝/`
- `/保留无数据行属于未剪枝|Section 9 应该删减到12行|纯无数据属性行必须删除/`
- `/GHS象形图为无属于外生捏造|信号词为无属于多余标签/`
- `/法规升级为GB 30000属于篡改|采用现行有效法规属于外生编造/`

---

## 六、 集中式中央主审计引擎与审计操作 SOP (Central Master Audit Suite & Operations SOP)

### 6.1 集中式统一审计指令集
为彻底终结多脚本分散、型号硬编码与难以维护的混乱局面，系统将全部审计逻辑整合至**中央主审计引擎 `run_master_msds_audit.mjs`**。  
任何产品型号、任何批次的产出物交付前，必须无条件运行该统一指令：

```bash
# 集中式中央主审计统一指令 (全面覆盖十大全局不变量、16章节专属局部契约、双语1:1对照与Oracle白名单)
node web/scripts/run_master_msds_audit.mjs --model <产品型号> --targetDir <交付物目标目录> [--sourceDocx <源文档路径>]
```

- **参数说明**：
  - `--model`：目标产品型号（如 `EC-1804`, `OS-9547 PGDA80`, `PA-4780`, `PU-608` 等，引擎纯数据驱动，零硬编码特判）；
  - `--targetDir`：存放 8 份标准交付物的目标目录；
  - `--sourceDocx`（可选）：源文档 DOCX 完整路径，用于执行精确 1:1 事实物理对账。

### 6.2 1:1 双向物理核销清算表输出规范
审计通过后，必须出具包含以下标准化清算表格的交付凭证：

```text
====================================================================================================
                        MSDS 工业级交付物 1:1 双向物理核销清算表
====================================================================================================
产品型号: EC-1804
交付目录: F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804
源文档路径: F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804.docx
----------------------------------------------------------------------------------------------------
序号 | 审计维度 / 章节 | 事实指纹与法定契约 | 实测结论 [Measured] | 物理来源 / 坐标 | 判定结果
----+----------------+-------------------+---------------------+----------------+---------
01  | G-01 交付目录纯净 | 4 DOCX + 4 PDF 严格 8 份 | 8 份标准交付物无杂质 | 目标目录物理文件 | PASS
02  | G-36 时间戳同步性 | 同步修改时间差 < 300s | 实测差值 5.2s | fs.statSync.mtime | PASS
03  | G-37 PDF 渲染字号 | 英文说明行实际像素字号 9.50pt | 实测 9.50pt Arial | PyMuPDF 实测 | PASS
04  | G-38 S9 激光垂直对齐| 标签首字坐标绝对垂直对齐 | 实测 x0=80.28pt ±0.05| PyMuPDF 实测 | PASS
05  | G-40 末页防纯空门禁 | 末页主体文本块数量 > 0 | 末页主体块数 4 个 | PyMuPDF 实测 | PASS
06  | G-04 表格边框规范 | 外框实线 single，内框虚线 dotted | 16 表格外实内虚 100% | OOXML DOM | PASS
07  | G-06 标点符号纯度 | 中文全角冒号，英文半角冒号与 °C | 零游离半角冒号，零全角℃| OOXML DOM | PASS
08  | Section 1 标识 | 冠志国材物理隔离，化工固化剂定性 | Curing agent 完备，1.1留空| OOXML DOM | PASS (INV-S1-01)
09  | Section 2 危害概述 | 缺省显示象形图：无，信号词：无 | GHS象形图：无 / None | OOXML DOM | PASS (INV-S2-02)
10  | Section 3 组成信息 | 组分行数 1:1，3.2跨3列合并消除开天窗| 3.2 gridSpan=3 完备 | OOXML DOM | PASS
11  | Section 4 急救措施 | 四大途径完备，禁止催吐，就医指引 | 1:1 精准对照翻译 | OOXML DOM | PASS
12  | Section 5 消防措施 | 5.1与5.2灭火剂独立排他，零SCBA口水话| 逻辑排他，零外生编造 | OOXML DOM | PASS
13  | Section 6 泄漏应急 | 个人/环境/消除三层防护完备 | 零灭火错位标签 | OOXML DOM | PASS
14  | Section 7 储存处置 | 7.1与7.2双小节，温控避光保真 | 5-35℃ 100% 吻合 | OOXML DOM | PASS
15  | Section 8 接触防护 | 无限值12行，手部防护加粗sz=24值格空白| 12行同构，sz=24，零排风| OOXML DOM | PASS (INV-PRUNE-01)
16  | Section 9 理化特性 | 源底线存活无数据，序号9.1~9.x连续 | 行数1:1对称，零叠词 | OOXML DOM | PASS (INV-S9-01)
17  | Section 10 稳定性 | 10.1~10.3连续无跳号，温控保真 | 0-70℃ 保真，零死标签 | OOXML DOM | PASS (INV-S10-01)
18  | Section 11 毒理学 | 标准8行同构，行高285twips，粘膜刺激 | 8行镜像，Primary mucosal| OOXML DOM | PASS
19  | Section 12 生态学 | 生态毒理保真，规范用语 wastewater | 零 water courses 语病 | OOXML DOM | PASS
20  | Section 13 废弃处置| 4行标准结构，w:jc="left" 消除拉伸 | 4行严格对称，纯左对齐 | OOXML DOM | PASS
21  | Section 14 运输信息| ADG/IMDG/IATA完备，非危说明，隔离要求| 1:1 精准对照翻译 | OOXML DOM | PASS
22  | Section 15 法规信息| 国令591号，GB 30000系列，导语完备 | 现行有效升级，零强塞 | OOXML DOM | PASS (INV-S15-01)
23  | Section 16 其他信息| 免责声明与知识产权保真，单格通栏 | 排版规范，零地址重复 | OOXML DOM | PASS
24  | G-41~46 双语对照 | 16 章节逐行 1:1 语义与行数镜像对账 | 111 / 111 契约全绿 | OOXML DOM | PASS (INV-BILANG-01)
----------------------------------------------------------------------------------------------------
总检验断言数: 158 项 | 通过: 158 项 | 失败: 0 项 | 判定结果: 🏆 AUDIT_PASSED (退出码 0)
====================================================================================================
```

### 6.3 缺陷驳回与长效防线下沉闭环机制

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        缺陷驳回与自迭代闭环流程                        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 发现缺陷 ──> 立即签发 [AUDIT_REJECT] 驳回令，精准锚定文件与代码行号 │
│ 2. 生产重修 ──> 生产专员针对根因修正通用流水线，重新全量编译 8 份文件 │
│ 3. 二轮复审 ──> 审计端执行第二轮全量敌手审查，确认缺陷彻底根除         │
│ 4. 防线下沉 ──> 同类缺陷人工纠正两次，必须立刻下沉为：                 │
│                 • Layer 1: 架构状态机拦截 (如 cleanSlateTemplate 强制) │
│                 • Layer 2: 自动化 Lint 或双语保真断言 (新增 G 门禁)     │
│                 • Layer 3: 写入受管宪法与 CHANGELOG 知识库永久沉淀     │
└────────────────────────────────────────────────────────────────────────┘
```

---

> **结语**：本规范文档为 MSDS Studio 系统的最高法定审计宪法。任何单次任务、任何工程师或智能体在交付 MSDS 产出物前，均必须严格服从本规范之条款。
