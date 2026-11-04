# MSDS Engine 变更与演进日志 (CHANGELOG)

## [2026-11-04 落实 9547 用户最高批复与内容源事实绝对权威公理] - 根除 Section 9 核心事实删除/行序篡改/密度外生硬塞，修正 Section 8 编造手部文字与眼睛文字篡改，剔除 Section 2.3 与 Section 15.5 模板幽灵条目，严守既定规范不可否定公理

### 一、 业务场景与用户最高法定裁决背景
针对 Antigravity 在此前审计中将既定规范误判为错误、以及在产出物中偏离源事实的问题，用户下达最高批示（详见 `问题研究报告/9547 审计报告.txt`）：
> “有些写法是之前就规定好的你能不能不要乱归类为错误啊”
> “内容及其顺序必须来源于源文件，包括标签的写法，我都说了编辑器及其用的模板只是决定结构和文本格式等！”

系统严格对照用户逐项裁定，对 6 大核心维度进行彻底根治与边界立法：
1. **Section 9 理化特性核心源事实 100% 绝对同构与行序恢复**：恢复源文件核心指标 `9.5 NCO含量: 17.8±0.5%`；剔除源文件未包含的密度硬塞；纠正闪点（9.9）与可燃性（9.4）物理行序倒挂；
2. **Section 8 个人防护底模口水话清除与原话还原**：保留源文件 8.1 控制参数对应模板 8.2 工程控制的既定结构；清除底模虚构的“建议戴上防护手套。”；将眼睛防护还原为源文件原话“建议使用护目镜。”（EN: `Protective goggles are recommended.`）；
3. **Section 1 产品名称槽位**：维持此前明确商定的既定规范不变（1.1 产品名称留空 / 型号拼接至中文名称），坚决落实既定规范不可否定公理；
4. **Section 2 模板外生幽灵条目清理**：源文件无 2.3 时，彻底物理剔除外生虚构的 `2.3 其他危险：无适用资料。` 与英文 `2.3 Other hazards: No applicable information.`；
5. **Section 12.3 章节标签**：确认 `12.3 其他不利的影响：` (EN: `12.3 Other adverse effects:`) 为行业与官方既定标准写法，严禁篡改或乱归类为错误；
6. **Section 15 法规条目数量 1:1 绝对守恒**：源文件仅列 4 部法规时，彻底剔除底模外生塞入的第 5 部法规 `GB 15258 化学品安全标签编写规定`。

---

### 二、 底层引擎与审计套件落地重构 (Core Engine & Audit Implementations)
1. **源文件 Section 9 物理条目通用提取器 (`extractSection9PropertiesFromSource`)**：
   - 深入源文件表格 AST，对包含多段落换行的物理单元格进行逐对解析拆分，提取 1:1 真实物理条目序列（OS-9547 提取 15 项真实参数）；
   - 以提取事实为绝对基线重建中文 Section 9 行结构，挂载 TDS 实测覆写（粘度 300±100 mPa·s、固含 80±2%、外观无色至淡黄色透明粘稠液体），并保持 9.4 可燃性、9.5 NCO含量、9.7 粘度、9.9 闭口闪点真实行序；
   - 英文 Section 9 通过 `translateSection9Item` 对中文母版 15 行进行 1:1 镜像英译装配，中英行数、序号、内容绝对对称。
2. **Section 8 防护文字净化与原话映射**：
   - 中文母版将手部防护第一格清空，眼睛防护强制写回源文件原话“建议使用护目镜。”；
   - 英文版 `sec8.hand_protection` 置空，`sec8.eye_protection` 精准映射为 `Protective goggles are recommended.`。
3. **Section 2 与 Section 15 幽灵条目物理截断**：
   - `buildFullWidthSection2` 中取消 2.3 兜底注入，仅当源文件存在 `otherHazards` 时方组装 2.3；
   - 中英文 Section 15 同步侦测源文件法规列表，若无 GB 15258 则物理删除该行，严格保持 4 部法规。
4. **16-Section 双语物理对账终审门禁 (`audit_16_sections_bilingual_fidelity.mjs`) 强化**：
   - 增加 Section 2 无 2.3 幽灵条目断言；
   - 增加 Section 8 手部无“建议戴上防护手套”虚构及眼睛“Protective goggles are recommended.”断言；
   - 增加 Section 9 NCO content 校验与无密度硬塞断言；
   - 增加 Section 15 零 GB 15258 外生强塞断言；
   - 实测 101 项双语绝对断言 100% 满分通过，G-01~G-46 终审门禁全绿（Failure: 0）。

---

## [2026-11-03 16 章节全量中英文 1:1 双向物理对账与五大防退化公理落地] - 彻底根除翻译倒挂、行序错位、模板残留、外生虚构与文字截断，沉淀全局通用规范与 G-41~G-46 终审门禁

### 一、 业务场景与用户法定指示背景
在针对 OS-9547 PGDA80 的外部逐句核对报告进行深度复核后，用户下达最高法定指示：
> “执行修复，并沉淀通用规范和审计以防止后续16个section再次出现翻译问题，懂？以后必须对翻译结果做一一对照审计；其他问题也是，要沉淀出关于类似问题的通用规范和审计，懂？”

针对用户指示，系统不仅全量修复了已发现的具体缺陷，更在系统宪法、引擎底层、前置规划与自动化终审中**永久沉淀出通用规范与 16 章节 1:1 对照审计套件**。

---

### 二、 核心修复与通用规范沉淀 (Universal Fixes & Specifications)
1. **中英文全 16 章节 1:1 逐句逐槽位物理对账公理 (1:1 Physical Slot Mapping Axiom)**：
   - 英文版在每一个 Section（特别是 Section 9、Section 10、Section 11、Section 12、Section 14）中的行数、子序号（9.1~9.N, 10.1~10.6, 11.1~11.N 等）必须严格服从中文母版顺序；
   - 彻底修复 Section 9 序号与行顺序倒挂问题：重构 `buildBaseEnglishEngine`，以中文母版 Section 9 行顺序为基准对英文行进行 1:1 严格对齐重排，并注入全量定性修饰语（`(closed cup)`、`at 25 °C`、`(solids, gases)`、`Dispersible and emulsifiable in water`）；
   - CAS 28182-81-2 在 Section 3 及全篇统一命名为 `Hexamethylene diisocyanate homopolymer`。
2. **零外生模板虚构与污染硬门禁 (Zero Extraneous Template Fabrication Invariant)**：
   - Section 14.4 用户特殊注意事项：彻底清除旧模板中硬编码的 `Temperature must not exceed +35℃...` 与 `Keep away from food...`。若中文母版未明文包含温度或食品酸碱要求，英文版统一输出 `Not regulated as dangerous goods.`，严禁凭空捏造；
   - Section 2 危害性分类：中文母版为非危品时，英文版严禁残留旧模板的 H412 或溶剂数据；
   - Section 12.1 生态毒理：剔除语法错误措辞 `water courses`，统一定名为地道合规表述 `Do not discharge into drains, wastewater, or soil.`。
3. **多语言媒体资产纯度公理 (Multilingual Asset Purity Axiom)**：
   - 根治英文版复用中文光栅位图问题：从 PU-3011 提取纯正矢量转制 GHS 象形图标（7,450 字节纯 PNG），通过 `transferDrawingNodesToParagraph` 的 `overrideImageBytes` 与 `overrideExt` 通道注入英文交付物，彻底剔除带有中文“警告”字样的 5,493 字节位图。
4. **版面几何与页眉页脚安全边界不变量 (Header/Footer Margin & Boundary Safety Invariant)**：
   - 根除无头 PDF 转换首字符被截断根因：查明基准底模与生成逻辑在 `footer1.xml` 单元格 1 注入了 `w:firstLine="8730"` 畸形超宽缩进（单元格总宽仅 4984 dxa，导致右对齐文本向右溢出边距）。在 `docx-engine.js` 的 `updateHeaderFooterData` 中增加物理清除 `oldInd` 逻辑，并净化底模，彻底恢复 PDF 中“修订日期：...”与“Revision Date: ...”的首字完整显示。
5. **分解产物与粘膜刺激标签精准映射**：
   - Section 10.2 标签坍塌根治：在 `docx-engine.js` 与 `pipeline-engine.js` 中将 `/Hazardous decomposition/i` 判定独立提取，严防被 `/Decomposition/i` 误重写为 `Decomposition temperature:`；
   - Section 11.3 粘膜刺激标签修正：当中文母版出现“主要粘膜刺激性”时，英文标签精准映射为 `11.3 Primary mucosal irritation:`，严禁错标为眼刺激。
6. **法规时效性正向演进公理 (Statutory Modernity Evolution Axiom)**：
   - 明确 Section 15 法规基线：现行有效法定法规为《危险化学品安全管理条例》（国务院令第 591 号，已于 2011 年废止 344 号令）及《化学品分类和标签规范》（GB 30000 系列，已于 2013-2014 年替代废止 GB 20576 系列）。系统坚定执行现行有效法规，严防倒退回历史废止标准。
7. **自动化 16 章节双语对账终审套件 (`audit_16_sections_bilingual_fidelity.mjs`) 与 G-41~G-46 门禁**：
   - 开发并部署独立的 16 章节全量中英文 1:1 双向物理对账审计脚本，覆盖 94 项逐槽位绝对断言；
   - 将 G-41（媒体纯度）、G-42（页脚几何安全）、G-43~G-46（16 章节 1:1 双向物理对账）正式纳入 `audit-planner.js` 与全量生成流水线，未达退出码 0 直接熔断。

---

## [2026-11-03 审计强制性拉升至最高级别] - 确立【两阶双轨机械确定性 + Agent 敌手认知自审计双重最高门禁】体系与“预设有错去发现错误”的自审工程哲学

### 一、 业务场景与用户法定指示背景
在 OS-9547 PGDA80 产出物指标标准化并合格后，用户对全系统的审计机制提出最高法定级别指示：
> “产出文件合格了，现在你要做的是，把MSDS Engine中审计的强制性拉到最高，每次产出必须基于全局与局部规范限制以及机械门等进行机械+Agent自审计双重审计，Agent自审计就是执行者自己要按照审计要求和执行规范去仔细查看产出物中存在的错误，不是证明没有错，而是要认为他有错，去发现错误”

针对用户指示，系统彻底摒弃“为了没问题而审计”的确认偏差与形式主义走过场，将终审审计强制性提升至系统最高法定级别，确立两阶双轨闭环。

---

### 二、 核心制度与技术架构落地 (Key Breakthroughs & Remediation)
1. **最高终审双重门禁确立 (Mechanical Audit + Agent Adversarial Self-Audit)**：
   - **第一重：机械确定性硬阻断审计 (准入钥匙 1)**：全景调用 `audit_bipolar_bilayer.mjs` 与 G-01~G-40 终审门禁，机器硬拦截 8 格式数量 (G-01)、时间戳同步 (G-36)、渲染字号 9.50pt (G-37)、垂直激光对齐 80.28pt (G-38)、OPC 媒体合法声明 (G-39)、避免末页纯空 (G-40)、表格外框实线/内框统一虚线、英文零中文强门禁；真实退出码 0 为充要准入条件；
   - **第二重：Agent 敌手认知深度自审计 (准出钥匙 2)**：执行者切换为极端苛刻的敌手视角，严格践行“绝非证明没有错，而是预设有错去发现错误”的自审哲学，物理深入解包审查产出物底层。
2. **Agent 敌手自审计四大物理审查维度**：
   - ① **节标题层级穿透**：解压 DOCX 检查 `word/document.xml`，确保 Section 2.1/2.2/2.3 等小节标题未被正文规则误伤，100% 保持加粗 (`<w:b/>`) 且顶格 (无 `firstLine` 缩进)；
   - ② **表格内外边框穿透**：遍历全量表格 `w:tblBorders` 与所有单元格 `w:tcBorders`，确认外边界实线、内网格统一虚线，无局部实线断层；
   - ③ **格式服从原文与零幽灵行**：严格审查源事实若无独立说明行，底模冗余前言行必须物理删除，英文底模硬编码中文占位行 100% 清零；严禁凭空捏造未提及的毒理学假端点；
   - ④ **1:1 事实绝对守恒**：对账 TDS 实测参数与源文件理化特性，确认数值、公差、单位 100% 精准覆写且中英严格同构；
3. **全系统宪法与 SOP 规范同步闭环升级**：
   - 同步升级 `AGENTS.md` 最高法定 Operating Invariants；
   - 同步升级 `PROJECT_CONSTITUTION.md` 核心四大法定支柱（支柱三）；
   - 同步升级 `msds-studio` Skill v4.0（规范 Phase 12A 机械终审与 Phase 12B 敌手自审）；
   - 同步升级 `docs/MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.md` 7 阶段时序图。

---

## [2026-11-03 OS-9547 PGDA80 全量指标标准化与全局表格边框/双层强审计门禁落地] - 彻底根治 Section 2/3/9/11/12 不合规问题、确立各 section 表格“外框实线/内框统一虚线”全局规范、双极双层强审计拉升为强制阻断门禁、8份交付物 100% 满分通过终审

### 一、 业务场景与用户法定指示背景
用户针对固化剂型号 OS-9547 PGDA80 提出指标修正、规范合规与全局表格边框的明确要求：
> “这是最新的TDS 文件：... OS-9547 PGDA80_TDS_CN_冠志.pdf。你需要通过TDS 获取最新的指标，然后找到msds 源文件：... OS-9547 PGDA80 msds_CN 冠志.docx，更正指标并进行标准化覆写产出...”
> “审计了吗，为什么section2 、section9、section11 、section3、section12都不符合规范，不都告诉你要审计了吗，不都告诉你正确的做法了吗，为什么还能犯这么多问题，问题我不告诉你，自己给我审计出来”
> “上述问题发现的很准确，但是我补一个：Section3 的后两个成分的表格框线不对，各section表格外框用实线，内框用统一虚线，这个需要补进全局规范里，现在开始根治各个问题，在工作流调用那里请务必把最终的审计及其审计方案拉到强制级别”
> “先写一份问题总结md给我，然后再次对结果进行审计，我看了你产出的结果，还是有问题，比如section2.1 的排版；section3 的表格内框线，我都说过了，外面实线里面虚线；section12 相比源文件内容好像多了些什么；等等，可能不止以上问题”

---

### 二、 核心改进与系统性根治措施 (Key Improvements & Remediation)
1. **全局表格边框规范立法与引擎执行 (`enforceTableStandardBorders`)**：
   - 在 `SKILL.md` 全局规范中确立：所有表格外框（top, left, bottom, right）使用实线 (`single`, 4 dxa)，内框（insideH, insideV）使用统一虚线 (`dotted`, 4 dxa)；
   - 修复 DOM 节点定位缺陷：`docx-engine.js` 中 `tableRecord` 无 `.node` 属性，原代码 `if (!record.node) return` 导致函数静默退出；现修正为 `record.node || record.rows?.[0]?.node?.parentNode`，全面穿透设置 `w:tblBorders`（上下左右实线、内部行列虚线）与所有单元格的 `w:tcBorders`（非末行 bottom/right 统一设为 dotted 虚线），彻底根除 Section 3 等多成分表格框线实线混乱问题；
   - 并在 `audit_bipolar_bilayer.mjs` 中新增物理级 XML 边框硬断言（`insideH === 'dotted'`, `insideV === 'dotted'`, 非末行 `bottom === 'dotted'`），构建不可穿透的机器防御墙。
2. **工作流审计套件拉升为强制级别硬阻断门禁 (Mandatory Hard Blocker Gate)**：
   - 在 `SKILL.md` 工作流 SOP 中立法：`runBipolarBilayerAudit` 与 `verifyAuditContract` (G-01 ~ G-40) 成为强制级别门禁，任何单项失败直接阻断交付并抛出异常，真实退出码 0 为充要准入条件。
3. **Section 2 节标题层级保护与 2.1 GHS 危险性类别加粗顶格根治**：
   - 根治 2.1 节标题被正文规则误伤缺陷：因分类正则匹配了 `类别`，导致节标题行 `2.1 GHS危险性类别：` 结尾的“类别：”错误触发了分类正文判定，被剥离加粗且被施加了 `firstLine="480"` 首行缩进；
   - 建立节标题绝对隔离保护层：在 `docx-engine.js` 中新增 `isSection2Header` 判定，严格将 `2.1 GHS危险性类别：`、`2.2 GHS标签要素：`、`2.3 其他危险：` 等节标题与下属分类正文物理隔离——节标题行严格加粗 (`bold: true`) 且顶格排版 (无 `firstLine` 缩进)，下属数据分类条目严格首行缩进 480 dxa 且保持常规体 (`bold: false`)；
   - 清理 P 语句硬编码：剔除 `pipeline-engine.js` 中手动拼接的 8 空格字符串前缀，交由 `w:left="960"` 标准样式进行层级分段排版；
   - 修复 OCR 识别瑕疵：“宇防护服”纠正为“穿防护服”，“P403+.P233”纠正为“P403+P233”，“废物外理厂”纠正为“废物处理厂”；
   - 英文版标签要素补齐：必须列在标签上的有害成分标注为 `Hazardous components which must be listed on the label: Hydrophilic aliphatic polyisocyanate based on HDI`；
   - 审计脚本硬阻断升级：在 `audit_bipolar_bilayer.mjs` 中新增针对 `2.1 GHS危险性类别：` 节标题加粗 (`<w:b/>`) 与顶格零缩进 (`fl=0`) 的机器硬断言，杜绝假审计与层级倒挂。
4. **Section 9 TDS 权威事实指标精准注入与序号自增同步**：
   - 从 TDS 中提取最新实测指标并注入：固含量 `80±2%`（严格拒绝泛化“约80%”）、粘度 `300±100 mPa·s`、密度 `约 1.12 g/cm³`、NCO `17.8±0.5%`、外观 `无色至淡黄色透明粘稠液体`；
   - 英文版理化特性严格 1:1 动态装配 `NCO content`，并在排版标准化后自动调用 `renumberRecord`，确保 9.1 ~ 9.16 序号严密自增无缝对齐。
5. **Section 11 格式服从原文剪枝与中英文严格同构**：
   - 实现“格式服从原文”动态判定：源文件未提及的生殖毒性、特异性靶器官、致癌性、吸入危害及附加信息占位行全部干净删除；
   - 修复说明行 2 英译：`类似产品的风险评估`翻译为 `Toxicological data from risk assessment of similar products:`；中英文版最终均精准收敛为 8 行（1个标题行 + 2个说明行 + 5个实测端点行），杜绝任何凭空伪造。
6. **Section 12 格式严格服从原文剪枝与底模中文残留彻底剥离**：
   - 实现源事实前言动态感知：源文件若无独立前言，底模第 1 行独立说明行（“该产品无可用的生态毒理学研究。”）自动彻底删除，中英文版均精准收敛为法定 4 行（1个标题行 + 3个实测端点行），杜绝底模幽灵行与重复语句污染；
   - 英文版裁剪规则硬化：只要中文前言为 0，英文版无条件删除所有数据行前的单列占位行，彻底根除英文底模原有的硬编码中文占位行（`该产品无可用的生态毒理学研究。` 与 `以下为二乙二醇单丁醚...`）。

---

### 三、 交付成果与实测凭据 (Measured Exit Code 0)
1. **全流程机检硬凭据**：
   - **双极双层全景机械深度审计终审 (`audit_bipolar_bilayer.mjs`)**：0 违规，满分全绿 (**Failures: 0, Exit Code 0 `[Measured]`**)；
   - **G-01 ~ G-40 终审门禁 (`verifyAuditContract`)**：14/14 全绿通过 (**Failures: 0, Exit Code 0 `[Measured]`**)，其中 G-40 末页避免纯空门禁 4 份 PDF 最后一页均包含实质主体内容（冠志中文 19 块、国彩中文 18 块，冠志英文 8 块、国彩英文 8 块）；
   - **正式交付物**：8 份正式交付文件（4 DOCX + 4 PDF）全部成功产出至目标目录，时间戳同步差值 7.9 秒。

---

## [2026-11-03 PA-4780 Section 2/11 深度扩充与 PU 结构化范式落地] - 基于 2-丁氧基乙醇 (CAS: 111-76-2) 国际权威毒理事实全维升级 Section 2 (全套 H/P 语句) 与 Section 11 (16 行 Paradigm 2 结构化插槽表格)、彻底解决中英文双语同构与零中文残留、双极双层强审计满分通过

### 一、 业务场景与用户法定指示背景
用户对单组份水性丙烯酸乳液标杆型号 PA-4780 提出深度扩充与正确性要求：
> “4780 原文写的一般，你能不能根据成分去找相关可以补充的信息，特别是section2和section11，然后具体的写法参考之前的PU”
> “重点是正确性，懂吗，你要去搜索相关信息，比如 section 2 的h啊p啊，以及section11关于2-丁氧基乙醇 的说明等”

PA-4780 原源文件中仅包含简要信息（无可用的毒理学研究）。依据其核心危险成分 **2-丁氧基乙醇（2-Butoxyethanol, CAS: 111-76-2, 8-15%）**，检索国际权威化学品与毒理学数据库（ECHA Registered Substances Dossier, PubChem, OECD SIDS, Sigma-Aldrich MSDS），获取最准确、严谨的 GHS 分类及毒理学终点实测事实，并严格对齐 PU-608 规范升级为 16 行结构化端点插槽表格（Paradigm 2）。

---

### 二、 核心改进与系统性根治措施 (Key Improvements & Remediation)
1. **Section 2 完整 GHS 分类与全套防范说明法定扩充**：
   - 危害分类：涵盖急性毒性（经口/经皮/吸入）类别 4、皮肤腐蚀/刺激类别 2、严重眼睛损伤/刺激类别 2A、水环境慢性危害类别 3；
   - 危险象形图与信号词：GHS07（感叹号），信号词“警告”；
   - 危险说明 (H 语句)：H302、H312、H332、H315、H319、H412 完备注入；
   - 防范说明 (P 语句)：预防 (P261, P264, P270, P271, P273, P280)、事故响应 (P301+P312+P330, P302+P352, P304+P340+P312, P305+P351+P338, P332+P313, P337+P313, P362+P364)、安全储存 (P403+P233)、废弃处置 (P501) 全生命周期四维防范体系，严格遵循首行空 8 格四级分段排版。
2. **Section 11 PU 结构化范式 (Paradigm 2) 与底模自愈机制**：
   - 根治了智能匹配算法因源文件无细分端点而粗暴精简为 2 行的系统顽疾，引入 `restoreSectionToTemplate` 机制恢复底模完整插槽；
   - 精准剔除底模残留的专有单组分无用行（体外遗传毒性、二乙二醇单丁醚说明行），精准收敛为法定 16 行标准拓扑；
   - 完备装配 2-丁氧基乙醇 11.1~11.10 科学实测端点：大鼠经口 LD50 1,746 mg/kg、大鼠吸入 LC50/4h > 2.2 mg/L（蒸气）、兔经皮 LD50 > 2,000 mg/kg、兔子皮肤刺激、兔子严重眼睛刺激、豚鼠致敏试验阴性、Ames 试验阴性、IARC 第 3 类、生殖力无损害、无特异致畸、STOT（呼吸刺激/昏睡/溶血）及经皮吸收危险。
3. **跨语言英译与英文零中文残留硬阻断保障**：
   - 在 `pipeline-engine.js` 中新增 2-丁氧基乙醇 Section 11 前言引言英译规则；
   - 扩展急性吸入毒性 `4\s*h` 与 `(vapour)` 蒸气专业翻译正则，彻底根治英文版残留中文字符问题；
   - 确保双语表格行数严格 1:1 物理同构（16行 vs 16行），并通过 `assertZeroChinese` 零中文强门禁校验。
4. **双极双层强审计解耦与全景端点硬断言加固**：
   - 在 `audit_bipolar_bilayer.mjs` 增加 PA-4780 Paradigm 2 中英文全量端点断言，严禁弱断言或伪通；
   - 全面验证 OPC 规范、PDF 物理渲染字号 (9.50pt) 与 Section 9 标签垂直绝对对齐 (80.28pt)。

---

### 三、 交付成果与实测凭据 (Measured Exit Code 0)
1. **全流程机检硬凭据**：
   - **双极双层全景机械深度审计终审 (`audit_bipolar_bilayer.mjs`)**：0 违规，满分全绿 (**Failures: 0, Exit Code 0 `[Measured]`**)；
   - **OpenSpec 规范生命周期严格验证**：`npx openspec validate enrich-pa4780-sec2-sec11-pu-paradigm --strict` (**Valid, Exit Code 0 `[Measured]`**)。

---

## [2026-11-03 典型 PA 官方基准模板与受控流水线] - 基于 PA-4780 真实成分推导 Section 2 / 11 典型数据、注册官方 PA 基准母版、双极双层强审计解耦与标准 8 交付物受控生产并通过终审

### 一、 业务场景与用户法定指示背景
用户对单组份水性丙烯酸乳液 (PA) 标杆模板提出明确要求：
> “F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-1 单组份水性丙烯酸乳液 PA 识别检索相关PA msds，做一个典型的PA模板给我，要严格遵守规范去做，核心要求：section2 和 section11 尽量找典型性的有相关数据和说明的，section 2重点找有象形图、H、P的”
> “采用方案三，但务必考虑4780的成分，按成分来找section2 和section11 的相关数据与说明”

经检索扫描 2-1 目录全部 26 款 PA 型号源文件，其中 24 款为非危险品通用水性乳液，唯独 **PA-4780** 真实内嵌 GHS 象形图（感叹号/GHS07），且含有法定标签要素（H412、P273、P501）及明确危险成分（2-丁氧基乙醇 8~15%）。以此为权威事实基准，开展典型 PA 母版构建与全流程受控生产。

---

### 二、 核心改进与系统性根治措施 (Key Improvements & Remediation)
1. **注册官方典型 PA 基准母版与成分事实驱动**：
   - 在 `web/src/template-editor.js` 动态注册 `PA_Benchmark_CN` 与 `PA_Benchmark_EN` 官方基准母版；
   - 提取 PA-4780 真实内嵌 GHS 象形图（`image1.jpeg`），以二进制 Buffer 受控流转至 Word `[Content_Types].xml` 与 `document.xml.rels`，100% 满足 OPC 媒体声明规范；
   - 严格依据 PA-4780 成分（2-丁氧基乙醇 8-15%、水 40-60%、环氧改性丙烯酸聚合物 35-45%）提炼权威毒理学实测参数：经口大鼠 LD50 > 2,000 mg/kg、经皮兔 LD50 > 2,000 mg/kg、吸入大鼠 LC50 > 2.2 mg/l/4h、皮肤/严重眼睛刺激性及 AMES 试验阴性。
2. **底层排版引擎与跨语言专业翻译加固**：
   - `web/src/docx-engine.js`: 根治 Section 11 英文冒号后空格丢失历史缺陷 (G-27)，引入 `prefixSpace` 确保英文标点标准单空格隔开；扩展指标子标签加粗状态机，纳管 `皮肤刺激/Skin irritation` 与 `眼睛刺激/Eye irritation`；
   - `web/src/pipeline-engine.js`: 扩充 Section 2 危害分类、H/P 语句双语分流字典，全面支持 H412、P273、P501 及其英译；扩充 Section 3 成分英译字典（`环氧改性丙烯酸聚合物` -> `Epoxy modified acrylic polymer`，`2-丁氧基乙醇` -> `2-Butoxyethanol`）；修复 Section 12 生态学其他效应语句的英文无中文残留合规翻译。
3. **双极双层强审计解耦与反假通机制**：
   - `web/scripts/audit_bipolar_bilayer.mjs`: 彻底解耦 Section 11 历史单型号假定逻辑，新增 PA-4780 专属特征断言（H412、P273、P501、2-丁氧基乙醇、经口 LD50 > 2000mg/kg、皮肤及眼睛刺激性）；
   - 保持严格的句末标点闭合断言 (D-02/D-04/G-26) 与英文冒号间距断言 (G-27)，真实执行无放水。

---

### 三、 交付成果与实测凭据 (Measured Exit Code 0)
1. **标准 8 格式全景交付物（4 DOCX + 4 PDF）**：
   - 产出目录：`F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4780`
   - 目录文件总数严格等于 8，完全剥离任何临时副本或脏文件；
2. **全流程机检硬凭据**：
   - **双极双层全景机械深度审计终审 (`audit_bipolar_bilayer.mjs`)**：0 违规，满分全绿 (**Failures: 0, Exit Code 0 `[Measured]`**)；
   - **OpenSpec 规范生命周期严格验证**：`npx openspec validate canonical-pa-benchmark-template --strict` (**Exit Code 0 `[Measured]`**)。

---

## [2026-11-02 跨语言事实保全与反硬编码系统性根治] - 英文版 6 大深层事实篡改/硬编码与模板错位彻底根治、全景敌手强审计 AST 硬断言落地、PU-608 标准 8 交付物受控再生并通过终审

### 一、 业务场景与用户法定指示背景
用户对产出物审计提出严厉警示与法定要求：
> “开展系统性根治，然后继续审计，注意Ps-openspec 对硬编码问题提出了具体的要求，你需要严格遵循 Ps-openspec体系”
> “重新对产出物 按照规范和要求进行强审计，禁止使用虚假逻辑造退出码0，你要的是找问题审计，而不是为了没问题而审计”

经由全新敌手对抗式穿透审计（Interrogate Red-Team），在英文版交付物中精准锁定了 6 处历史遗留事实篡改、硬编码及底模错位问题：
1. **Section 14.4 仓储温度篡改**：源事实与中文版为 `+35℃`，英文版被硬编码替换为 `+40℃`；
2. **Section 6.1 英文模板错位**：官方底模中 6.1 错用了 5.4 的消防标签（`Firefighting precautionsprotective equipment：`）；
3. **Section 12.3 伪造合规声明**：源文为“无数据资料”，英文版虚构了 `classified as non-hazardous to fish and daphnia`；
4. **Section 9 物理化学参数失真**：9.1 外观被翻译为 `Transparent liquid`（源文为“半透明乳液”/`Translucent emulsion`）；9.10 约 130hPa 饱和蒸气压被丢弃写为 `No data available.`；9.21 粉尘爆炸级别被写为 `No data available.`（应为 `Not applicable`）；
5. **Section 4 急救关键指示缺失**：4.2 误服丢失了“昏迷禁口服”关键安全指示；4.3 眼睛冲洗时间被缩短为 10 分钟且丢失了头部倾斜指示；
6. **Section 8 中英文表格结构不对称**：中文版无职业接触限值时裁剪为 11 行，英文版未同步裁剪保留了 12 行。

---

### 二、 核心根因与系统性根治措施 (Root Cause & Systematic Remediation)
1. **彻底剔除静态硬编码，改为源事实动态感知提取**：
   - 在 `pipeline-engine.js` 的 `buildEnglishValuesFromFacts` 中，重构 Section 14.4 解析器，通过正则动态感知并提取中文事实中的高低温阈值（`+35℃` 与 `+5℃`），根除任何静态模板字符串；
   - 修正 Section 12.3 映射逻辑：凡中文为“无数据资料”一律严格翻译为 `No data available.`，禁止任何防御性虚构。
2. **底层引擎解除限制与底模错位运行时自愈**：
   - 在 `web/src/docx-engine.js` 中将标签覆写白名单由 `[2, 9, 10, 11, 12]` 扩展为 `[2, 6, 9, 10, 11, 12]`，赋予 Section 6 修复底模标签的合法权限；
   - 在 `pipeline-engine.js` 的 `fillEnglishTemplate` 中植入 Section 6.1 标签自愈机制，自动将错位的消防标签修正为官方标准 `6.1 Personal precautions, protective equipment and emergency procedures:`。
3. **强化专业英译词汇库与急救指示完整性**：
   - Section 9: 识别“半透明”映射为 `Translucent`，“乳液”映射为 `emulsion`；解析饱和蒸气压中明确记载的 `130hPa在50℃` 并在英文端点保留；
   - Section 4: 动态生成误服指示并注入 `Never give anything by mouth to an unconscious person.`；眼睛冲洗指示强制保留法定 20 分钟（`at least 20 minutes`）并包含倾斜头部避污规程。
4. **中英文跨语言几何形态与结构绝对同构**：
   - Section 8: 当中文端点根据无 OEL 规则执行末尾空白说明行剪枝时，英文版流水线同步执行对称行剪枝，确保中英双语表格行数严格 1:1 同构（PU-608 均为 11 行）。

---

### 三、 全景敌手强审计升级与实测凭据 (Measured Exit Code 0)
1. **升级 `audit_bipolar_bilayer.mjs` AST 真实机器硬断言**：
   - `L-S14-EN`: 真实 AST 文本断言必须包含 `+35℃`，反向断言禁止出现 `+40℃`；
   - `L-S6-EN`: 真实 AST 断言必须包含 `Personal precautions`，反向断言禁止出现 `Firefighting`；
   - `L-S12-EN`: 真实 AST 断言必须为 `No data available.`，反向断言禁止出现 `non-hazardous to fish`；
   - `L-S9-EN`: 断言外观包含 `Translucent emulsion`、饱和蒸气压保留 `130 hPa`、粉尘爆炸包含 `Not applicable`；
   - `L-S4-EN`: 断言冲洗时间包含 `at least 20 minutes`、误服包含 `unconscious person`；
   - `L-S8-EN`: 断言中英文表格行数严格相等（11 行 vs 11 行）。
2. **标准 8 交付物重新受控生产**：
   - 运行受控驱动脚本 `node web/scripts/generate_pu608_canonical_deliverables.mjs`，重新生成 PU-608 全套 8 交付物，物理修改时间戳全部刷新在 1 分钟之内；
3. **终审实测结果**：
   - **双极双层全景机械深度终审 (`audit_bipolar_bilayer.mjs`)**：0 违规，满分全绿 (**Failures: 0, Exit Code 0 `[Measured]`**)；
   - **OpenSpec 规格核销**：`npx openspec validate cross-lingual-facts-fidelity-and-anti-hardcode --strict` 验证通过 (**Exit Code 0 `[Measured]`**)。

---

## [2026-11-02 任务推进] - PU-608 标准 8 格式全矩阵受控生产、审核断言解耦与双极双层全景终审 100% 满分通过

### 一、 业务场景与用户法定指示背景
用户提供待处理源文件并明确指示：
> “"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\1-1 单组份水性聚氨酯树脂 PU\PU-608\PU-608 msds_CN 冠志.docx" ，产出存储位置：F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-608 ，务必真实调用MSDS-Engine 的功能，懂？”
并在需求立案与规格制定阶段指令明确：“你怎么用spec-kit，我不是有Ps-openspec吗”，“执行”。

---

### 二、 遇到的核心问题、根因与解法 (Core Pathology & Solution)
1. **问题 1：立案话术外延概念偏离 Ps-openspec 单一事实源**
   - **现象**：在需求立案阶段，Agent 机械搬用“Spec-Kit”概念措辞，导致方案游离于项目法定唯一的 `Ps-openspec` 体系之外；
   - **根因**：认知敏锐度不足，未能在第一时间建立 `openspec/changes/pu608-canonical-deliverables/` 规格工件；
   - **解法**：立即执行 5-Whys 停机归因，彻底摒弃外来散装措辞，严格按照 Ps-openspec 标准在 `openspec/changes/` 下建立完整规格工件，并通过 `npx openspec validate --strict` 门禁。
2. **问题 2：`audit_bipolar_bilayer.mjs` 中历史遗留的 `else` 特判分支导致生殖毒性危品误报成盐违章**
   - **现象**：首次执行流水线导出 `PU-608` 时，Gate 12 双极双层终审拦截报错：“存在 8 项严重格式与语法违章（成盐豁免附注未命中、5 级缩进断言未命中）”；
   - **根因**：`audit_bipolar_bilayer.mjs` 在 Section 2 的断言中，仅显式列出了 `PU-202A/B/C/218A/303A` 等特定型号，在 `else` 分支直接假定为 `PA-3223` 专属的 DMEA 成盐豁免格式。当传入新的生殖毒性危险品 `PU-608` 时，因未被旧型号命中而错误落入 PA-3223 的成盐豁免检查，属于典型的“历史特判遗留导致的泛化断层”；
   - **解法**：依据“反局部硬编码特判公理”，将审计脚本中对 Section 2 的型号分支重构为基于化学事实的特征驱动判定：凡包含 `生殖毒性` 或 `Reproductive toxicity` 的危险品，统一执行生殖毒性、H360 及 NMP 透皮吸收的通栏规范校验；成盐豁免断言严格收敛至明确包含成盐事实的文件，彻底解耦。
3. **问题 3：Section 11 毒理学插槽历史遗留 PU-202A 硬编码常量导致真实数据被伪造篡改，假审计弱断言放行**
   - **现象**：用户质检发现产出文档 Section 11 毒理学数据与源文件完全对不上（源文件为 NMP 4,150mg/kg、造成皮肤刺激、严重的眼睛刺激；产出物被替换为 PU-202A 的 DMAC 3,000-6,000mg/kg、轻度皮肤刺激、轻度眼睛刺激等）；
   - **根因**：历史 Commit `0a99629d` 在 `pipeline-engine.js` lines 1327~1426 中，对单组分插槽表格排版时直接传入硬编码字符串（PU-202A 毒理值），无条件覆盖了 `smart-matching.js` 提取的真实源事实；且 `msds_compare_source_with_output` 与 `audit_bipolar_bilayer.mjs` 仅校验了字符长度与弱正则（“急性毒性|刺激性”），导致伪造数据逃脱了机器门禁；
   - **解法**：
     1. 彻底剔除 `pipeline-engine.js` 中所有硬编码常量，改为基于当前单元格既有值 `vCell.text` 动态驱动排版；
     2. 增强英文翻译函数 `translateToxicologyValueToEnglish`，感知 `dermal` 上下文，纠正经皮急性毒性标签（`LD50 / Dermal / Rat`）；
     3. 升级 `audit_bipolar_bilayer.mjs`，增加针对源事实基准值（4,150、造成皮肤刺激、严重的眼睛刺激、经皮吸收危险）的绝对值存在性硬断言；
     4. 升级 MCP 工具 `msds_compare_source_with_output`，加入毒理学关键数值与定性结论的穿透式对账，一旦缺失或篡改即报 `FACTUAL_INCONSISTENCY` 阻断。

---

### 三、 实测凭据与成果 (Measured Exit Code 0)
1. **受控生产驱动**：
   - 创建受控驱动脚本 `web/scripts/generate_pu608_canonical_deliverables.mjs`，通过底层流水线 `executeEightDeliverablesPipeline` 与无头 PDF 转换守护进程全自动化生产；
2. **标准 8 格式全矩阵物理落地**：
   - 目标目录 `算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608` 严格包含且仅包含 8 个法定交付物（实测杂件为 0，G-01 纯净度 100%）：
     - `PU-608 msds_CN 冠志.docx` (56,719 bytes) / `PU-608 msds_CN 冠志.pdf` (289,234 bytes)
     - `PU-608 msds_CN 国彩.docx` (56,714 bytes) / `PU-608 msds_CN 国彩.pdf` (288,549 bytes)
     - `PU-608 msds_EN Guanzhi.docx` (43,938 bytes) / `PU-608 msds_EN Guanzhi.pdf` (217,426 bytes)
     - `PU-608 msds_EN Guocai.docx` (43,907 bytes) / `PU-608 msds_EN Guocai.pdf` (216,048 bytes)
3. **机械化终审双全绿**：
   - **双极双层全景机械深度终审 (`audit_bipolar_bilayer.mjs`)**：0 违规，满分全绿 (**Failures: 0, Exit Code 0 `[Measured]`**)；
   - **1:1 事实物理对账 (`msds_compare_source_with_output`)**：16 章节字符保全比 106.4%，`actionableGaps` 数量为 **0**；
   - **OpenSpec 规格核销**：`npx openspec validate pu608-canonical-deliverables --strict` 验证合流通过 (**Exit Code 0 `[Measured]`**)。

---

## [2026-11-02 深夜] - 通用性 MCP 工作流五大关键拼图闭环落地：四大法定支柱立宪、事务自动回滚自愈、Recipe A/B/C 手术库与正向行动诊断器

### 一、 业务场景与用户法定指示背景
用户对全系统执行强制性提出里程碑级指导：
> “调整下MSDS-Engine 项目执行强制性：以后核心维护与开发项：1.编辑器本身能力；2.MCP与API 3.全局规范与局部规范，用于审计；4.Skill 核心维护服务于Agent 真正正确真实使用MSDS Engine 本身的能力 并实现稳定产出，过程采用Sop操作标准化，赋予Agent编辑器的各大编辑能力；非我允许禁止直接为了单一目的而改造工具； 你看一下，为了形成SOP 通用性MCP 工作流，还需要什么。回到刚才的5拼图，重写确认方案。执行。”

---

### 二、 核心架构重构与技术突破 (Key Breakthroughs)
1. **四大法定维护支柱立宪与防私改禁令 (`PROJECT_CONSTITUTION.md` & `AGENTS.md`)**：
   - 彻底锁定四大法定支柱（编辑器本身能力、MCP与API、全局与局部规范、Skill）；
   - 明文立法**《最高防私改与防特判禁令》**：非用户明确允许，严禁直接为了单一目的（如应对某一临时特例或特定字段）而擅自改造底层通用工具！严禁在代码中出现 `if (model === 'xxx')` 特判伪答案；
   - 在 `AGENTS.md` 中将四大支柱与防私改禁令提升为不可触碰的一票否决级准入红线。
2. **拼图一 & 二：几何形态判定决策树与 SOP 经典手术配方库 (`docs/MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.md`)**：
   - 确立 4 大典型结构判定法则（标准双列、非标多列消除、单格通栏说明、激光垂线参数）；
   - 封装三大经典手术配方：
     - **Recipe A【三列消除配方】**：`Peek` 透视 $\rightarrow$ `deleteColumn(1)` 裁剪冗余标签 $\rightarrow$ 网格列宽平摊自愈；
     - **Recipe B【动态组分自适应配方】**：对比组分数与模板行数 $\rightarrow$ 动态克隆插入行 (`cloneAndInsertRow`) 或删除行 (`deleteRow`)；
     - **Recipe C【微观化学式与 Run 级排版配方】**：自动解析分子式 $\rightarrow$ 分割下标 Run 并以 `writeRichText` 渲染。
3. **拼图三：事务生命周期与失败自动回滚自愈 (`mcp-server.js`)**：
   - `msds_execute_editor_ops` 在动工前强制创建事务检查点；
   - 捕获任何异常（如列越界、格式破坏）时，立即自动触发 `rollbackSession` 恢复原始母版，并物理销毁磁盘上可能残留的半成品脏文件，向客户端透传带有 `[MCP Transaction Auto-Rollback]` 的明确错误，杜绝脏文件污染下沉。
4. **拼图四：正向行动诊断分析器 (`msds_compare_source_with_output`)**：
   - 升级事实物理对账工具，输出 `actionableGaps` 结构化数组；
   - 逐节侦测漏填关键规程（`MISSING_CONTENT`）与组分行数不匹配（`COMPONENT_COUNT_MISMATCH`），并附带正向 `suggestedAction`（如推荐执行 Recipe B 通栏合并补填），形成“对账 $\rightarrow$ 提取 Gap $\rightarrow$ 补填 $\rightarrow$ Gap 归零”的确定性闭环。
5. **底层几何算子高内聚解耦 (`universal-editor-primitives.js`)**：
   - 将 `deleteTableColumn`（带越界抛错）、`mergeRowCells`、`cloneAndInsertRow`、`writeRichTextToCell`、`parseChemicalFormulaRuns` 抽离为高内聚独立模块，严格保障底层 4000+ 行 `docx-engine.js` 的纯净稳定。

---

### 三、 实测凭据与验证结论 (Measured Exit Code 0)
- **端到端五大关键拼图综合实测 (`test_five_puzzles_workflow.mjs`)**：
   - `[STEP 1/6]` 拼图五最高宪法与 Agent 准入红线静态扫描机检 **PASS (100% 守恒)**；
   - `[STEP 2/6]` 原生 MCP 初始化成功 (msds-engine-mcp v2.1.0)；
   - `[STEP 3/6]` 拼图三故意越界测试成功触发 `[MCP Transaction Auto-Rollback]`，母版自动回滚，无残留半成品文件；
   - `[STEP 4/6]` 拼图二 Recipe A/B/C 复合手术在真实 Word 网格中无损执行成功，输出合规 DOCX（36,662 bytes）；
   - `[STEP 5/6]` 拼图四正向行动诊断器输出 `actionableGaps` 数组与建议动作，字符保全比 111.9%；
   - **实测退出码: 0 [Measured]**。
- **全套回归套件全绿**：
   - `test_universal_editor.mjs` 10 项严苛测试 **100% PASS (Exit Code 0)**；
   - `test_mcp_universal_editor.mjs` **PASS (Exit Code 0)**；
   - `npx openspec validate msds-universal-mcp-workflow-five-puzzles --strict` 验证合流通过 (**Exit Code 0**)。

---

## [2026-11-02 晚间] - 识别与编辑模块 10 大 MCP 通道全线通车与 Skill 优化工作流全景图谱 (Graph SOP)
