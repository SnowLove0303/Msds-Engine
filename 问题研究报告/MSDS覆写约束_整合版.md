# MSDS 覆写约束清单（开发覆写模块用 · 以仓库 v3.29 为准，合并 v1.0 / v2.9 / v3.15 / v3.28）

> 来源仓库：https://github.com/SnowLove0303/AI-Agent/tree/main/MSDS%20Skill
> 本地参考：`F:\Skill\msds开发参考\AI-Agent`（主干=v3.29.0）、`wt-v3.28.0`、`wt-v3.15`、`wt-v1.0`、`AI-Agent/MSDS Skill/legacy_v2_9`
> 版本快照：`F:\Skill\msds开发参考\versions\`、`wt-*`
> 用法：后续覆写模块的每一条写入/删除/重排/审计行为必须能追溯到本清单编号；冲突处以 v3.29 为准。
> 记号：`[v1.0]` 最初版 R1-R14；`[v2.9]` 覆写核心；`[v3.15]` 模板白名单与交付评估层；`[v3.26.x-v3.28]` 语义路由与排版硬化；`[v3.29]` 现行最高优先级契约。

## 0 总则与模板权威
- OW-001 [v2.9][v3.29] 模板管结构与锁定表现，源文件管产品事实，禁止职责互换；禁止把模板示例产品与来源产品取并集。（出处：`legacy_v2_9/SKILL_v2.9.md §1`；`SKILL.md §1/§2A`）
- OW-002 [v3.29] 一切输出必须从权威模板字节级拷贝起步克隆后原位修改；禁止从空白文档、重建表组创建交付；禁止从已渲染中文输出派生英文文档。（出处：`SKILL.md §2A`；`docs/in_place_overwrite_contract.md`）
- OW-003 [v3.29] CN 交付必须克隆 `examples/template_reference.docx`，EN 交付必须克隆独立 `examples/template_reference_en.docx`；EN 不得加 CN 专用行凑容量。（出处：`SKILL.md §2/§2A`；`docs/template_baseline.md`）
- OW-004 [v3.29] EN source 记录仅存证，禁止作为生产母版；历史模板/旧快照仅回滚审计用，禁止作为当前生产母版。（出处：`SKILL.md §2`）
- OW-005 [v1.0][v2.9][v3.29] 无明确新批准模板时必须用内置基线；禁止用记忆旧模板、历史输出、回归示例替代；用户明确提供新模板仅对当任务有效，新基线须经明确升级指令。（出处：`legacy_v2_9/SKILL_v2.9.md §3`；`SKILL.md §2`）
- OW-006 [v3.29] 新批准模板立即取代旧基线；禁止从旧输出恢复几何/段落格式；换模板须同步更新文件名、SHA-256、结构基线并重拍快照。（出处：`SKILL.md §2`；`docs/template_baseline.md`）
- OW-007 [v3.29] 使用前校验中英文模板 SHA-256 钉死值（CN active `8b0b63…`、CN source `748f68…`、EN source `a5fef8…`、EN active `11e3da…`），变化则在克隆前整单阻断。（出处：`SKILL.md §2`）
- OW-008 [v3.29] 认定 16 表结构基线：CN 行数 `[10,16,6,6,5,4,3,16,24,6,18,6,3,5,9,2]`、EN 行数 `[9,16,6,6,5,4,3,16,24,6,18,6,3,5,9,2]`；中英文物理行数差异不违规，但语义覆写规则一致；禁止增删表格或改变章节顺序。（出处：`SKILL.md §2`；`scripts/section_overwrite_rules.py validate_section_template`）
- OW-009 [v2.9][v3.29] 模板内示例文字（PEA-4139、示例成分/危害/毒理/生态值、S8.2 两行示例 OEL）仅示意结构，禁止作为产品事实；输出前必须清除或替换为源实证行。（出处：`SKILL.md §2`；`legacy_v2_9/SKILL_v2.9.md §1`）
- OW-010 [v2.9] 参考/已批准 MSDS 仅可学排版与映射惯例，禁止将其产品值作为新产品证据；`reference_docx` 禁止作为事实源。（出处：`legacy_v2_9/SKILL_v2.9.md §1/§3`）
- OW-011 [v3.29] 完整结构快照仅以 `tests/template_snapshot.json` 与 `tests/template_snapshot_en.json` 为准；历史版本快照不得作为模板权威。（出处：`SKILL.md §2`）
- OW-012 [v1.0] 源为 legacy `.doc` 时须转换工作副本再处理，禁止覆盖原件。（出处：`legacy_v2_9/SKILL_v2.9.md §3`）

## 1 变异白名单与格式锁定（Agent 突变边界）
- OW-020 [v3.29] Agent 仅可请求四类语义操作（由 runtime 执行）：写源实证内容到既有标签关联值格；源缺席/不支持时清空值格；整行删除仅限专用空/不支持行；仅在 S3/S8.2/S9/S15 规则允许处插入完整源实证样式行。（出处：`SKILL.md §3A`；`docs/template_mutation_whitelist.md §Writable regions`；`scripts/template_mutation_whitelist.py`）
- OW-021 [v3.29] 序号文本与标签措辞不可变；唯一例外是整行省略后的数字前缀连续化，以及源实证 S9 测试条件限定词；其他标签一字不可改。（出处：`SKILL.md §3/§3A`）
- OW-022 [v2.9][v3.29] 加粗模板标签为硬锁：存活标签须保留原文、标点空格、编号（映射期锁定）、`w:rPr`（字体/东亚字体/字号/加粗/颜色/下划线/间距）、`w:pPr`（对齐/缩进/制表/行距/段前段后）、格属性、边框合并列宽行高；禁止重建标签，复用原模板 XML。（出处：`legacy_v2_9/SKILL_v2.9.md R2`；`SKILL.md §3A`；`docs/template_mutation_whitelist.md §Locked regions`）
- OW-023 [v3.29] 非加粗模板自有前缀/子标签同样硬锁（不以加粗推断归属）：S2.8 路由前缀、S11.1/S11.7 中间子标签、三列行前两列、四列 S8.2 非值列；三列行永不压成两列，四列 S8.2 永不压成散文。（出处：`SKILL.md §2A/§3A`；`docs/template_mutation_whitelist.md`）
- OW-024 [v3.29] 复合/多列行可写目标仅为末端值格：两列 S2.8 按“锁定路由前缀+可写值尾”切分，清空仅去尾留前缀；S11.1/11.2/11.7 三列行仅末格可写。（出处：`SKILL.md §3A`；`docs/template_mutation_whitelist.md`）
- OW-025 [v3.29] Agent 禁止直插象形图、改写别名、重编号标签、编辑页眉页脚、套公司覆盖；此类为 runtime 受控操作并独立审计。（出处：`SKILL.md §2A/§3A`）
- OW-026 [v2.9][v3.29] 禁止破坏性 API：`paragraph.text=`、`cell.text=`、清空全部 run 后塞 run0、重建加粗标签、用空格/制表假对齐、把正文样式整段拷到标签段、为凑源顺序任意删行。（出处：`legacy_v2_9/SKILL_v2.9.md §6`；`SKILL.md §3`）
- OW-027 [v3.29] 保留表格跨页契约：表可跨页，存活行 `cantSplit` 与重复表头设置须与新鲜克隆一致；禁止加人工分页凑版式；页脚 `P` 防裁 guard 打时间戳时保留。（出处：`SKILL.md §2A/§3`；`docs/template_mutation_whitelist.md`）
- OW-028 [v3.29] 每 S1-S16 表必须走 `scripts/section_overwrite_rules.py` 登记的语义 writer、值域、空值策略与结构变异边界；未登记/位置型 payload 直接阻断。（出处：`SKILL.md §3`；`scripts/section_overwrite_rules.py`）
- OW-029 [v3.29] 禁止仅按行位置推断字段匹配；映射必须指明目标节与目标槽；缺席/重复/歧义目标槽在写前阻断。（出处：`SKILL.md §3`）
- OW-030 [v3.29] 中文新增非加粗正文沿用基线正文字形约定；英文同几何下用兼容专业正文 run 格式并自然换行，禁止假对齐。（出处：`SKILL.md §3`）
- OW-031 [v3.26.5][v3.29] 值排版硬边界：一切非空可写值 run 须显式 `w:rFonts`（ascii/hAnsi/eastAsia/cs）+`w:sz`/`w:szCs`，禁止继承 Normal/表样式；CN 宋体 12pt、EN Times New Roman 12pt；值非加粗、格垂直居中、段左对齐（S3 三数据格水平+垂直居中例外）；单行一 run（writer 拥有整格时）且无悬空空段。（出处：`SKILL.md §全局骨架与值格式规则/§17C`；`docs/template_mutation_whitelist.md`）
- OW-032 [v3.29] CN 禁止全局字体/间距/缩进归一化；EN 仅允许经 `normalize_en_document()` 以同一 EN 模板重断值格段/run 属性，不得向 CN 归一化、加行、改标签几何；EN 新增值统一用模板内批准的 Times 12pt `w:rPr` 范例（仅字符格式）。（出处：`SKILL.md §17B/§17C`）
- OW-033 [v2.9] 紧凑版式强制：禁止空段、空非标签 run、制表、重复半全角空格、尾空格、为对齐加的手动换行、固定/最小行高留白；一语义值 normally 一段，自然换行。（出处：`legacy_v2_9/SKILL_v2.9.md R6`）
- OW-034 [v2.9] 空 XML 清理须内容感知、标签感知：每格至少保留一段，模板有意段落不动；重点查 S5.4/S6.1/S11.2/S12.2/S13/S14。（出处：`legacy_v2_9/SKILL_v2.9.md §8`）

## 2 源文件只读、工作副本与处理顺序
- OW-040 [v2.9][v3.29] 源文件只读；一切编辑基于新鲜模板副本；禁止继续在已损坏输出上累积补丁，出问题回新鲜/模板安全态重做；禁止输出路径指向源文件。（出处：`legacy_v2_9/SKILL_v2.9.md §4`；`SKILL.md §20A`）
- OW-041 [v3.29] 强制四阶段顺序：全量抽取→基于约束归纳→固定结构覆写→微调（隐藏/重排）→审计→渲染 QA；语义映射/取舍/双语投影/追溯属第二阶段，写计划先决后写格，空行抑制/授权插行/前缀重排属第四阶段；快检查不得替代终门。（出处：`SKILL.md §1/§6`；`openspec/efficiency_contract.json`）
- OW-042 [v3.29] 克隆前 slot 注册：以新鲜克隆建槽，非空模板值对象可写，有意空白对象除非语义契约标明输入槽否则不可写；S8.2 数据行仅专用 writer 处理；S8 `建议` 为源门控普通槽，有源实值才写，无源留空记审计；S11.1/11.7 子标签锁定，写前先按端点骨架对齐补齐再按源存在性删行，防串行。（出处：`SKILL.md §2A`；`docs/template_mutation_whitelist.md`）
- OW-043 [v3.29] 不支持项删除用最小安全边界：整行恰为一项才删整行，否则仅压制该项不伤兄弟与合并/网格；抑制后四变体语义项集必须一致。（出处：`SKILL.md §2A`）
- OW-044 [v3.29] 几何血缘阻断：不能证明源自钉死快照、或允许抑制后几何不等价，一律不交付；现行 CN/EN/EN-source 字节钉死，变基线哈希在克隆前阻断； prior 输出/渲染 PDF/未批准拷贝不得替代模板。（出处：`SKILL.md §2A`）
- OW-045 [v2.9] 两遍架构：先不动 DOCX 建 `源节|源标签|归一化义|原值|限定|目标模板标签|置信|动作`（MAP/MAP_TO_OTHER_INFO/OMIT_NO_TARGET/OMIT_MISSING_DATA/REVIEW_AMBIGUOUS），再从 untouched 模板新鲜拷贝布局安全覆写。（出处：`legacy_v2_9/SKILL_v2.9.md §4`）

## 3 源实证、缺失抑制与行处置
- OW-050 [v2.9][v3.29] 永不臆造：CAS/EC 号、浓度、GHS 类别、H/EUH/P 码、毒理/生态结果、接触限值、UN/运输分类、法规结论、官方英文法定名。（出处：`SKILL.md §4`；`legacy_v2_9/SKILL_v2.9.md R1`）
- OW-051 [v2.9][v3.29] 无对应值则整项不显示：删完整项而非只清空值；不留空标签、空行、占位符、模板示例值。（出处：`legacy_v2_9/SKILL_v2.9.md R4/§7`；`docs/template_mutation_whitelist.md §空值规则`）
- OW-052 [v3.29] 模型区分 `SUPPORTED/EXPLICIT_MISSING/NOT_APPLICABLE/ABSENT`；仅显式端点态可出占位符，缺席模板自有字段直接抑制；禁止把 S11.7 子字段匹配要求泛化为全 S11 通删规则。（出处：`SKILL.md §4`）
- OW-053 [v3.29] 客户面缺失默认 `无数据`/`No data available`，禁止加 `源文件未提供` 类溯源话术；但 S2 `其他危险` 留源话（如 `无适用资料。`）、S11.7 仅源显式缺失才写 `无数据`、缺席子行隐藏。（出处：`SKILL.md §4`）
- OW-054 [v2.9][v3.29] `不适用`/实质否定结论不是缺失：`非危险品`、`无危险反应`、`初沸点以下无闪点`、`未满足分类标准`、`无刺激` 有源则保留。（出处：`SKILL.md §4`；`legacy_v2_9/SKILL_v2.9.md R4`）
- OW-055 [v2.9][v3.29] S11/S12 节级说明句（如 `该产品无可用的毒理学研究。`）为实质上下文，有支撑成分/参考数据时保留作无编号说明行；若 S11/S12 端点全缺席或显式缺失，仅留源说明行并删模板端点/示例行；其后禁止跟起草/评审/索数话术。（出处：`SKILL.md §4`；`legacy_v2_9/SKILL_v2.9.md R4/R11`）
- OW-056 [v3.29] S9 整行省略：纯缺失占位属性整行删，终面不得见纯 `无数据` 属性行；保留 `不适用`、实测值、源实证 `其他信息`；按原语义序连续重排。（出处：`SKILL.md §4/§6`）
- OW-057 [v3.29] S9 一属性一行：禁合并水溶性+粘度、离子性+其他信息等；`NCO含量` 独立，出现于其他信息内须先拆分；其他信息仅收无更具体槽的源实证信息（如 MFFT/Tg/羟值）。（出处：`SKILL.md §4`；`docs/section_mapping_rules.md §S9`）
- OW-058 [v2.9] 缺失占位判定：`无数据/无数据资料/暂无数据/无可用数据/无适用资料` 等仅作不支持展示判据，终面省略整项；单格 `无数据` 仍省略。（出处：`legacy_v2_9/SKILL_v2.9.md R4`）
- OW-059 [v3.29] 模板示例值永不得因未清空而变成产品事实；`source_grounding.py` 对一切非空语义值查源/追溯/公司翻译覆盖并记 `matrix-report.json`；非危 GHS 回退话术仅源显式非危分类时可用。（出处：`SKILL.md §源解释与追溯门/V3.25.0`）
- OW-060 [v3.29] 有意义源换行在既有值格内作 Word 换行保留；禁止空段、制表、重复空格、纯 `/`、`／` 行；合成 ` / ` 分隔须先变语义换行，`通风/排气`、`有/无` 等紧凑源式原样保留。（出处：`SKILL.md §源解释门/§10`；`docs/section_mapping_rules.md §合成 `）

## 4 连续编号
- OW-070 [v2.9][v3.29] 先省略后编号：抑制/删行全部定稿后再按节可见序连续 `N.1,N.2…`；只改数字前缀，不改标签措辞标点、加粗、run/段格式、缩进对齐、表几何与项序。（出处：`legacy_v2_9/SKILL_v2.9.md R12`；`SKILL.md §3/§6`）
- OW-071 [v2.9][v3.29] 无编号子行/H-P 行不占主号；相邻重复号允许同主项子行（尤其 S11 急性毒性多路由）；按唯一主项号审计，不按 Python 对象 id。（出处：`SKILL.md §6`；`legacy_v2_9/SKILL_v2.9.md R12`）
- OW-072 [v2.9][v3.29] S11/S12 保留源定端点号，源门控省略后要求有序不重现，不对 11.7 类规范端点重排；S9 在整行删缺失行后连续且终面无纯缺失行。（出处：`SKILL.md §6`）
- OW-073 [v2.9] 节标题不计数；禁把子项提为父项凑数；逐节从 `.1` 起，禁止跨节串计数器；源语义序在重复子项内保留。（出处：`legacy_v2_9/SKILL_v2.9.md R12`；`SKILL.md §6`）
- OW-074 [v3.29] S9 用五字符 `9.n` 前缀槽（`9.1` 后模板分隔空格），删 `9.12` 后不得留陈旧单空格宽。（出处：`docs/section_mapping_rules.md §General`）

## 5 S1 产品标识与公司叠加
- OW-080 [v2.9][v3.29] S1 身份三角色：题头/标题产品位=型号；CN `产品名称` 值按公司惯例留空（禁写型号）；CN `中文名称`=中文产品名+1 半角空格+型号；EN `Product name`=已评审专业英文名+1 空格+型号（必填，不得由型号/模板示例/未审词典派生，化学范围不得窄于中文源）；页脚 MSDS 标识=`<MODEL>-MSDS`。（出处：`SKILL.md §5`；`docs/section_mapping_rules.md §S1`；`legacy_v2_9/SKILL_v2.9.md R13`）
- OW-081 [v2.9][v3.29] 同语言冠志/国彩仅允许 `supplier_name/supplier_address/telephone/fax/footer_company` 不同；其余产品/安全内容一字不同即阻断；先一语言建一次内容再套公司覆盖。（出处：`SKILL.md §14/§15`；`legacy_v2_9/SKILL_v2.9.md R14`）
- OW-082 [v2.9][v1.0] 冠志：`广州冠志新材料科技有限公司`；地址/电话/传真以当任务权威源/模板为准。 схх国彩 CN：`英德市国彩精细化工有限公司`、`广东省英德市白沙镇太平村更古坑凯迪工业园区`、`86-763-2811205`、`86-763-2811024`。（出处：`SKILL.md §14`；`docs/section_mapping_rules.md §S1 overlay`）
- OW-083 [v3.29] 英文公司名为受控展示译法（Guanzhi/Yingde Guocai 默认），非注册法定名主张；用户给官方注册英文名/址则立即取代默认。（出处：`SKILL.md §14`）

## 6 S2 危险性概述
- OW-090 [v3.29] 仅源实证分类/标签要素；禁止继承模板示例 GHS 类别、象形图、信号词、H/P、环境声明；产品级 S2 事实与组分级 S3 GHS 证据分域，不得坍缩。（出处：`docs/section_mapping_rules.md §S2`）
- OW-091 [v3.29] 有码必逐行：一 H/EUH 一逻辑行，一 P（含 `Pxxx+Pxxx`）一逻辑行，码与整句同行，仅 Word 自然换行可断；保源序；禁多条并一段；禁为对齐在句内随意断行。（出处：`SKILL.md §9`；`docs/section_mapping_rules.md §Multi-H/P`；`legacy_v2_9/SKILL_v2.9.md R10`）
- OW-092 [v3.29] P 四组标题（预防措施/事故响应/安全储存/废弃处置）为值格内语义结构非新标签；按源分组抽取保序，空/孤儿组头与空内容一并压制；已映射组禁扁平化、标 duplicate、静默丢；行内标题须在验证边界处切分，禁粘到上一 P 句尾。（出处：`SKILL.md §9`）
- OW-093 [v3.29] CN S2 题头选既有固定语义槽不改标签；源 `2.2标签要素` 进模板 `2.3GHS标签要素` 槽（非信号词槽），值仅为验证的特殊物质注意（如 `请注意以下物质：`+物质/阈值）；S3 组分 GHS/H 码/阈值注为组分路由证据，禁抄进 2.2/2.3散文，阈值从句仅属源实证注意时可留；`2.4信号词` 仅收 `危险/警告/无信号词/No signal word/无/None/Not applicable`，标签注散文禁入此。（出处：`SKILL.md §9`；`docs/section_mapping_rules.md §CN槽投影`）
- OW-094 [v3.27.11][v3.29] S2.8 五路由独立事实：按源义映射吸入/食入/皮肤/眼睛/症状体征并各自留溯源；禁止把总论 `未被分类` 抄进路由；缺席/纯缺失哨兵路由留空致整行删，后路由值禁前移顶替；H/EUH 逐路由独立比对，仅压制被覆盖路由，其余路由与源 2.7/2.8 行全留；禁“一提即全消”总开关；S2.6 内路由急救句留 P 响应组，禁升格为健康危害。（出处：`SKILL.md §9`；CHANGELOG v3.27.11）
- OW-095 [v3.29] S2 客户面自包含：源有 GHS 象形图则原图入模板既有象形格（不写 `无数据`/None/alt/描述）；无图仅由显式验证 GHS 分类解析并记审计，模糊散文禁推断；禁出 `见2.4-2.6` 类互见；信号词/H/P 各自可见。（出处：`SKILL.md §9`）
- OW-096 [v3.29] S2 写完先删纯 `无数据` 整行（含 `眼睛：无数据`）， survivors 按原序 `2.x` 连续（重复子行共号，无图象形行无编号保留）；保留 `无刺激/不适用/无危险反应` 等实质否定；`2.3其他危险` 有源显式（含 `无适用资料`）则保留参排，无源才隐藏。（出处：`SKILL.md §9`）
- OW-097 [v3.26.4][v3.29] 无码自然语言危害/防范/贮存/处置陈述禁删禁留空：`ghs_code_resolver.py` 反向解析为标准 P 码并归四组；`semantic_dispatcher.py` 定信号词（如 `警告词：警告`→`警告`）并把 S3 胺中和/SCL 阈值注路由进 S2.3。（出处：`SKILL.md §GHS反解`）
- OW-098 [v3.29] S2 路由为克隆前独立阻断：应急概述须显式源句，禁由 H/P/物理/健康/其他拼装；一事实默认独占一目标，`shared` 例外须列全目标与理由；禁位置型 `s2.row[1]` 目标。（出处：`SKILL.md §源解释门`）
- OW-099 [v2.9] S2.1 GHS 分类值一分类/H 码一行；PA-4902 回归 `依然液体+H226` 仅同事实内错字+主码同在时可受控订正并记证据路由。（出处：`SKILL.md §全局源保真`）
- OW-100 [v3.29] S2.2 逐字：保留源特殊物质注意原文（含特定浓度限，限值粘解释行不另起第三行）；S2.5/2.6 逻辑码行；S2.3 固定 `标题+说明` 两行形。（出处：`SKILL.md §全局源保真/§9`）

## 7 S3 成分组成
- OW-110 [v2.9][v3.29] 源化学名/CAS/范围原样：保留 `商业机密/N/A`，不推断隐藏成分；每组分独占一物理数据行，禁多组分换行挤一行；源多于模板槽则原位克隆样式组分行保 OOXML 几何。（出处：`SKILL.md §2`；`scripts/section_overwrite_rules.py S3`；`legacy_v2_9/SKILL_v2.9.md §9`）
- OW-111 [v3.29] S3 三格全写：化学名/CAS/含量三数据格， both 水平+垂直居中；组分 GHS/H 码/阈值注为路由证据，禁追加入 S2.2/2.3。（出处：`SKILL.md §全局值格式/§9`；`docs/section_mapping_rules.md §S3`）

## 8 S4-S7 急救消防泄漏操作贮存
- OW-120 [v2.9][v3.29] 按功能映射，去提取换行伪影，文案紧凑；禁止用模板示例新增安全建议；S4-S7/ S10/S13/S14 仅值格+授权数字前缀可动，无行重建（S10 最小安全行省略例外）。（出处：`docs/section_mapping_rules.md §S4-S7/S10`；`scripts/section_overwrite_rules.py`）

## 9 S8 接触控制与个体防护
- OW-130 [v3.29] 按语义进既有 PPE/控制标签，禁造模板外复合标签；EN 用 `Control parameters/Exposure controls/Respiratory/Hand/Eye-face/Skin and body protection/protective gloves/breakthrough time/glove thickness`；`EN 374` 等标准原样保留。（出处：`SKILL.md §10`）
- OW-131 [v3.29] 源 `8.1控制参数` 限值/控制参数话语进模板 `8.2工程控制` 行；源 `8.2暴露控制` PPE 行进模板 `8.1暴露控制` 块；语义映射非位置拷贝；先从分格/制表/行内值/有义换行复原每条 PPE 标签值界，再按呼吸/手/手套材料/FKM/IIR/NBR/建议/眼/身映射；标签后残尾报污染，不得顶替权威值格；未知/歧义 PPE 标签进评审阻断，禁按行位硬派。（出处：`SKILL.md §10`；`docs/section_mapping_rules.md §S8`）
- OW-132 [v3.29] `氟化橡胶–FKM:/丁基橡胶–IIR:/丁腈橡胶–NBR:` 形源行须拆进既有材料标签格+值格，值格禁空；`8.2工程控制` 与工作场所组分控制参数块分开；缺席工作场所块整体隐藏，不渲 `无数据`。（出处：`SKILL.md §10`）
- OW-133 [v3.29] S8.2 用模板顶层四列行：一格 `工作场所组分控制参数` 父行+锁定表头 `物质/依据/类型/数值`+数据行；仅源实证数据行可写/克隆，父行表头措辞拓扑网格锁定，两模板示例 OEL 行必须清除；有验证源记录则替换为源数据行，无源则删整块（含父/头/数），嵌套源表须先纳入源清单再判缺席；禁为缺席块合成 `无数据` 行。（出处：`SKILL.md §2`；`docs/template_mutation_whitelist.md`）
- OW-134 [v3.29] 模板 `建议：` 标签锁定，非加粗值格源门控：有实质源建议才写，无源留空记源存在性审计，不编造；合成 ` / ` 先变语义换行，`通风/排气`、`有/无` 紧凑式原样；值行仅 `/`、`／` 直接阻断。（出处：`SKILL.md §2A/§10`）
- OW-135 [v3.29] S8 输出标签永不改写，终稿与新鲜模板骨架比对，相对基线的标签变化即阻断；源侧标签值污染在抽取期评审，独立值格权威，残尾只留评审证据；不得拿孤立模板基线断言其既有示例为覆写缺陷。（出处：`SKILL.md §10`）
- OW-136 [v3.29] S8.2 存活时五列网格、四逻辑数据格、`gridSpan`、列宽、父/头行、数据行属性须继承新鲜克隆；S11.4 格垂直对齐亦然；此为输出态门禁，只拦漂移，不修正式模板、不做全局格式化。（出处：`SKILL.md §源解释门V3.25.3`；`docs/template_mutation_whitelist.md §v3.25.3`）

## 10 S9 理化特性
- OW-140 [v3.29] 每源属性独立事实对独立输出行；禁合并水溶性+粘度、离子性+其他信息等；`不适用` 具名属性仍独立成行，仅纯缺失值压整行；`NCO含量` 独立，混入其他信息须先拆；其他信息仅收无更具体注册槽的源实证信息。（出处：`SKILL.md §4`；`docs/section_mapping_rules.md §S9`；`scripts/section_overwrite_rules.py S9`）
- OW-141 [v3.29] S9 唯一标签例外：源明确测试条件/限定词（如 pH 溶液浓度、表面张力溶液浓度、测量温度）可带入属性标签以保属性身份与含义；仅加源实证限定词，不得改属性名、不得编造条件；须保模板 `9.n` 前缀槽、分隔空格、加粗/run/段/格格式与全局版式；英文同条件翻译。（出处：`SKILL.md §全局骨架/§4`；`docs/section_mapping_rules.md §S9`）
- OW-142 [v3.29] 同属性多行按测试条件与值分别映射；缺失复本可省而不压制已支撑限定结果；两支撑事实无独立行可表时按插入规则加完整样式源实证 S9 行或按未决阻断，禁合并。（出处：`docs/section_mapping_rules.md §S9`）
- OW-143 [v3.29] S9 发布前逐源属性按语义键、标签限定词、值、处置比对输出；合并行、漏支撑属性、丢/改限定词、无支撑限定词、省实质 `不适用`、留可见缺失行，均阻断；并验删行后连续编号与 CN/EN×冠志/国彩技术事实一致。（出处：`docs/section_mapping_rules.md §S9`）
- OW-144 [v2.9] S9 属性定位可用模糊匹配或行号的专用高阶 writer；新标签须经 `allow_label_edit` 并保 `9.1-9.9` 双空格、`9.10-9.24` 单空格的五宽冒号对齐。（出处：覆写模块 `msds_template_editor.write_section9_property`；技能 S9 标签规则）

## 11 S10 稳定性与反应性
- OW-150 [v3.29] 仅等义概念映射；源缺“应避免条件/禁配物”则该项消失，不留空值；序号前缀、标签措辞加粗缩进间距对齐保持新鲜模板锁定几何，仅值格与授权数字前缀可动。（出处：`docs/section_mapping_rules.md §S10`；`scripts/section_overwrite_rules.py S10`）

## 12 S11 毒理学（最高优先）
- OW-160 [v3.29] 禁标点优先切分；先按 `端点→研究/试验块→结构化字段→值` 分层解析。（出处：`SKILL.md §11`）
- OW-161 [v3.29] 结构化字段：试验类型、受试物/物质、暴露路由、物种、试验气氛、剂量/LD50/LC50、代谢活化、结果、评估、分类、方法/指南、证据限定/类似产品研究；`Species: Rabbit` 一逻辑行禁拆；一端点下多研究分块保留；Buehler 与 LLNA 分研究；Ames 与体外染色体畸变分研究；经口/经皮/吸入急性禁合并；源路由序在模板支持内保留。（出处：`SKILL.md §11`）
- OW-162 [v3.29] 先对齐模板完整物理 S11 骨架再判源存在性/清行；预压缩列表不是合法位置 payload；11.1 路由行与 11.7 子行按子标签匹配，未命中端点阻断不猜；11.1/11.7 中间子标签非值，仅末值格定源存在性；源未提急性路由则该空行隐藏，源显式缺失语留该路由行。（出处：`SKILL.md §11`；`docs/template_mutation_whitelist.md`；`scripts/section11_alignment.py`）
- OW-163 [v3.29] 11.1/11.2/11.7 三列行前两列锁定加粗标签（源版式不同亦然），仅末值格可写；禁把 `经口/吸入/经皮` 或 11.2/11.7 子标签当值，禁把值串入下一行；11.7 精确端点投影：`生育力/致畸形/体外遗传毒性` 仅由同名源字段填充，源显式 `无数据资料` 留该端点，无匹配/空白子行隐藏，禁把体外遗传毒性研究数据挪入空白生殖子行。（出处：`SKILL.md §11`）
- OW-164 [v3.29] S11 为源字段投影非推理：仅写验证源/语义载荷明示的端点值、物种、结果、分类、方法、证据限定；禁因邻字段存在而补方法/物种/分类/类似产品限定/总体评估/附加信息结论。（出处：`SKILL.md §11`）
- OW-165 [v3.29] 源 `主要粘膜刺激性` 归既有语义槽 `11.3主要眼睛刺激性`，不改锁定标签与源结果值，禁复写入 `11.10附加信息`。（出处：`SKILL.md §11`）
- OW-166 [v3.29] 研究结果用源实证字段行：受试物/物质、物种、结果、分类、方法/指南及支撑证据限定 `对类似产品的研究`；急性经皮/吸入结论保源直接评估话术，禁换成缺源解释或编造 LD50/LC50。（出处：`SKILL.md §11`）
- OW-167 [v3.29] 源给结构化研究结果时禁出 `原发性皮肤刺激/Primary skin irritation` 标签，用结构化研究块；11.2 重复皮肤刺激题头（含 `皮肤-/skin -`）、11.3 重复眼睛刺激题头（含 `眼-/eye -`）、11.1 已被模板拥有的毒性/路由题头，仅去重复题头，余下源结果逐字保留；此去重为 S11 显式规则，禁全局推断。（出处：`SKILL.md §全局源保真/§11`）
- OW-168 [v3.29] 源显式缺失端点值则留该端点行写原缺失占位；源无该端点字段则压制模板多余行；S11/S12 端点全缺席或显式缺失仅留源说明行；简单结论（如 STOT 单次 `基于现有数据，未满足分类标准。`）可留一字段值行，不过度拆分。（出处：`SKILL.md §11`）
- OW-169 [v2.9] S11 当前多列合并格几何锁定；`S11.4` 格垂直对齐与新鲜克隆一致。（出处：`SKILL.md §2`；`docs/template_mutation_whitelist.md`）

## 13 S12-S14 生态处置运输
- OW-170 [v3.29] 逐端点映射非散文块：S12 专业生态毒理术语，保 OECD 方法与证据限定；源 `生态毒性` 必进既有 `12.1` 行，禁被模板前导说明注行吞掉；说明注行无源匹配即删，禁贴模板散文；模板专有说明行隐藏。（出处：`SKILL.md §13`；`docs/section_mapping_rules.md §S12`）
- OW-171 [v3.29] S12.1-12.3 与说明注：源实证注保留于保留单格值槽，无源匹配模板示例注行删；短值后隐藏空段。（出处：`scripts/section_overwrite_rules.py S12`；`docs/section_mapping_rules.md`）
- OW-172 [v3.29] S13 紧凑专业处置话术源实证；S13 源说明行并入模板单格注槽，保留末两列处置行；S14 按公路铁路/海运/空运/特殊预防独立映射，仅源支撑用 ADR/RID/IMDG/IATA；S14 值格内 UN 号/正式运输名/危险类别/包装组/特殊预防各一逻辑行，禁分号打包串与 `按源文件列示` 类溯源语。（出处：`SKILL.md §13`；`scripts/section_overwrite_rules.py S13/S14`）
- OW-173 [v2.9] S13-S14 紧凑连续散文，非源/模板明示不逐句分段；S14 温度/食物/酸碱预防用自然换行，不强制手分行。（出处：`legacy_v2_9/SKILL_v2.9.md §9`；`docs/section_mapping_rules.md §S13/S14`）

## 14 S15-S16 法规与声明
- OW-180 [v3.29] S15 仅留源实证法规行并删尾空行，空模板行不是法规要求；保源序；S15 加粗结构题头 `其它的规定：/符合下列法规要求：`（及英文等价）为锁定单格题头非可写注值，其语义识别与物理行号无关，他行省略永不解锁它们。（出处：`SKILL.md §13`；`docs/template_mutation_whitelist.md`；`scripts/section_overwrite_rules.py S15`）
- OW-181 [v2.9] S15-S16 非用户明确公司 boilerplate/更新政策，禁静默现代化或替换法规/声明文本，走源实证事实范围。（出处：`docs/section_mapping_rules.md §S15-S16`）
- OW-182 [v3.29] S15/S16 单格注值仍走非空值排版与非加粗契约；S16 免责声明源实证范围，无行重建。（出处：`SKILL.md §全局值格式`；`scripts/section_overwrite_rules.py S16`）

## 15 跨语言与跨公司一致性
- OW-190 [v3.29] 四输出同源一归一化事实模型；跨语言等价为事实、数字、限定词、路由、方法、CAS、浓度、分类语义等价，措辞可异事实不可漂；禁由已渲染 CN 输出翻译做 EN，CN/EN 须同源自同一归一化源事实。（出处：`SKILL.md §1/§15`；`scripts/output_matrix.py`）
- OW-191 [v3.29] CN/EN 事实值语义等价全查，保限定词（approximately/>/</类似产品证据）、标准与不确定性，不静默升级证据；英文须为专业 SDS 英语，不直译中文语序；用 `resources/professional_translation_glossary.tsv`、`section_translation_rules.md`、`structured_toxicology_translation.md` 为规范翻译层。（出处：`SKILL.md §8`）
- OW-192 [v3.29] S2.8 EN 路由前缀（Inhalation/Ingestion/Skin/Eyes/Signs and symptoms）为加粗模板锁，仅其后描述尾可写；S11 EN 子标签（Oral/Inhalation/Dermal/Fertility/Teratogenicity/In vitro genotoxicity）留批准模板格。（出处：`SKILL.md §2A/§17C`）
- OW-193 [v3.29] 同语言跨公司内容除白名单外须一致；跨公司产品/安全差异阻断。（出处：`SKILL.md §14/§15`）

## 16 审计与发布阻断（一票否决）
- OW-200 [v2.9][v3.29] 审计非咨询：任一适用审计非零即阻断；交付前按适用跑：缺失压制、OpenSpec 执行记录与空值行、S9 整行省略与连续重排、连续编号、锁定标签几何、空白、S2 H/P 版式、S11 结构化字段研究、源覆盖事实台账输出追溯、英文术语、CN/EN 事实等价、冠志国彩白名单差、页脚题头产品身份。（出处：`SKILL.md §16`；`legacy_v2_9/SKILL_v2.9.md §12`）
- OW-201 [v2.9][v3.29] 阻断项：可见纯缺失占位；编号断档；S11 合并研究或字段值对断裂；路由/顺序映射错；生硬禁用英语；跨语言事实漂移；跨公司产品安全差异；表几何破损、裁剪重叠、大片空白、页脚错。（出处：`SKILL.md §16`）
- OW-202 [v2.9][v3.29] 渲染为发布门：每产出 DOCX 全页 100% 目检，修完重渲至洁净；禁仅 XML/文本检查后交付。（出处：`legacy_v2_9/SKILL_v2.9.md R11`；`SKILL.md §16`）
- OW-203 [v3.29] OpenSpec 执行记录为执行门非审计替代：批前 `agent_execution` 须评审（OpenSpec ID/版本、读源全表、ack 全 true、规定操作序、Agent 突变边界、新鲜克隆值格只写 fail-closed 模式）；`agent_execution_contract.py` 在克隆前验，缺/偏/陈旧阻断；终门 `audit_openspec_overwrite.py` 兼查锁定骨架格式跨页与空值行空段人工间距遗漏编号。（出处：`SKILL.md §OpenSpec门`）
- OW-204 [v3.29] 源解释追溯为克隆前门：批前须齐 `source_coverage`（源单元清单+源哈希+计数+图/表+空 unmapped/unreadable）、`fact_ledger`（稳 ID+精确定位+原文+单元 ID+证据型）、`source_mapping`（每事实每 S1-S16 处置）、`output_traceability`（每写/并/隐/不写目标连源事实/批准派生/显式缺席决）、`section2_routing`（每 S2 事实稳路由，默认独占，共享例外明示）；覆盖缺口、不可读区、未决/歧义/冲突、无处置事实、无证据输出值，克隆前阻断；`source_absent` 与 `source_unreadable` 区分，仅评审缺席/不支持决可触发空行动。（出处：`SKILL.md §源解释门`；`scripts/source_interpretation_contract.py`）
- OW-205 [v3.29] 机械/判断分工：机械（文件 IO、克隆、值格写、S2/S9 抑制重排、图插入、题头页脚戳、审计执行、S1 供应商块、S3 转录、S9 排序、逐字标准码）无判断；Agent 判断（源事实核验、S2 定级、S11 端点槽映射含别名、H/P 措辞、EN 专业翻译保限定证据级、致敏研究拆分、缺失与不适用之分、公司覆盖、跨语言等价、目检）逐项记 `AGENT_DECISION` 带源据，错判可追溯；禁批量正则语义匹配，抽取器只给候选带溯源，Agent 处置。（出处：`SKILL.md §20`）
- OW-206 [v3.29] 事实文件门：`MODEL.json` 须含标准化 `zh`、评审 EN（`translation_review` 为空）、`source_sha256`、`s8_control_parameters`、评审 `source_mapping`/`source_coverage`/完整 `fact_ledger`/评审 `output_traceability`/评审 `agent_execution`（突变边界与现行 OpenSpec 一字不差）；映射绑同 model+原源 SHA、覆 S1-S16、列唯一源定位与原文、每事实处置为 mapped/omitted/not_applicable/source_only/duplicate（须理由）；conflict/unresolved、needs-review、未分类目标、无溯源事实、无追溯输出目标、缺节，全部阻断。（出处：`SKILL.md §20`）
- OW-207 [v3.29] 源发现与非旁路门：`source_ingest.py` 选源，`--source-dir` 过滤后须唯一候选，多候选须显式 `--source`；锁文件与正式 `*_MSDS_(CN|EN)_(冠志|国彩)` 输出永不为候选，正式输出禁作源；输出/缓存目录禁作源址；源注册 `.docx/.docm/.doc/.odt/.rtf/.xlsx/.xls/.txt`，DOCX/DOCM 直抽，DOC/ODT/RTF 经 LibreOffice DOCX 适配（保原路径 SHA），表/文无 16 节猜测适配前阻断，PDF 仅出版禁作源；`build_matrix` 验原源 SHA、型号、16 节、双语层、规范 15 槽 S2 投影、评审映射后才克隆；禁由渲染输出翻译、拿旧输出打补丁、写第二模板、绕 `msds_pipeline.py`/白名单/发布审计；不支持/歧义源报阻断不静默近似。（出处：`SKILL.md §20A`）
- OW-208 [v2.9] 门清单：内容溯源（无模板示例外溢、每展示值源支撑或明确授权、无不支持项、无缺失占位值）；产品身份（题头码=源型号、`1.1产品名称` 空、`中文名称`=中文名+空格+型号、页脚标识对）；锁定格式（`audit_locked_labels.py`，仅允许必需连续重排数字差）；编号连续（`renumber_visible_items.py --audit-only`）；S2 H/P（多 H/EUH、多 P 各一逻辑行保序码句不分）；空白（`audit_whitespace.py`）；结构（高危节快照比）；目检全页。（出处：`legacy_v2_9/SKILL_v2.9.md §12`）

## 17 版本差异备忘（以 v3.29 为准的收敛说明）
- OW-210 [v1.0→v3.29] v1.0（`wt-v1.0`，VERSION 标 MSDS Skill 1.0 / 内基线 Unified Eight-Deliverable v3.6.2）已为八交付雏形：默认八交付（4 DOCX 母版+4 PDF）、`§2A` 原位覆写最高优先契约、四阶段 `抽取→归纳→覆写→微调` 雏形；v3.29 在此上叠加 OpenSpec 执行门、源解释五记录门、S2 路由器独立阻断、S8.2 五列网格门、S11 三列骨架先对齐门、EN 独立母版与 12pt 值排版门。（出处：`wt-v1.0/MSDS Skill/SKILL.md`；`SKILL.md §1/§2A/§源解释门`）
- OW-211 [v2.9→v3.29] v2.9（`legacy_v2_9/SKILL_v2.9.md` R1-R14）为中文覆写不可变基线：源实证范围、加粗锁、不仿形重构、无对应值不显示、最小安全删、紧凑版式、正文范例、题头页脚值可变版式不变、保义与不确定性、S2 多 H/P 语义换行、渲染门、产品身份三角色、遗漏后连续、双公司默认；v3.x/v1.0/现行皆为加法超集，S11 结构化毒理为增强层，禁删 v2.9 无关行为，发布前 `audit_v29_inheritance.py` 对规范 v2.9 ZIP 必过。（出处：`legacy_v2_9/SKILL_v2.9.md`；`SKILL.md §v2.9继承`；`docs/v2_9_inheritance_contract.md`）
- OW-212 [v3.15→v3.29] v3.15（`wt-v3.15`）引入模板变异白名单与飞书 17 节骨架契约、统一交付评估与发布阻断证据层；现行保留白名单为唯一写边界、S8.2 表头与单格父行锁、S15 加粗题头非值槽、空值行抑制后编号等。（出处：`wt-v3.15/MSDS Skill/SKILL.md`；`docs/template_mutation_whitelist.md`）
- OW-213 [v3.26.3-v3.28→v3.29] 中间版本硬化：非危 S2 抑制与重排、GHS 反解与确定性语义分发、统一起值排版与独立行 playbook、标准 EN 母版与格式锁、S3 居中与 S11 子标签锁、源保真全局+局部规则、Agent 覆写 SOP、S11 路由聚合修复、预检阻断兼容、EN 排版契约、PA-4902 全局/局部门、S2 逻辑行结构、组分 GHS 进 S2 路由、毒性题头去重收敛到 S11 显式规则、模板换基、S2 健康危害按路由独立、效率重构（SemanticMaster/多图单 run/预检脚手架/计时遥测）；现行凡与 v3.29 冲突以 v3.29 为准。（出处：CHANGELOG v3.26.3-v3.28.0；`SKILL.md` 对应章节）

## 附：约束提取工作底稿
- `constraints_work/v1.0.json`（130 条，源 wt-v1.0 SKILL+docs）
- `constraints_work/legacy_v2.9.json`（115 条，源 SKILL_v2.9 R1-R15 + CHANGELOG_v2.9）
- `constraints_work/v3.15.json`（102 条，源 wt-v3.15）
- `constraints_work/v3.28.0.json`（129 条，源 wt-v3.28.0 + v3.28.0-fullzip；经与 v3.29.0 全文 diff 确认 SKILL 仅 8+/8- 行，系远程语义客户端移除→离线确定性规则，不改变覆写语义）
- `constraints_work/v3.29.json`（166 条，源 AI-Agent 主干 SKILL 982 行 + docs + scripts + openspec + CHANGELOG v3.25.0-v3.29.0，已排除识别优化/效率遥测/TDS）
- 本清单正文已完整覆盖 v3.29 SKILL 全文、whitelist、mapping rules、section rules、v2.9 R1-R14 与版本差异，可直接作为覆写模块约束输入；5 份 JSON 为工作底稿备查。

<!--END-->
