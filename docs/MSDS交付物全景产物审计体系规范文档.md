# MSDS Studio 工业级产物全景审计体系标准规范文档

> **文件版本**：v5.0-ENTERPRISE  
> **法定效力**：全系统最高产物质量核销法定大纲（Supreme Deliverable Audit Constitution）  
> **适用范围**：MSDS-Engine / MSDS Studio 全套标准交付物（4 DOCX + 4 PDF：冠志中英 × 国材中英）  
> **体系咬合**：OrbitStack 轨道工程体系、Ps-openspec 双门禁研发架构、两阶双轨通用深度审计体系  

---

## 目录 (Table of Contents)

- [一、 体系总纲与两阶双轨架构 (The Architectural Governance)](#一-体系总纲与两阶双轨架构-the-architectural-governance)
  - [1.1 核心自审哲学：从“证明没有错”到“敌手挑刺证伪”](#11-核心自审哲学从证明没有错到敌手挑刺证伪)
  - [1.2 裁执物理隔离机制 (Producer vs. Auditor Separation)](#12-裁执物理隔离机制-producer-vs-auditor-separation)
  - [1.3 两阶双轨架构拓扑全景图](#13-两阶双轨架构拓扑全景图)
  - [1.4 阶一：机械确定性硬阻断审计 (Step 1 Mechanical Deterministic Audit)](#14-阶一机械确定性硬阻断审计-step-1-mechanical-deterministic-audit)
  - [1.5 阶二：智能体语义与敌手显微镜对账审计 (Step 2 Cognitive Adversarial Audit)](#15-阶二智能体语义与敌手显微镜对账审计-step-2-cognitive-adversarial-audit)
  - [1.6 逆向反例变异与反假通机制 (Negative Mutation Gates)](#16-逆向反例变异与反假通机制-negative-mutation-gates)
- [二、 八大全局物理不变量与排版门禁 (Macro Invariants)](#二-八大全局物理不变量与排版门禁-macro-invariants)
  - [2.1 格式服从于原文公理 (Format Follows Source Content)](#21-格式服从于原文公理-format-follows-source-content)
  - [2.2 工作流法定预清空第一步 (cleanSlateTemplate Pre-clear)](#22-工作流法定预清空第一步-cleanslatetemplate-pre-clear)
  - [2.3 全局表格边框统一规范 (Unified Table Border Invariant)](#23-全局表格边框统一规范-unified-table-border-invariant)
  - [2.4 页眉页脚安全几何公理 (Footer Margin & Truncation Invariant)](#24-页眉页脚安全几何公理-footer-margin--truncation-invariant)
  - [2.5 多语言媒体资产纯度公理 (Multilingual Media Asset Purity)](#25-多语言媒体资产纯度公理-multilingual-media-asset-purity)
  - [2.6 双实体预设物理隔离公理 (Dual-Entity Isolation Invariant)](#26-双实体预设物理隔离公理-dual-entity-isolation-invariant)
  - [2.7 法规时效性正向演进公理 (Statutory Modernity Evolution Invariant)](#27-法规时效性正向演进公理-statutory-modernity-evolution-invariant)
  - [2.8 交付物时间戳同步与末页防纯空门禁 (Timestamp & Anti-Blank-Page)](#28-交付物时间戳同步与末页防纯空门禁-timestamp--anti-blank-page)
- [三、 16 章节微观逐节审计规范与判定细则 (Section-by-Section Specifications)](#三-16-章节微观逐节审计规范与判定细则-section-by-section-specifications)
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
- [四、 审计执行 SOP 与 1:1 双向物理核销操作指南 (Audit Operations SOP)](#四-审计执行-sop-与-11-双向物理核销操作指南-audit-operations-sop)
  - [4.1 审计工具链与指令集](#41-审计工具链与指令集)
  - [4.2 终审报告产出标准格式](#42-终审报告产出标准格式)
  - [4.3 缺陷驳回与长效防线下沉闭环机制](#43-缺陷驳回与长效防线下沉闭环机制)

---

## 一、 体系总纲与两阶双轨架构 (The Architectural Governance)

### 1.1 核心自审哲学：从“证明没有错”到“敌手挑刺证伪”
传统大模型辅助编程和自动化流水线中最致命的缺陷是**“自编自导自测”**与**“确认偏差（Confirmation Bias）”**：
- 编写代码的智能体往往预设自己的输出是正确的，其编写的测试或审计脚本充斥着弱存在性断言（如 `assert(/工程控制/.test(text))`）；
- 只要命中几个关键字，不论后面是否潜伏着长篇底模口水话、虚假组分数据或乱码，系统均会虚假亮起绿灯（退出码 0）。

> [!IMPORTANT]
> **MSDS Studio 审计体系的最高法定哲学**：  
> **审计者绝非为了证明产出物没有错而走过场，而是必须预设产出物中必然存在隐藏缺陷、事实篡改与外生口水话，以冷酷敌手（Adversary）的身份主动挑刺、去寻找错误！**

### 1.2 裁执物理隔离机制 (Producer vs. Auditor Separation)
为彻底杜绝自编自导，系统在组织架构与线程上实行**裁执物理隔离**：
1. **生产端 (Producer Subagent)**：
   - 专用独立线程（如 `msds-studio-producer`），专注于调度 MSDS Studio 编辑器原语与流水线；
   - 严格恪守“法定预清空第一步”、“格式服从源文档”、“大模型逐句英译”；
   - 严禁生产端自我宣布审计合格并自主合流。
2. **审计端 (Auditor / Main Coordinator)**：
   - 由主协调 Agent 独立担任，站在甲方的严苛立场；
   - 拥有独立的只读黄金事实基准库（源文档 100% 留存事实）；
   - 执行 Step 1 机械审计 + Step 2 显微镜逐行对账；若发现任何违背事实的篡改，坚决下达 `[AUDIT_REJECT]` 驳回令！

### 1.3 两阶双轨架构拓扑全景图

```mermaid
flowchart TD
    subgraph Phase1_Production["生产阶段 (Producer Subagent)"]
        Src["源文件 (Ground Truth)"] --> Wipe["1. cleanSlateTemplate 强制预清空"]
        Wipe --> Parse["2. 零损耗化学事实提取与格式匹配"]
        Parse --> Trans["3. 上下文语义大模型逐句英译"]
        Trans --> Export["4. 批量导出 8 份交付物 (4 DOCX + 4 PDF)"]
    end

    Export -->|交付物移交| Phase2_Step1["第一阶：机械确定性审计 (钥匙 1)"]

    subgraph Two_Step_Audit["两阶双轨通用深度审计体系"]
        subgraph Step1_Mechanical["第一阶：机械确定性审计 (准入钥匙 1)"]
            M1["G-01~G-40 契约终审断言"]
            M2["双极双层全景测试 (audit_bipolar_bilayer.mjs)"]
            M3["G-41~G-46 16章节双语保真度 (audit_16_sections_bilingual_fidelity.mjs)"]
            M4["PyMuPDF 物理排版与激光对齐检测"]
            M1 --> M2 --> M3 --> M4
        end

        Step1_Mechanical -->|真实退出码 0 (必要条件)| Step2_Cognitive["第二阶：智能体敌手认知审计 (准出钥匙 2)"]

        subgraph Step2_Cognitive["第二阶：智能体敌手认知审计 (准出钥匙 2)"]
            C1["解包 DOCX 审查 word/document.xml"]
            C2["16 章节 1:1 双向物理对账 (行数/槽位/序号)"]
            C3["反向排他门禁：外生口水话与未授权数据零容忍"]
            C4["双实体隔离审查：冠志 vs 国材零串流"]
            C1 --> C2 --> C3 --> C4
        end
    end

    Phase2_Step1 --> Step1_Mechanical

    Step2_Cognitive -->|发现任一缺陷| Reject["🚨 AUDIT_REJECT: 坚决打回整改令"]
    Reject -->|退回生产端重修| Phase1_Production

    Step2_Cognitive -->|100% 满分无缺陷| Pass["🏆 AUDIT_PASSED: 出具 1:1 双向物理核销清算表"]
    Pass --> Release["交付用户验收归档"]
```

### 1.4 阶一：机械确定性硬阻断审计 (Step 1 Mechanical Deterministic Audit)
- **定位**：机器底座准入（钥匙 1）。是审计放行的**必要条件**，未通过前严禁进入第二阶；
- **核心断言库**：
  - **G-01 ~ G-35**：涵盖 16 章节标题完整性、段落样式、字号、加粗、单元格垂直水平对齐；
  - **G-36**：DOCX 与 PDF 生成时间戳同步差 $\le 300\text{s}$（实测一般在 $5\text{s}\sim 8\text{s}$）；
  - **G-37**：英文 PDF 说明行 9.50pt 硬断言；
  - **G-38**：Section 9 标签首字 19 项指标绝对垂直激光对齐于标准坐标；
  - **G-39**：OPC 结构完备性与 XML Schema 合规性；
  - **G-40**：末页避免纯空门禁（Blank Page Bug Zero-Tolerance）；
  - **G-41 ~ G-46**：16 章节双语 1:1 逐句逐槽位物理同构断言。

### 1.5 阶二：智能体语义与敌手显微镜对账审计 (Step 2 Cognitive Adversarial Audit)
- **定位**：语义契约证伪与事实保真（钥匙 2）。是审计放行的**充要条件**；
- **核心操作**：
  - 解包 DOCX 压缩包，深入 `word/document.xml` 与 `word/footer*.xml` 的底层 XML 标签；
  - 针对源文档提取的每一个 CAS 号、数值、标点符号、行数，与交付物中的对应槽位做微观对比；
  - 重点排查智能匹配中是否出现“张冠李戴”、“篡改字句”、“顺手发挥”或“底模残留”。

### 1.6 逆向反例变异与反假通机制 (Negative Mutation Gates)
为防止审计脚本自身退化为弱断言：
1. **成对断言铁律**：凡检查某一项必须输出的内容，必须同步编写对应的逆向反例排他断言。例如：
   - 正向：`assert(/8\.2\s*工程控制/.test(text))`
   - 逆向：`assert(!/使用局部排风或全面通风|洗眼器与安全淋浴设施/.test(text))`
2. **变异元审计杀伤力验证**：若向交付物中人为注入一句底模口水话或多加一行无源数据，审计脚本必须立即变红报错；若变异注入后仍返回 0，直接判定该审计脚本犯有 `TRIVIAL_ASSERTION_FRAUD`（弱断言欺诈），立即锁死流水线。

---

## 二、 八大全局物理不变量与排版门禁 (Macro Invariants)

全局不变量为全系统跨章节、跨型号通用的最高法定宪法，任何章节的改动均不得违反以下八大铁律：

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

### 2.3 全局表格边框统一规范 (Unified Table Border Invariant)
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
  - 电话：86-763-2811205 / 传真：86-763-2811024
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

---

## 三、 16 章节微观逐节审计规范与判定细则 (Section-by-Section Specifications)

---

### Section 1: 化学品及企业标识 (Identification)

#### 1. 结构与行数契约
- **中文结构**：固定为 10 行标准表格结构：
  - Row 0: 章节标题 `1.物料及供应商标识`
  - Row 1: `1.1 产品名称：` | 值格
  - Row 2: `中文名称：` | 值格
  - Row 3: `化学品分类：` | 值格
  - Row 4: `1.2 产品使用建议和使用限制：` | 值格
  - Row 5: `1.3 供应商信息：` (通栏小标题)
  - Row 6: `供应商名称：` | 值格
  - Row 7: `供应商地址：` | 值格
  - Row 8: `电话：` | 值格
  - Row 9: `传真：` | 值格
- **英文结构**：固定为 9 行标准结构（Row 1 为 `1.1 Product name:`，Row 2 为 `Chemical category:`，与中文 1:1 对应）。

#### 2. 核心判定标准与断言
- **型号精确覆写**：产品名称槽位必须精准包含目标型号，严禁残留其他型号（如把 BL-8123 写成 OS-9547）；
- **用途英译定性守恒**：
  - “涂料用添加剂”必须精准英译为 `Additive for coatings.`（严禁泛化为 `Used in coatings` 而丢失“添加剂”定性）；
  - “粘合剂、涂料”精准英译为 `Used in adhesives and coatings.`；
- **实体隔离校验**：冠志版与国材版的供应商名称、地址、电话、传真必须 100% 对应各自实体，严禁错乱。

---

### Section 2: 危险性概述 (Hazards Identification)

#### 1. 双模态动态判定契约
- **模态 A：危化品模态 (Hazardous Chemical)**
  - 必须包含清晰的 2.1 分类与 2.2 标签要素；
  - 象形图、信号词（“危险”/“警告”）、H 声明（危险说明）与 P 声明（防范说明）必须完备；
  - 英文版信号词必须精准对应：中文“危险” $\rightarrow$ `Danger`，中文“警告” $\rightarrow$ `Warning`；
  - 严禁底模外生强塞未经源文件授权的 `2.3 其他危害：无适用资料。`。
- **模态 B：非危品通栏模态 (Non-Hazardous Composite)**
  - GHS 危险性类别标明“根据 GHS 不属于危险物”或“无”；
  - 象形图标明“无”或“不属于危险物”；
  - 英文版严禁出现任何危化品残留词汇：`assert(!/H412|H315|H332|H317|Category/i.test(enText))`；
  - 英文危险性说明必须标准化输出：`Not classified as a hazardous chemical according to GHS.` 与 `No known significant effects or critical hazards.`。

---

### Section 3: 成分/组成信息 (Composition / Ingredients)

#### 1. 结构与几何契约
- **行数与组分 1:1 守恒**：中文表格的组分行数与英文表格的组分行数必须绝对相等（`cnSec.rows.length === enSec.rows.length`）；
- **3 列标准网格**：表头必须为 `化学品名称 | CAS编号 | %（w/w）`，英文对应 `Chemical name | CAS NO. | Concentration % (w/w)`；
- **边框保护**：动态增行（如从底模 2 行增至 4 行）时，首行顶框和末行底框必须为实线，内部水平和垂直线必须为统一虚线。

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
  - 救医指引：必须包含 `seek medical attention / advice`。

---

### Section 5: 消防措施 (Fire Fighting Measures)

#### 1. 核心判定标准
- **合适与不合适灭火剂逻辑排他**：
  - 5.1 合适的灭火剂（二氧化碳、泡沫、灭火粉末、水喷雾）；
  - 5.2 不合适的灭火剂（高流量水喷射、高压水枪）；
  - 审计断言：`5.1 与 5.2 灭火剂内容绝对严禁相同或重叠`！
- **燃烧产物保真**：燃烧分解产物（一氧化碳、二氧化碳、氮氧化物、氰化氢）中英文必须一一对应。

---

### Section 6: 泄漏应急处理 (Accidental Release Measures)

#### 1. 核心判定标准
- **三层防护结构完备**：必须完备包含 6.1 个人防护措施、6.2 环境保护措施、6.3 消除与收集方法；
- **底模错位排查**：严禁残留底模中因表格合并错位产生的“灭火设备”或“急救”标签。

---

### Section 7: 操作处置与储存 (Handling and Storage)

#### 1. 核心判定标准
- **双小节结构**：必须清晰包含 7.1 安全操作防范与 7.2 安全储存条件；
- **温控与避光要求保真**：若源文档包含特定温控范围（如 5-35℃ 或避免霜冻），交付物中英文数值必须完全一致。

---

### Section 8: 接触控制/个体防护 (Exposure Controls / Personal Protection)

> [!CAUTION]
> **本章节为历史外生口水话泄露与虚假组分强塞的最高发重灾区，执行最高级别严审！**

#### 1. 结构与行数同构律
- **有接触限值产品 (With OEL)**：保持 15 行标准结构（包含“工作场所组分控制参数”通栏题头与“物质 | 依据 | 类型 | 数值” 4 列表格）；
- **无接触限值产品 (No OEL)**：**必须彻底剪枝四列表格与通栏题头，严格收敛为 12 行纯净事实**！

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

#### 3. 4 列表格排版与虚假数据排除门禁
- **无接触限值商品虚假数据排除**：
  - 若源文档明文为“无可用的接触限值信息”或“不含有职业接触限值的物质”，**严禁残留底模中的“六亚甲基-1,6-二异氰酸酯 0.03 mg/m3”或“丙二醇甲醚醋酸酯 100 mg/m3”**！
- **4 列表格排版规范**：
  - 表头行（物质/依据/类型/数值 / Substance/Basis/Type/Value）：**必须水平居中，彻底去除末尾冒号**；
  - 数据行：**必须水平居中，常规字重 (`bold: false`)，无末尾冒号，字号 Arial 9.5pt**；
  - 空白行剪枝：未填充数据的空白 4 列行必须物理删除。

---

### Section 9: 理化特性 (Physical and Chemical Properties)

#### 1. 结构与行数 1:1 绝对守恒律
- **行数与小节序号守恒**：中文行数与英文行数必须完全绝对一致（通常为 19 行：9.1 ~ 9.19）；
- **行序守恒公理**：严格服从源文档物理行序，绝对严禁擅自调整前后顺序（例如把闪点提前或把可燃性后移）。

#### 2. 核心判定标准与断言
- **激光垂线绝对对齐 (G-38)**：在 PDF 渲染中，全量 19 个指标的标签首字与冒号后数值的起始坐标必须激光对齐（标准坐标 x0=80.28pt 附近），杜绝波浪状参差不齐；
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
- **标准小节结构**：必须完备包含 10.1 反应性、10.2 化学稳定性、10.3 危险反应可能性、10.4 应避免的条件、10.5 不相容物质、10.6 危险分解产物；
- **英文标签防混淆**：
  - 10.2 危险分解产物英文标签必须为 `Hazardous decomposition products:`，**严禁误写为 `Decomposition temperature:`**。

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
- **翻译准确性**：主要粘膜刺激性英文必须为 `Primary mucosal irritation:`，**严禁误写为 `Primary eye irritation:`**。

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
  - 温度范围保真：若源文档包含特定温控范围（如“温度不可高于+50℃，不可低于－5℃”），交付物中英文数值必须 100% 吻合（`Temperature must not exceed +50℃...`）；
  - 隔离要求：若源文档提及“远离食物、酸和碱”，英文必须完整体现：`Keep away from food, acids and bases.`。

---

### Section 15: 法规信息 (Regulatory Information)

#### 1. 核心判定标准
- **现行有效性正向演进**：
  - 英文版法规信息必须引用现行有效的国务院令第 591 号（`Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591`）；
  - 必须引用现行有效的 GB 30000 系列国标（`GB 30000.2-29 Rules for classification and labelling of chemicals`）；
- **排除底模外生强塞法规**：
  - 若源文档仅列明 4 部法规，英文交付物**严禁从底模强塞未经源文件授权的第 5 部法规（如 GB 15258 化学品安全标签编写规定）**。

---

### Section 16: 其他信息 (Other Information)

#### 1. 核心判定标准
- **知识产权与免责声明保真**：完整保留免责声明、知识产权说明与修改记录说明；
- **排版合规**：单单元格通栏，字号 9.5pt，行距标准，与末页防纯空门禁咬合。

---

## 四、 审计执行 SOP 与 1:1 双向物理核销操作指南 (Audit Operations SOP)

### 4.1 审计工具链与指令集

每次产出后，审计人员（或审计 Agent）必须无条件依序执行以下三道指令：

```bash
# 步骤 1: 运行机械确定性终审断言套件 (涵盖 G-01 ~ G-46 终审门禁)
node web/scripts/run_final_audit.mjs <产品型号>

# 步骤 2: 运行 16 章节中英文逐句逐槽位 1:1 双向物理对账门禁
node web/scripts/audit_16_sections_bilingual_fidelity.mjs <中文DOCX路径> <英文DOCX路径>

# 步骤 3: 运行全景法医级显微镜对账脚本 (检查底层 XML、PyMuPDF 文本块坐标与物理渲染)
python scratch/deep_forensic_audit.py
```

### 4.2 终审报告产出标准格式

审计完成后，必须出具包含以下核心板块的正式终审对账报告：
1. **审计元数据**：产品型号、源文件路径、产出目录、审计执行人、时间戳；
2. **两阶双轨门禁测试结果**：机械断言总数、通过数、失败数、退出码；
3. **1:1 逐条双向物理核销清算表**：覆盖 16 个章节全部事实指纹，实测值标注为 `[Measured]`，并注明物理来源；
4. **敌手挑刺记录**：记录本次审计中主动寻找或变异攻击的记录，出具零缺陷证伪证明。

### 4.3 缺陷驳回与长效防线下沉闭环机制

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
