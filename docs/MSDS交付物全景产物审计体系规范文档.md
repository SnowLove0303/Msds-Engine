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
  - [2.1 格式服从于原文与源文件事实底线公理 (Format Follows Source & Origin Traceability Invariant)](#21-格式服从于原文与源文件事实底线公理-format-follows-source--origin-traceability-invariant)
  - [2.2 工作流法定预清空第一步 (cleanSlateTemplate Pre-clear)](#22-工作流法定预清空第一步-cleanslatetemplate-pre-clear)
  - [2.3 全局表格边框统一规范 (Unified Table Border Invariant: 外实内虚)](#23-全局表格边框统一规范-unified-table-border-invariant-外实内虚)
  - [2.4 页眉页脚安全几何公理 (Footer Margin & Truncation Invariant)](#24-页眉页脚安全几何公理-footer-margin--truncation-invariant)
  - [2.5 多语言媒体资产纯度公理 (Multilingual Media Asset Purity)](#25-多语言媒体资产纯度公理-multilingual-media-asset-purity)
  - [2.6 双实体预设物理隔离公理 (Dual-Entity Isolation Invariant)](#26-双实体预设物理隔离公理-dual-entity-isolation-invariant)
  - [2.7 法规时效性正向演进公理 (Statutory Modernity Evolution Invariant)](#27-法规时效性正向演进公理-statutory-modernity-evolution-invariant)
  - [2.8 交付物时间戳同步与末页防纯空门禁 (Timestamp & Anti-Blank-Page)](#28-交付物时间戳同步与末页防纯空门禁-timestamp--anti-blank-page)
  - [2.9 标签类型严格二分法与唯一父级题头免剪枝白名单公理 (Label Dichotomy & Non-Prunable Skeleton)](#29-标签类型严格二分法与唯一父级题头免剪枝白名单公理-label-dichotomy--non-prunable-skeleton)
  - [2.10 文本格式、标点纯度与版面几何防拉伸公理 (Global Typography, Punctuation & Layout Invariant)](#210-文本格式标点纯度与版面几何防拉伸公理-global-typography-punctuation--layout-invariant)
  - [2.11 内容源于源文件事实底线与防外生编造公理 (Isomorphic Grounding & Anti-Fabrication Axiom)](#211-内容源于源文件事实底线与防外生编造公理-isomorphic-grounding--anti-fabrication-axiom)
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

    subgraph Phase2_Audit["两阶双轨审计体系 (Auditor Brain)"]
        direction TB
        subgraph Step1_Mechanical["第一阶：机械确定性硬阻断 (准入钥匙 1)"]
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

### 2.1 格式服从于原文与源文件事实底线公理 (Format Follows Source & Origin Traceability Invariant)
> **公理准则**：“基于模板的格式与基于源文件的内容做匹配，格式服从于原文；源文件是全宇宙唯一的黄金事实基准（Ground Truth）！”
- **事实原产地唯一性与 100% 可溯源性**：
  * 模板提供的是版面几何网格、标准字体与行距骨架，绝对不代表内容事实；
  * 交付物中出现的任何一个具体指标、技术参数、医学建议、危害定性、理化数据，**必须能在源文档中找到明确、无歧义的文字出处（可溯源性 100%）**；
  * 若源文件某章节只有叙述性说明行（例如“根据EC指令2006/121/EG,无可用的接触限值信息”），直接匹配到模板的说明行插槽，沿用模板格式；其余多余的空白数据行必须物理删除或剪枝，绝不可为了迁就模板表格而强行塞入捏造的假数据；
  * 严禁为了迁就模板结构而凭空捏造端点，严禁为了塞入内容而破坏模板几何总宽。
- **零外生凭空编造（外生口水话零容忍 - Zero Exogenous Hallucination）**：
  * 坚决杜绝大模型借“翻译”或“安全常识”之名，向交付物中注入来自预训练常识库的通用套话（如消防员 SCBA、局部排风通风长句、建议戴手套、2.3 其他危害套话等）；
  * 发现任何一处外生口水话，判定为【严重外生捏造违规】，一票否决！
- **零擅自机械裁剪（源事实“无数据”实验事实 100% 存活 - Zero Arbitrary Pruning）**：
  * 化工规范中的“无数据”、“不适用”、“未提供”是技术人员经过严肃检测和论证后得出的正式科学事实与实验结论，绝非空无一物的占位符！
  * 若源文件明确写出了某项理化特性（如 Section 9 中的各项指标）为“无数据”或“不适用”，**交付物必须 100% 完整保留该项指标行**，绝对严禁以“没有实际数值”为由擅自机械删行！
  * 只有当**源文件压根没有提及该物理属性**时，才属于底模历史占位符，此时才执行物理整行删除 (`deleteRow`)。
- **1:1 物理事实指纹与数值严格保真**：
  * 测试数值、公差范围（如 `50±5 %`、`80±2%`、`0℃以下和超过70℃`、`至少10分钟`、`5-35℃`）必须原样保真，禁止四舍五入或随意篡改；
  * CAS 编号、化学品定性描述必须中英文 1:1 严格对齐，零跳号、零遗漏。

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

### 2.10 文本格式、标点纯度与版面几何防拉伸公理 (Global Typography, Punctuation & Layout Invariant)
> **排版与格式铁律**：文本格式直接决定交付物的工业严谨性与法律权威，必须实现标点纯度绝对隔离、字阶层级严格受控、段落几何彻底消除两端拉伸失真。
- **中文交付物标点与格式规范**：
  1. 所有表格标签冒号及正文子标题冒号必须 100% 统一为全角中文冒号 `：`（U+FF1A），绝不允许出现半角西文冒号 `:`；
  2. 完整陈述句段落末尾必须规范闭合全角中文句号 `。`（U+3002），并列成分使用中文逗号 `，` 或顿号 `、`，括号使用全角括号 `（）`；
  3. 参数、数值、厚度与单位之间严禁残留游离的西文半角句点 `.`（如将“厚度≧0.4mm；穿透时间≧480min”误写为带有孤立句点）；
  4. 名词性标签冒号后严禁添加多余句号（如“外观：”后绝不能出现“：。”）。
- **英文交付物标点、字符与度数规范**：
  1. 页眉版本号（`Version: V1.0`）、页脚及正文所有标签冒号必须采用西文半角冒号加单空格 `: `；
  2. 句子末尾使用标准半角句点 `.`，绝不允许残留任何中文全角冒号、句号或逗号；
  3. **度数符号硬门禁**：英文文档中绝对严禁使用汉字库全角符号 `℃`（U+2103），必须统一规范转换为西文国际标准 `°C`（U+00B0 + C）；
  4. 词法完整性：英文单词内部严禁出现排版断裂空格（如 `equ ipment` 必须规范为 `equipment`）。
- **字号字阶与加粗层级规范**：
  1. 一级章节与父级分类题头（如 Section 8.1 “手部防护：”）必须统一为小四加粗 `w:sz="24"` (12pt Bold)；
  2. 普通数据单元格与值格正文统一为五号 `w:sz="21"` (10.5pt Regular)；
  3. 说明行与通栏免责声明统一为小五号 `w:sz="19"` (9.5pt Regular)；
  4. 严格区分加粗边界：只加粗标签和题头，具体填入的值格必须为普通字体（常规粗细），严禁将整行或数值错误加粗。
- **单元格纯左对齐与版面几何防拉伸**：
  1. **多行叙述性单元格纯左对齐 (`w:jc w:val="left"`)**：特别针对 **Section 13（废弃处置）**、Section 4、Section 6、Section 7 中的多行文本，必须强制设置为 `w:jc w:val="left"`（纯左对齐）；
  2. **严禁使用两端对齐 (`w:jc w:val="both"`)**！在 Word/WPS 中，两端对齐会导致最后一行只有几个词时被强行横向拉扯占满整行，造成极其丑陋的巨大单词间距与排版失真；
  3. **跨列合并 (`gridSpan`)**：Section 3.2 子标题行必须设置 `gridSpan=3`，消除右侧多余的空白单元格。

### 2.11 内容源于源文件事实底线与防外生编造公理 (Isomorphic Grounding & Anti-Fabrication Axiom)
> **同构防编造铁律**：英文交付物必须 100% 由中文事实同构派生（Sourced-Grounded Translation），严禁大模型借翻译之名注入通用 GHS 模板预训练外生话术。
- **外生话术零容忍**：严禁注入源文件未提及的消防员 SCBA 呼吸器、局部排风通风长句、建议戴手套套话、虚构危险分解产物、虚构环境排入土壤警告等；
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
- **模态 B：非危品/未分类模态 (Non-Hazardous Mode)**
  - GHS 危险性类别标明“根据 GHS 不属于危险物”或“无”；
  - **源文件零外生虚增最高公理 (INV-ZERO-EXOGENOUS)**：
    * 遵循一切内容源于源文件全局事实底线公理！源文档未提及 GHS 象形图或信号词时，交付物**绝对严禁**擅自凭空添加 `GHS象形图：无` 与 `信号词：无`（英文版亦严禁凭空添加 `GHS pictograms: None` 与 `Signal word: None`）；
    * “没有”就是“没有”，不展示任何象形图与信号词标签行才是唯一合法表现！擅自强塞“无”或“None”同样属于严重的外生凭空捏造与标签污染缺陷；
    * 防范说明若只有单纯 P 声明，严禁外生增加未经源文档授权的分类小标题（如 `预防措施：`、`废弃处置：`）；
  - 英文版严禁出现任何危化品残留词汇：`assert(!/H412|H315|H332|H317|Category/i.test(enText))`；
  - 英文危险性说明必须标准化输出：`Not classified as a hazardous chemical according to GHS.` 与 `No known significant effects or critical hazards.`；
  - **法定免检白名单 (INV-S2-01)**：非危品源文档无象形图与信号词时交付物不予显示，属法定忠实原文表现，严禁误报为遗漏或缺陷。

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

#### 1. 暴露控制双范式判定契约
- **范式 A：无接触限值商品范式 (Non-OEL Model - 12 行标准)**
  - 表格行数收敛为严格 12 行；
  - 绝对严禁残留底模中的“工作场所组分控制参数”题头或虚假六亚甲基二异氰酸酯数据；
  - Row 1 英文必须使用标准 9.50pt 说明行：`According to EC Directive 2006/121/EC, no occupational exposure limit is available.`；
- **范式 B：有接触限值商品范式 (OEL Model - 15 行标准)**
  - 完整呈现工作场所控制参数、中文/英文容许浓度（PC-TWA / PC-STEL）及 MAC。

#### 2. 父级题头与个体防护核心判定
- **“手部防护：”唯一父级分类题头免删行白名单 (INV-PRUNE-01)**：
  - 该行为唯一父级分类题头，统领下属 4 行手套材质明细；
  - 源文档无独立通用一句话陈述时，加粗保留题头（字号 `w:sz="24"` 小四宋体），清洗单元格脏数据，右侧值格保持纯净空白；
  - **绝对严禁物理整行删除（`deleteRow`）**！严禁将“留空题头”误判为开天窗或未剪枝！
- **反口水话排他审计**：
  - 严禁强塞局部排风工程控制套话：`assert(!/使用局部排风或全面通风设施|低于职业接触限值|洗眼器与安全淋浴/i.test(sec8Text))`；
  - 严禁强塞建议戴手套套话：`assert(!/建议戴上防护手套|Protective gloves are recommended/i.test(sec8Hand))`；
- **眼睛防护事实保真**：源文档若为“建议使用护目镜”，英文必须忠实翻译为 `Protective goggles are recommended.`，严禁擅自篡改；
- **受控留空门控标签 (INV-S8-02)**：Row 9 `建议：` / `Recommendation:`，源文档无建议时保留标签、清空值格，严禁擅自删行。

---

### Section 9: 理化特性 (Physical and Chemical Properties)

#### 1. 核心判定标准与断言
- **源事实底线与“无数据”存活准则 (INV-S9-01)**：
  - 凡源文档明确载明且标注为“无数据”或“不适用”的属性，**交付物必须 100% 完整保留（行存活）！**
  - 中文写“无数据”/“不适用”，英文写 `No data available.` / `Not applicable.`；
  - **严禁机械删除**！严禁误报为未剪枝；
- **小节编号连续性**：序号必须从 9.1 至 9.x 严格连续递增，绝无跳号，绝无标签叠词粘连；
- **TDS 实测指标覆写保真**：外观、气味、固含量、粘度、密度必须优先按源文档和 TDS 实测值覆写；
- **中英文行数对称**：中英文表格行数必须绝对相等。

---

### Section 10: 稳定性和反应性 (Stability and Reactivity)

#### 1. 核心判定标准
- **编号连续递增**：必须为 10.1, 10.2, 10.3 连续递增，严禁跳号；
- **核心操作安全指标保真**：源文档明确的温控限制（如“避免0℃以下和超过70℃高温”）必须 100% 精准英译在 10.3（`Avoid low temperatures below 0°C and high temperatures above 70°C.`）；
- **英文底模死标签彻底清除**：严禁残留 `Hazardous decomposition products:` 等历史死标签；
- **受控安全隐藏 (INV-S10-01)**：源文档未提及禁配物时安全隐藏，严禁留空行。

---

### Section 11: 毒理学信息 (Toxicological Information)

#### 1. 结构与几何契约
- **范式二标准 8 行插槽**：
  - Row 0: 章节标题 `11. 毒理学信息`
  - Row 1: 导语行 `该产品无可用的毒理学研究。`
  - Row 2: 急性经口毒性
  - Row 3: 急性经皮毒性
  - Row 4: 急性吸入毒性
  - Row 5: 皮肤刺激
  - Row 6: 眼睛刺激
  - Row 7: 主要粘膜刺激 / 致敏性
- **行高收敛**：全表行高收敛为 285 twips (0.50cm)，彻底消除底模历史遗留的 1169 twips (2.06cm) 畸形大行高；
- **专业英译保真**：主要粘膜刺激性必须精准英译为 `Primary mucosal irritation:`，**严禁误写为 `eye irritation`**；
- **中英文 8 行绝对镜像**：中英文行数严格等于 8 行。

---

### Section 12: 生态学信息 (Ecological Information)

#### 1. 核心判定标准
- **排水用语国际规范**：排水用语规范为 `wastewater`，**严禁使用有语法病的 `water courses`**；
- **非危生态结论保真**：忠实源文档结论（“根据生态毒理学资料，被划分为对鱼类和水蚤无害类”）；
- **标点闭合**：中文闭合全角句号，英文闭合半角句点。

---

### Section 13: 废弃处置 (Disposal Considerations)

#### 1. 核心判定标准与几何契约
- **标准 4 行结构**：严格等于 4 行（标题 + 法律法规遵从行 + EWC 欧洲废弃物说明行 + 处置方法）；
- **纯左对齐排版规范 (INV-S13-01)**：Row 3 处置方法单元格在底层 XML 中必须强制设置为 `w:jc w:val="left"`（纯左对齐），**彻底杜绝两端对齐 (`both`) 导致的横向单词暴力拉伸失真**。

---

### Section 14: 运输信息 (Transport Information)

#### 1. 核心判定标准
- **三大规则完备**：ADG（公路/铁路）、IMDG（海运）、IATA（空运）三大国际规则必须完备；
- **非危定性保真**：全量标明 `Not regulated as dangerous goods.`；
- **温控与隔离要求保真**：若源文档包含特定温控（如“不可高于+50℃，不可低于－5℃”）或食品酸碱隔离要求，必须 100% 准确保留。

---

### Section 15: 法规信息 (Regulatory Information)

#### 1. 核心判定标准
- **导语行完备**：英文版 Row 1 必须完备呈现导语行；
- **现行有效性正向演进 (INV-S15-01)**：强制正向演化升级为现行有效的**国务院令第 591 号**与 **GB 30000 系列国标**，严禁倒退为已废止的 344 号令或 GB 20576 系列；
- **反外生强塞**：源文档列明几部法规，交付物输出几部，严禁从底模强塞未经授权的多余法规（如未提及的 GB 15258）。

---

### Section 16: 其他信息 (Other Information)

#### 1. 核心判定标准
- **免责声明完备**：单格通栏，标准 9.5pt 字号；
- **反重复套话**：严禁重复复制 Section 1 供应商地址；
- **PDF 末页防纯空咬合 (G-40)**：最后一页必须包含 Section 16 的实质主体文本，严禁产生仅剩页眉页脚的纯空白尾页。

---

## 四、 中英文 16 章节逐行双语对照审计方法论 (Bilingual Line-by-Line Cross-Audit Methodology)

### 4.1 双语对称性总则与豁免边界
除了 Section 1 允许中国国标四段式（10 行）与国际标准（9 行）的合法结构豁免外，**Section 2 至 Section 16 必须保证表格行数、参数槽位与定性陈述 100% 绝对镜像对称**！

### 4.2 16 章节双语对照判定矩阵
| 章节 | 中文版核心特征 | 英文版对应核心特征 | 对称性与定性铁律 |
| :--- | :--- | :--- | :--- |
| **S1** | 10 行, 1.1 法定留空, 1.2 中文名称 | 9 行, 1.1 Product name 直接承载型号 | 法定结构豁免, 品名必须体现固化剂 (curing agent) |
| **S2** | 象形图/信号词非危缺省显示“无” | Pictograms/Signal word 缺省显示 None | 绝对禁止危化品 H 声明残留, 禁外生 2.3 |
| **S3** | $N$ 行组分, 3.2 跨列合并消除开天窗 | $N$ 行组分, 3.2 gridSpan=3 合并 | CAS 与浓度公差 100% 对应, 禁行数不对称 |
| **S4** | 四大急救途径完备, 禁止催吐 | 4 exposure routes, Do NOT induce vomiting | 关键医疗救护指引 100% 保真 |
| **S5** | 5.1 与 5.2 灭火剂排他, 5.4 避免吸入烟尘 | 5.1/5.2 exclusive, 5.4 independent translation | 绝对禁止通用消防 SCBA 外生套话 |
| **S6** | 个人/环境/消除三层防护完备 | 3-tier protection, wastewater compliance | 杜绝底模错位合并标签 |
| **S7** | 7.1 与 7.2 双小节, 温控数值保真 | 7.1/7.2 dual subsections, °C symbol purity | 英文度数严禁汉字库 ℃, 必须为 °C |
| **S8** | 12 行, 手部防护加粗题头存活, 建议留空 | 12 rows, Hand protection header, Recommendation | 父级题头免删行白名单, 禁局部排风与戴手套套话 |
| **S9** | 9.1~9.x 连续递增, 100% 保留源事实无数据 | 9.1~9.x sequential, 100% retain No data | 遵循源文件事实为主, 严禁机械裁剪 |
| **S10**| 10.1~10.3 连续递增, 温控极限保真 | 10.1~10.3 sequential, 0°C to 70°C preserved | 编号严禁跳号, 彻底清除底模死标签 |
| **S11**| 范式二 8 行, 行高 285 twips, 粘膜刺激 | 8 rows isomorphic, Primary mucosal irritation | 粘膜刺激严禁误译为眼刺激 (eye irritation) |
| **S12**| 排水用语规范, 非危生态结论保真 | wastewater used, water courses strictly banned | 严禁有语病的 water courses |
| **S13**| 4 行结构, 处置方法纯左对齐 | 4 rows, w:jc="left" pure left-alignment | 彻底消除两端对齐 (both) 横向拉伸失真 |
| **S14**| ADG/IMDG/IATA 三大规则完备 | 3 rules, Not regulated as dangerous goods | 温控与隔离要求 100% 保真 |
| **S15**| 现行国令 591 号, GB 30000 现行国标 | Decree 591, GB 30000 series, lead paragraph | 现行有效性正向演进, 禁倒退已废止法规 |
| **S16**| 单格通栏 9.5pt, 免责声明保真 | Single cell 9.5pt, PDF anti-blank page | 末页主体文本充实, 禁空白末页 |

### 4.3 双语机器对账算法与失配报警机制
系统在中央主审计引擎（`web/scripts/run_master_msds_audit.mjs`）中集成自动双语行数与槽位对账断言：
```javascript
// G-41 至 G-46 双语对照机器断言
for (let secNum = 2; secNum <= 16; secNum++) {
  const cnRows = getSectionTableRows(cnDocx, secNum);
  const enRows = getSectionTableRows(enDocx, secNum);
  if (cnRows.length !== enRows.length) {
    throw new Error(\`[BILINGUAL_ROW_MISMATCH] Section \${secNum} 行数不一致: CN=\${cnRows.length}, EN=\${enRows.length}\`);
  }
}
```

---

## 五、 法定免检白名单基准库 (Legal Invariants Oracle & False-Positive Interception)

### 5.1 白名单核心作用机制
为根除机械脚本将“规定动作”误判为“质量缺陷”的系统性假阳性顽疾，本体系设立法医级白名单 Oracle（`legal-invariants-oracle.json`）：

### 5.2 权威白名单词条清册 (INV-01 ~ INV-11)
1. **INV-S1-01 (中文 1.1 产品名称值格留空)**：中文版 1.1 产品名称右侧单元格为空白，属企业法定版面规范，严禁报开天窗；
2. **INV-S1-02 (中英文 Section 1 结构差异豁免)**：中文 10 行含单独中文名称行 vs 英文 9 行国际通用表，属标准差异，严禁报行数不对称；
3. **INV-S2-01 (非危品危险性概述不设象形图与信号词)**：非危化学品源文档未载明象形图与信号词时交付物不展示，属忠实原文法定表现，严禁报遗漏；
4. **INV-ZERO-EXOGENOUS (源文件零外生虚增最高公理与标签要素忠实守恒规范)**：源文档未提及或未授权的字段、标签或分类要素，交付物绝对严禁擅自凭空添加！源文档未提象形图与信号词时严禁强塞“GHS象形图：无”或“信号词：无”（擅自加“无”亦属外生捏造）；未提细分防范标签时严禁强塞“预防措施：”/“废弃处置：”空标题！
5. **INV-PRUNE-01 (唯一父级分类题头免剪枝白名单)**：Section 8.1 “手部防护：”加粗统领下属 4 行手套明细，无单句陈述时保留加粗题头、值格空白，严禁删行，严禁报开天窗；
6. **INV-EDITOR-IMMUTABLE (通用编辑器底层设计令牌与不可变排版投影公理)**：通用编辑器底层确立内容与排版严格物理隔离公理。上层业务代码只允许调用受控原语写入纯文本事实，严禁在局部私自指定或篡改字阶与字体；所有 16 个章节的值格统一受控于全局设计令牌（中文 12pt 宋体常规体，英文 9.5pt Arial 常规体），并在导出前由全局排版投影引擎 applyGlobalTypographyProjection 一键强制同化，彻底杜绝跨章节字阶断层与审计误导；
7. **INV-S8-01 (Section 8 工程控制法定映射与值格字阶字体全局均一性规范 INV-FONT-UNIFORMITY)**：8.2 工程控制单元格填报职业接触限值说明（如“根据EC指令2006/121/EG,无可用的接触限值信息”）属于企业母版法定合规映射；全篇各章节值格必须严格执行字体族与字阶全局均一性规范 (INV-FONT-UNIFORMITY)：中文版 Table 8 必须与全篇各章节值格保持高度一致，统一为小四号 12pt (sz="24") 宋体常规体；英文版 Table 8 必须与全篇各章节值格保持高度一致，统一为五号 9.5pt (sz="19") Arial 常规体，严禁 Section 8 孤立出现与全篇脱节的字号与字体格式断层；
7. **INV-S8-02 (Section 8 建议行受控留空)**：Row 9 “建议：”无源建议时保留标签、值格留空，严禁擅自删行；
8. **INV-S9-01 (Section 9 遵从源文件内容底线与“无数据”存活)**：源文件载明为“无数据”或“不适用”的指标行，交付物 100% 完整保留，严禁机械删除至 12 行；
9. **INV-S10-01 (Section 10 禁配物受控安全隐藏)**：源文件未提禁配物时安全隐藏整行，不留空白行，完全合规；
10. **INV-S11-01 (Section 11 名词性短语声明手做母版原貌)**：名词性短语（如“刺激性：无资料”）末尾不带句点，完全合规；
11. **INV-S15-01 (Section 15 法规现行有效性正向演进)**：现行国务院令第 591 号与 GB 30000 替代已废止的 344 号令与 GB 20576，属强制正向升级，严禁报篡改。

### 5.3 禁止指责话术库 (Forbidden Accusations Database)
审计端严禁出具以下包含认知误区的指责：
- ❌ 禁言：“Section 8.1 手部防护值格为空，属于未剪枝开天窗缺陷！”（反驳：父级题头免删，删了手套错位！）；
- ❌ 禁言：“Section 9 包含无数据行，应该全部删除收敛至 12 行！”（反驳：源文件明确记录无数据，丢弃属于篡改实验事实！）；
- ❌ 禁言：“Section 2 忠实源文档未虚增象形图和信号词，属于标签要素遗漏！”（反驳：源文档未提及，零虚增不展示是唯一真理！）；
- ❌ 禁言：“Section 8 Table 8 值格应当被降级为 10.5pt 细体！”（反驳：严重认知偏差！中文版全篇 16 章节值格统一为小四号 12pt 宋体加粗，英文版统一为五号 9.5pt Arial，严禁 Section 8 孤立降级产生字阶断层！）；
- ❌ 禁言：“中文版 10 行而英文版 9 行，属于双语行数不对称缺陷！”（反驳：Section 1 享有国际与国标法定差异豁免权！）。

---

## 六、 集中式中央主审计引擎与审计操作 SOP (Central Master Audit Suite & Operations SOP)

### 6.1 集中式统一审计指令集
全系统废弃散落的各型号单次审计脚本，统一收敛为中央主审计引擎：
```bash
# 集中式中央主审计命令 (覆盖全局 + 16 章节 + PDF 实测 + 双语对账 + 125 项断言)
npm run audit:master -- --model="EC-1804" --dir="算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804"
```

### 6.2 1:1 双向物理核销清算表输出规范
终审报告必须以标准 Markdown 清算矩阵输出：
```markdown
| 章节 | 关注维度 / 疑点 | 源事实与法定契约 | 交付物实测文本与结构 | Agent 认知辨析与裁判原由 | 判定结果 |
| :--- | :--- | :--- | :--- | :--- | :---: |
| 全局 | 标点纯度与隔离 | 中文全角/英文西文 | 中文全角：。/英文: . | 零游离点与半角冒号混用 | 🏆 PASS |
| 全局 | 度数符号纯度 | 英文标准 °C | 0°C to 70°C 保真 | 彻底杜绝汉字库 ℃ 混入 | 🏆 PASS |
| 全局 | 版面排版防拉伸 | S13 废弃处置排版 | w:jc w:val="left" | 纯左对齐彻底消灭横向暴力拉伸 | 🏆 PASS |
| 全局 | 事实底线可溯源 | 100% 源自源文件 | 无 SCBA / 局部排风套话 | 成功拦截所有大模型外生预训练套话 | 🏆 PASS |
```

### 6.3 缺陷驳回与长效防线下沉闭环机制
- 若审计发现任何未在白名单中的真实缺陷（如外生 SCBA、固化剂误译为乳液、Section 13 两端拉伸、PDF 末页纯空）：
  1. 立即出具 `[AUDIT_REJECT]` 驳回令，精准锚定文件与 XML 行号；
  2. 生产端修复后重新提交中央主审计引擎复测；
  3. 连续两次发生同类错误，必须立刻固化为 `legal-invariants-oracle.json` 的反欺诈断言或底层 DOCX 引擎的不可逆承重墙（`@ANTIGRAVITY_INVARIANT_LOCK`）！

---

> **体系封印声明**：本规范文档为全系统产物质量判定的法定终审基准。任何代码改动与产物验收必须以此为充要依据，确保每一份交付物均达到零缺陷、零外生编造、零排版失真的工业级最高水准！
