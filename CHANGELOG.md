# MSDS Engine 变更与演进日志 (CHANGELOG)

## [2026-10-27 下午第二次迭代] - Section 11 严格单空行规范 (before=240) 与 Section 13 英文版内容格纯左对齐修正 (jc=left)

### 一、 核心复盘与缺陷根因
1. **Section 11 组分间距空两行缺陷 (Double Blank Lines)**：
   - **根因分析**：`detailParagraphs` 中后置组件（丙二醇丁醚、二乙二醇丁醚）字符串首字符带有前置 `\n`。而在 `renderFullWidthRow` 中每个组件本身已由独立段落 `<w:p>` 承载（段落开始自然进入下一行），前置 `\n` 在段首又插入了一个 `<w:br/>`，导致“段落换行 + 段首软回车”双重叠加，在 Word 中呈现为整整两行物理空行，且使版面过大把数据挤至下一页。
   - **整改与立法**：彻底移除字符串首字符的 `\n`，改由标准段落间距 `<w:spacing w:before="240"/>`（12pt / 1倍行高）精确控制间距，实现组件间严格且唯美地“空一行”（单空行隔离）。
2. **Section 13 英文内容格假性居中失真缺陷 (Fake Center Alignment in S13 EN)**：
   - **根因分析**：`pipeline-engine.js` 第 2509 行此前硬编码调用 `setParagraphAlign(p1, 'both', W_NS)` 强制两端对齐。而英文母版原装属性为 `jc="left"`。在包含多行软回车 `<w:br/>` 的英文段落中，`both` 会强行将短行单词拉伸分散，叠加单元格垂直居中后，视觉上严重变形为类似段落居中对齐的杂乱效果。
   - **整改与立法**：将英文版 Section 13 废弃处置方法内容单元格严格修正为纯左对齐（`jc="left"`），与母版 100% 吻合，恢复工整左边界。

### 二、 深度审计套件断言升级 (`audit_bipolar_bilayer.mjs`)
1. **Section 11 组分间距严格单空行断言**：断言组件 2 与组件 3 的 `<w:spacing>` 属性严格为 `w:before="240"`，且第一 Run 中严禁包含 `<w:br/>`（彻底杜绝双重空行）；
2. **Section 13 英文版纯左对齐断言**：断言英文版 Section 13 废弃处置内容单元格 `jc` 属性严格为 `left`（彻底杜绝两端拉伸与假性居中）。

### 三、 实测验收 [Measured Exit Code 0]
- 双极双层全景机械深度审计终审：`【双极双层全景机械深度审计 100% 满分通过】 (Failures: 0)`；
- 四维深度审计矩阵终审：`🎉 恭喜！四维深度审计全维度满分通过 (Exit Code 0)！`；
- 全部 8 格式标准交付物重新生成并满分通过。

---

## [2026-10-27 下午] - 英文版 Section 9 理化特性中英 1:1 同构对齐剪枝与标签叠词永久免疫根治 (Gate 14 建立与深度审计闭环)

### 一、 核心复盘与缺陷全景根因解密 (Section 9 EN 9.14 & 9.15)
1. **中英文理化特性行数错位与下移缺陷 (Row Shift Bug)**：
   - **现场表象**：用户指出 9.14、9.15 存在极为严重的质量缺陷——中文 9.13 对应英文 9.14，中文 9.14 对应英文 9.15，英文版比中文版凭空多出一行（英文 20 行 vs 中文 19 行）；
   - **根因深度透视**：
     * 英文母版 `en_base.docx` 在 9.4 槽位预置了 `9.4 Ionicity: Non-ionic`（离子性）；
     * PA-3223 中文母版无“离子性”指标（共 19 行：标题行 0 + 18 行物理量 9.1~9.18）；
     * 在 `pipeline-engine.js` 剪枝算法中，全面检查了饱和蒸气压、表面张力、分解温度等指标，却**唯独遗漏了对 `hasIonicity` 的探测与剪枝**；
     * 导致英文版中未被测量的 `Ionicity` 成为“死重幽灵行”，从未被删除；从而导致从 9.4 之后的所有小节序号向下整体平移 1 行（log Pow 被迫挤至 9.14，自燃温度被迫挤至 9.15，最终以 9.19 结束）。
2. **标签多重叠词毒瘤根因 (Stuttering Label Bug)**：
   - **现场表象**：
     * 9.14：`log Pow (n-octanol/water partition coefficient): partition coefficient): partition coefficient): No data available.`
     * 9.15：`Auto-ignition temperature: temperature: temperature: Not applicable`
   - **根因深度透视**：
     * **第一层毒瘤（DOM 残留）**：英文母版 XML 中，Row 15 与 Row 16 本身是两段式折行结构（`p[0]` 为 `log Pow (n-octanol/water`，`p[1]` 为 `partition coefficient)：`）。在 `docx-engine.js` 的 `formatSection9LabelCell` 重写标签时，只清空了 `p[0]` 的 Run，但**未从 DOM 树物理移除 `p[1]`**；
     * **第二层毒瘤（文本拼接积累）**：随后在 `pipeline-engine.js` 的 `formatEnglishLabelCell` 中，通过 `ps.map(p => p.textContent).join(' ')` 将已被重写为完整标签的 `p[0]` 与残留的 `p[1]` 暴力拼接，导致 `partition coefficient):` 和 `temperature:` 被成倍累加；且旧有的正则清洗无法匹配深层套娃重复。

### 二、 工业级彻底根治方案与防线下沉
1. **同构剪枝补齐 (`web/src/pipeline-engine.js`)**：
   - 补充 `const hasIonicity = cnIndicators.some(t => /离子性/i.test(t));`；
   - 增加 `!hasIonicity && /Ionicity/i.test(rowText)` 剪枝分支，同时覆盖 `hasSolids`、`hasCombustion` 等全部槽位；
   - 英文版 Section 9 严格且仅保留与中文母版 100% 对应的 19 行（标题 + 9.1~9.18），彻底消除行漂移。
2. **底层 DOM 物理净化与 Canonical 规范映射 (`web/src/docx-engine.js` & `pipeline-engine.js`)**：
   - `formatSection9LabelCell` 执行时强制物理移除首段之后的所有多余段落（`for (let i = 1; i < ps.length; i++) ps[i].parentNode.removeChild(ps[i])`），彻底切断历史折行段落的毒瘤链条；
   - 建立权威 Canonical 规范属性映射状态机（强制将匹配项映射为 `'log Pow (n-octanol/water partition coefficient):'`、`'Auto-ignition temperature:'` 等标准字符串），对任何模板污染实现 100% 免疫。
3. **文件锁机制与审计读取防御升级**：
   - `safeWriteFileWithLockGuard` 成功写入主文件时，自动同步刷新存在的历史回退文件 `(最新)` 等，防止版本滞后；
   - `audit_bipolar_bilayer.mjs` 中的 `loadDocXml` 升级为基于 `stat.mtimeMs` 动态获取物理上真正最新的交付物，彻底消灭读取陈旧历史副本导致的假阳性拦截。

### 三、 门禁立法与深度审计结果 [Measured]
1. **Gate 14 正式立法**：在全景规范中确立 `Gate 14: Section 9 中英文行数 1:1 同构对齐与标签叠词根除 (G-31 理化同构公理)`。
2. **深度审计套件升级 (`audit_bipolar_bilayer.mjs`)**：
   - 增加中英文 Section 9 行数严格 1:1 同构对齐断言（实测 19 行 vs 19 行，完全对齐）；
   - 增加英文 Section 9 全行小节序号（9.1~9.18）与行索引递增断言；
   - 增加全行标签连续多词叠词零容忍断言（`partition coefficient`、`temperature`、`pressure` 等叠词检出数均为 0）。
3. **真实实测验收 [Measured Exit Code 0]**：
   - 双极双层全景机械深度审计：`🎉 终审结论: 【双极双层全景机械深度审计 100% 满分通过】 (Failures: 0)`；
   - 四维深度审计矩阵终审：`🎉 恭喜！四维深度审计全维度满分通过 (Exit Code 0)！`；
   - 8 格式交付物（4 DOCX + 4 PDF）全部绿色通过。

---

## [2026-10-27 中午] - 英文版 Section 2 换行首字对齐与层级对齐 & Section 11 14 空格几何列对齐全面落地与双极终审

### 一、 核心复盘与排版问题根治 (Section 2 & Section 11 EN)
1. **Section 2 英文版换行首字对齐与层级对齐彻底攻克**：
   - **根因分析**：过去英文版 Section 2 沿用部分首行缩进或缺少显式层级分流，导致成盐声明在换行时第 2 行（`concentration limit >= 5%`）顶格回退或悬挂参差；四大子标题（`Prevention:` 等）与具体内容没有做到标题与标题对齐、内容与内容对齐；
   - **解决方案与状态机立法**：
     ① **成盐声明与分类块**：统一注入 `<w:ind w:left="480"/>`（零 hanging），换行时第 2 行首字母 `c` 直接与第 1 行首字母 `N` 垂直完全对齐；
     ② **四大子标题对齐**：`Prevention:`、`Response:`、`Storage:`、`Disposal:` 统一注入 `<w:ind w:left="480"/>`，实现标题与标题严格对齐；
     ③ **内容项层级对齐与换行首字对齐**：防范说明各项具体规程统一注入 `<w:ind w:left="960"/>`（零 hanging），内容与内容严格对齐，且各条目内部折行时续行起始坐标依旧对齐 960 dxa。
2. **Section 11 英文版端点与 LD50: 双列绝对垂直齐平工程根治**：
   - **根因全景剖析**：
     ① **端点列偏斜**：首行 `Toxicity: Dermal (Rat)` 中 `Dermal` 位于 x ≈ 97.3 pt 处，而原本设置 14 空格在 Word/LibreOffice 实际渲染下偏移至 x ≈ 108.5 pt（过冲 11 pt）；
     ② **LD50: 标签锯齿错位**：因英文单词长度不同（`Inhalation (Rat)` 16字符显著长于 `Dermal (Rat)` 12字符与 `Oral (Rat)` 10字符），在单空格下导致各行的 `LD50:` 标签发生高达 22 pt 的严重阶梯错位；
   - **双列网格化对齐解决方案**：
     ① **列 1 (端点首字对齐)**：`Inhalation (Rat)` 与 `Oral (Rat)` 行首前置空格精准收敛为**严格 8 空格**，渲染坐标锁定在 x ≈ 99.0 pt，与 `Dermal (Rat)` (x ≈ 97.3 pt) 误差仅 1.68 pt（完全垂直齐平）；
     ② **列 2 (LD50: 垂直对齐)**：在各端点与 `LD50:` 之间注入非对称字宽补偿空格（`Dermal (Rat)` 后补 3 空格、`Inhalation (Rat)` 保持 1 空格、`Oral (Rat)` 后补 5 空格），使三大行的 `LD50:` 标签全部精准垂直锚定在 x ≈ 164~166 pt 垂线上（误差仅 1.5 pt，小于 2 像素），呈现与中文版完全一致的严整表格列对齐视觉效果；
3. **多级文件锁防御与自愈机制**：
   - 当目标文件与一级备选路径被外部 Word/PDF 阅读器独占锁定时，流水线依次安全降级至 `(最新)`、`(更新)`、`(临时更新)` 路径，彻底终结 EBUSY 崩溃；审计套件与终审门禁同步实现多级备选路径无感穿透读取。

### 二、 双极双层全景深度审计套件与规范全面下沉
1. **审计工具升级 (`audit_bipolar_bilayer.mjs`)**：
   - 新增 Section 2 英文版成盐声明 `left="480"` 换行首字对齐断言（实测 9/9 命中）；
   - 新增 Section 2 英文版四大子标题 `left="480"` 相互对齐断言（实测 4/4 命中）；
   - 新增 Section 2 英文版防范说明具体内容 `left="960"` 相互对齐断言（实测 11/11 命中）；
   - 新增 Section 2 英文版零悬挂缩进断言（零 hanging，保证续行首字对齐）；
   - 升级 G-27/G-28 反多空格公理，将英文 8 空格端点列对齐与 3/5 空格 LD50: 标签补偿纳入法定白名单；
   - 新增 Section 11 英文版端点与 LD50: 双列绝对垂直对齐 AST 机器断言 (L-S11)；
   - 增强文件锁防御自动容灾与 `(更新).docx` / `(更新).pdf` 无感加载。
2. **三位一体规范立法**：
   - `MSDS中英文覆写排版与数据装配全景统一工业级规范.md`：新增 Gate 13 (G-30 首字换行对齐与层级公理)，更新 Gate 10 英文 14 空格规范；
   - `docs/MSDS_SPECIFICATIONS_COMPLETE_GUIDE.md`：同步收录 Section 2 英文层级对齐与换行首字对齐公理。

### 三、 验证与实测结论 [Measured]
- **流水线执行与 Gate 12 自动终审**：
  `node web/scripts/generate_pa3223_deliverables.mjs`
  * 双极双层全景机械深度审计终审：`【双极双层全景机械深度审计 100% 满分通过】 (Failures: 0)`
  * 四维深度审计终审：`🎉 恭喜！四维深度审计全维度满分通过 (Exit Code 0)！`
  * 真实退出码：`Exit Code 0`。

---

## [2026-10-27 上午] - 手做改版材料 OOXML AST 深度反编译复刻与审计换行语义感知全面升级 (Section 11 100% 完美复刻与防线下沉)

### 一、 核心复盘与手做版 AST 真实排版效果确立
1. **认知纠偏与手做母版权威地位确认**：
   - 彻底推翻了“将手做母版的多行软换行与 6 空格列对齐误判为格式缺陷”的机械主义偏见；
   - 确立手做版 [`PA-3223 msds_CN 冠志 手做改版材料.docx`](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223%20msds_CN%20冠志%20手做改版材料.docx) 为 Section 11 排版的法定金标准：
     ① **软换行分行 (`<w:br w:type="textWrapping"/>`)**：单元格内部通过文本环绕软换行符将各指标清晰分行，组分间空行物理隔离；
     ② **首列 6 空格垂直列对齐**：因首项为 `毒性：`（3个中文字符宽），后续 `吸入...` 与 `经口...` 行首键入严格 6 个半角空格，与 `经皮...` 在视觉纵向上实现绝对严整的垂直列对齐；
     ③ **免责行常规体**：Row 1（`该产品无可用的毒理学研究。`）与 Row 2（`下面是这些成分的毒理学数据。`）严格为常规体（`bold: false`）；
     ④ **粗细层级分明**：仅 3 大组分名称加粗，子标签（`毒性：`、`刺激性：`）与测试数据均为常规体；
     ⑤ **名词性状态声明保全**：`刺激性：无资料` 遵循母版规范，末尾无多余句号；
     ⑥ **宋体三轴锁定**：中文版 Section 11 的 `ascii`、`hAnsi`、`eastAsia` 均锁定为宋体。

### 二、 审计工具换行语义感知根治与全局规范立法
1. **审计盲区彻底根除 (AST-Aware vs Blind textContent)**：
   - 根治了直接读取 `p.textContent` 导致丢失 `<w:br/>` 软换行而引发的“假文本碰撞”与“假冒号无空格”假阳性误报；
   - 在 `audit_bipolar_bilayer.mjs` 中全面引入 `getPText(p)`，智能识别 `<w:br/>` 还原为 `\n` 后再行审查；
   - 增加对 Word OOXML 中 `<w:b w:val="0"/>` / `<w:bCs w:val="0"/>` 显式常规体声明的精准识别。
2. **规范文件三位一体同步固化**：
   - `SKILL.md`、`MSDS中英文覆写排版与数据装配全景统一工业级规范.md` 与 `docs/MSDS_SPECIFICATIONS_COMPLETE_GUIDE.md` 同步落地：
     * **G-26 标点语义分层公理**：叙述句句号闭合，状态短语声明保持无句号原貌；
     * **G-28 法定列对齐缩进公理**：确立 6 空格（CN）与 10 空格（EN）列对齐白名单；
     * **G-29 显式常规体公理**：免责行与测试值常规体保护；
     * **Gate 12 自动终审门禁**：`batchExportDeliverables` 导出交付物后自动执行双极双层深度审计，退出码 0 为充要条件，以后无需用户再次提醒。

### 三、 验证与比对实测证据 [Measured]
- **黄金手做深度比对**：`node web/scripts/deep_audit_handcraft_compare.mjs`：
  `==================== SECTION 11: 100% PERFECT MATCH ====================`（段落数、行数、粗细、字体、字号、软换行、6空格列对齐 100% 毫无差异）！
- **流水线生成与 Gate 12 自动终审**：`node web/scripts/generate_pa3223_deliverables.mjs`：
  标准 8 格式全部产出，自动触发全景深度审计与四维审计，**Exit Code 0** 满分通过！

---

### 一、 核心复盘与审计方法彻底根治 (Retro & Root Cause)
1. **审计盲区根因检讨**：
   - 过去审计过度依赖“正则关键词匹配 (Regex Search)”这种代理指标，造成“测试全绿灯但排版大崩溃”的严重遮羞布假象；
   - 过去审计完全丧失了对以下关键维度的感知能力：
     ① **段落结构同构性**（英文 Section 11 被压缩成 1 个大长段，关键词依然存在）；
     ② **标点闭合与悬挂**（行末悬空未闭合的冒号 `:` 或分号）；
     ③ **文本粘连与空格滥用**（`mg/kg刺激性：` 碰撞粘连，连续 6 个空格伪造对齐）；
     ④ **字体层级状态机**（整个单元格所有文字被盲目全部加粗，丢失专业对比）；
     ⑤ **单边审查盲区**（审计往往只扫描中文版，英文版残留制表符或缺陷被完全放过）。
2. **根治举措：确立“双极双层全景深度机械审计”为最高法则**：
   - 彻底废除关键词代理指标，建立真正的 OOXML AST 深度穿透审查；
   - 将全景深度审计固化为 **Skill + Engine 强制管道项**，任何交付物导出前必须 100% 跑通，存在 1 项缺陷立即一票否决阻断交付。

### 二、 核心交付与规格立法 (Delivered & Specifications)
1. **全局规范三位一体立法 (G-25 ~ G-29 & Gate 9 ~ 12)**：
   - 同步升级 `SKILL.md`、`MSDS中英文覆写排版与数据装配全景统一工业级规范.md` 与 `docs/MSDS_SPECIFICATIONS_COMPLETE_GUIDE.md`：
     * **G-25 双语结构拓扑同构公理**：中英文 Row、Cell、通栏内 Paragraph 数量必须 1:1 对等；
     * **G-26 标点完整性与句末闭合公理**：零悬挂冒号/分号/逗号；独立完整陈述句以句号闭合；零文本标签粘连；
     * **G-27 冒号间距公理**：中文冒号后 0 空格，英文冒号后严格 1 半角空格；
     * **G-28 反多空格排版公理**：正文严禁使用 `/[ ]{2,}/` 伪造对齐；
     * **G-29 值格字体分离公理**：标签加粗，数值与结论保持常规体；
     * **Section 11 双范式动态路由**：多成分通栏复合模式 (Paradigm 1) vs 单成分标准分列模式 (Paradigm 2)；
     * **自查口诀升级**：“六看六查”正式升级为“八看八查”。
2. **Engine 流水线内置质量门禁与强制审计管道 (Skill + Engine Mandatory Pipeline)**：
   - 在 `pipeline-engine.js` 中将 Gate 9、10、11 硬编码写入 `assertDeliverableQuality`；
   - 在 `batchExportDeliverables` 结尾挂载 Gate 12，自动执行 `runBipolarBilayerAudit`，一票否决阻断交付。
3. **六大排版缺陷 (D-01 ~ D-06) 系统性彻底修复**：
   - **D-01**：英文 Section 11 重构为 4 个独立段落，与中文版 1:1 四段同构；在 `standardizeEnglishTypographyAndLabels` 豁免通栏 Section 11，根除段落压平与强制加尾冒号缺陷；
   - **D-02**：彻底拔除英文 Section 11 P3 末尾悬挂冒号 `:`，统一以标准句号 `.` 收尾；
   - **D-03**：英文各端点之间统一采用标准分号加空格 `; ` 语义清晰分隔；
   - **D-04**：中文 Section 11 注入全角分号 `；`，彻底消除 `mg/kg刺激性：` 碰撞粘连；剔除 6 空格滥用；段落末尾闭合为全角句号 `。`;
   - **D-05**：在 `docx-engine.js` 落地 Section 11 G-11 粗细层级状态机（标签加粗，试验数值与结论严格为常规体）；
   - **D-06**：补齐全篇换行后的独立完整句子末尾标点（Section 4 `就医。`、Section 5 `喷洒水。`、Section 7 `更换被污染或浸湿的衣物。`、Section 2 成盐末尾分号 `；`）。

### 三、 验证与测试命令实测证据 [Measured]
- **流水线生成与 Gate 12 自动终审**：`node scripts/generate_pa3223_deliverables.mjs` -> 8 格式全部产出，自动触发双极双层深度审计，**Exit Code 0**！
- **双极双层全景深度审计**：`node scripts/audit_bipolar_bilayer.mjs` -> 全局层与 16 章节局部层 30+ 项机器断言 **100% 满分通过 (Failures: 0, Exit Code 0)**！
- **黄金手做比对**：`node scripts/deep_audit_handcraft_compare.mjs` -> 除已纠偏的 6 项缺陷外，全篇其余 15 个章节全部达到 **100% PERFECT MATCH**！
- **OpenSpec 规格变更严格校验**：`npx openspec validate handcraft-typography-and-s11-dual-paradigm --strict` -> **Valid (Exit Code 0)**，tasks 全部打勾。

---

## [2026-10-26 下午] - OpenSpec: 自适应通栏复合豁免工作流 (Mode B) 与四维深度审计体系正式合入 (PA-3223 标杆落地)
