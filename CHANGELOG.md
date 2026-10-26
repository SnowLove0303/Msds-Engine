# MSDS Engine 变更与演进日志 (CHANGELOG)

## [2026-10-26 早晨] - PA 系列丙烯酸酯与特异指标英译适配、中文值格首行缩进清理与 Section 13 四行门禁闭环

### 核心交付 (Delivered)
1. **PA 系列（丙烯酸酯类）8 格式端到端一键生产**：
   - 针对 `PA-3223` 标准型号，通过官方受控流水线（`POST /api/msds/pipeline/generate-eight`）成功生成标准 8 格式（4 DOCX + 4 PDF）；
   - 源文件安全留存为 `PA-3223 msds_CN 冠志_源文件留存.docx`，严禁绕开官方流水线私自修改产出物。
2. **PA 系列特殊组分与毒理指标英译完善 (Gate 4 零中文门禁 100% 绿灯)**：
   - Section 3 新增组分英译映射：`羟基丙烯酸酯聚合物` -> `Hydroxy acrylic polymer`、`丙二醇丁醚` -> `Propylene glycol butyl ether`、`N,N二甲基乙醇胺` -> `2-Dimethylaminoethanol`；
   - Section 11 毒理学指标新增动物急性毒性正则识别：适配 `（鼠）LD50：＞2000 mg/kg` 转为西文标准 `(Rat) LD50: > 2000 mg/kg`；
   - Section 11 空缺端点动态精简：对于源文未测的皮肤刺激、眼睛刺激、致敏性、致突变性空行进行动态剪枝，消除英文底模自带的历史残留参考数据；
   - Section 12 生态毒理与持久性英译防踩坑：增加无可利用毒理研究免责声明识别；调整正则优先级，解决 `不易生物降解` 被 `易生物降解` 截胡导致的文字半英半中污染。
3. **中文母版值格公文首行缩进与两端对齐清理 (Gate 6 断言防护)**：
   - 在 `buildBaseChineseEngine` 阶段新增全表值格清洗逻辑，自动拔除底模残留的 `w:firstLine` 首行缩进与 `w:jc val="both"`，确保所有值格 100% 纯左对齐与自然词距。
4. **Section 13 中文母版四行独立结构对齐 (Gate 7 门禁保障)**：
   - 将 `buildBaseChineseEngine` 中的 Section 13 逻辑由历史的 3 行收敛改为与英文版及 Gate 7 严格对齐的标准 4 行独立结构（标题行 + 两行独立说明行 + 处置方法行）。

---

## [2026-10-23 傍晚] - Pstack 防线下沉自迭代：新增 Gate 8 门禁与 5 维无死角审计基座

### 根因与复盘 (Root Cause & Retro)
- **踩坑现象**：在针对 `PU-608 msds_CN 冠志.docx` 的人为破坏排查考核中，初版审计脚本漏检了 Section 9 外观值格内部“数值文字内容不变但被非法加粗（`bold=1`）且字体被污染为 Calibri”的破坏行为；
- **深层根因**：
  1. 初版差分脚本在 `bText === pText` 时错误采用了短路逻辑，跳过了 Run 级（`<w:rPr>`）属性的扫描；
  2. 既有 Gate 1~7 仅校验了段落级左对齐，未将《ARCHITECTURE.md》第 5 条“G-11 字体分离（数值严禁加粗、中文严禁 Calibri）”下沉为机械化断言代码，导致规则停留在散文层；
- **防线下沉闭环 (Defense Escalation)**：
  1. **正式确立 Gate 8（值格数值常规体与字体纯净度断言门禁）**：在 `web/src/pipeline-engine.js` 的 `assertDeliverableQuality` 中正式落地 Gate 8 机械断言代码，一旦检测到非子标签数值异常加粗或出现 Calibri 字体污染，立即一票否决阻断交付；
  2. **升级规范与宪法文档**：在《MSDS 中英文覆写排版规范 (v5.0.0)》第五章、`ARCHITECTURE.md` 与 `AGENTS.md` 中同步锁定 8 大门禁；
  3. **固化机械化测试用例**：编写 `web/tests/test_gate8_assertion.mjs`，已实测验证对破坏文件的 100% 敏锐拦截与对正品文件的 100% 绿灯通行。

---

## [2026-10-23 下午追加] - 中英文覆写全景大一统规范落地、Section 2.1 分类修复与 Recommendation 对齐

### 核心交付 (Delivered)
1. **全篇值格 100% 纯左对齐与字词大间距根除 (Flush Left Mandate)**：
   - 彻底粉碎底模残留的 `both`（两端对齐）与 `distribute`（分散对齐），全量强制 `w:jc val="left"`；
   - 采用自然词距（Natural Word Spacing）断行，彻底消除了 Word 两端对齐强行拉大英文单词间距与中文字距的恶性排版；
   - 缩进彻底清零（无首行/左缩进），全篇 108 个值格段落自动化断言非左对齐数为 0。
2. **第一列“文字对文字”垂线对齐与 Section 11.10 防弹飞 (565 dxa) 闭环**：
   - 确定无序号标签（如 `Chemical category:` / `GHS Pictograms:`）强制右缩进对齐法则，首字母与上方有序号标签文字首字母严格垂直对齐；
   - 攻克 `11.10`（5 字符宽 452 dxa）超出 420 dxa 导致制表符跳步弹飞的隐蔽故障，将 Section 11 悬挂缩进基准自适应放宽至 `565 dxa`（底模原生规范），文字首字母 `A` 完美对齐。
3. **英文版 Section 8 Recommendation: 参照中文版取消缩进**：
   - Section 8 中的 `Recommendation:`（建议：）参照中文版规范，彻底清除缩进，顶格纯左对齐加粗。
4. **中文版 Section 2 2.1 GHS 危险性类别丢失根治**：
   - 根因定位：解耦算法对规整的双列普通行（非单列、非多标签复合行）误触发复合块解耦，导致 `2.6 其他危害` 被错判为分类冲突，使 `ghs_classification` 打上 `REVIEW_AMBIGUOUS` 并被底模剪枝作为无值行物理删除；
   - 闭环修复：严格限定复合块解耦仅对单单元格行（`!cell1`）或多标签复合行生效；针对 `REVIEW_AMBIGUOUS` 增加分类优先事实提取门禁，坚决杜绝误删底模核心行；
   - 交付验证：中文版 `2.1 GHS危险性类别： 生殖毒性物质，类别1B（H360）` 完璧归赵，后续 `2.1~2.6` 序号恢复正常。
5. **发布《MSDS 中英文覆写排版与数据装配全景统一工业级规范 (v5.0.0)》**：
   - 作为系统决定 Web 编辑器导出与 Agent API 全自动生产的最高法定真理源（Single Source of Truth），实现全量 8 交付物质量闭环。

---
## [2026-10-23] - 英文智能匹配引擎与全章节排版工业级深度校准（8 大核心问题闭环）

### 核心交付 (Delivered)
1. **Section 2.5 防范说明工业级规整**：
   - 彻底剔除值单元格开头重复注入的 `Precautionary statement(s):` 总标题；
   - 引入穿透式换行提取器（`getCellTextWithLineBreaks`），支持 `<w:br/>` 级深度拆分；
   - 四大分类小标题 `Prevention:`、`Response:`、`Storage:`、`Disposal:` 全量设为 **Arial 9.5pt Bold**，其下规程设为 Regular；
   - 各大类之间插入原生物理空段落（`\n\n`）实现清晰的空行隔离。
2. **Section 3 成分数据网格豁免法则（防误伤机制）**：
   - 明确数据网格（Data Cell）与题头标签（Label Cell）边界，Row 4+ 具体成分名称为普通数据网格，**绝不加粗（Regular）**，且**绝不追加冒号**；
   - Row 3 表头行（`Chemical name`、`CAS NO.`、`Concentration % (w/w)`）保持加粗但清洗末尾冒号。
3. **全章节标签与换行首字高精度垂直对齐**：
   - 采用悬挂缩进（`420 dxa`）与 Run 级 Tab 制表位（`<w:tab/>`）几何组合，实现第一行标签首字与第二行换行首字像素级垂直对齐；
   - 连根清洗多段合并导致的残留重复词（如 `pressure: pressure:`、`temperature: temperature:`、`partition coefficient): partition coefficient):`）。
4. **Section 11 毒理学二级标签精准加粗与续行净化**：
   - `Oral:`、`Inhalation:`、`Dermal:` 等二级标签精准设为 **Arial 9.5pt Bold**；
   - 续行首列（Row 4, Row 5）彻底净化为空白，消除输出裸冒号 `[:/]` 的排版瑕疵。
5. **Section 13 处理方法绝对居中**：
   - `Disposal methods:` 单元格强制注入 `<w:vAlign w:val="center"/>` 与 `<w:jc w:val="center"/>`，且彻底清空内部 `<w:ind>`，实现水平垂直绝对居中。
6. **Section 15 单列法规子标题加粗**：
   - `Other provisions:` 与 `Complies with the following regulations:` 自动识别并加粗（Bold），具体法规条目保持 Regular。
7. **页脚排版与最新修订日期对齐**：
   - 公司名称单元格强制设置 `<w:jc w:val="left"/>` 实现严格左对齐；
   - 修订日期标签严格首字母大写 `Revision Date: YYYY/MM/DD`（右对齐）；
   - 建立陈旧时间自动对齐机制，淘汰 2023/2024 等历史滞后时间，全量对齐最新生成时间（`2026/10/23`）。

### 遇到问题与解法 (Problems & Solutions)
- **问题 1（换行丢失与样式污染）**：底模写入时部分引擎使用 `<w:br/>` 导致 `p.textContent` 无法识别多行，误将整段识别为单行，导致小标题加粗被覆盖且末尾被错误追加冒号。
  - **解法**：编写 `getCellTextWithLineBreaks` 递归遍历 DOM 树中的 `br/cr/p` 节点，还原真实的段落换行结构后再做分流处理。
- **问题 2（门禁拦截）**：初版尝试使用 `w:tabs` 注入 540 dxa 制表位时，触发了全仓法定质量门禁 `assertDeliverableQuality`（Gate 1 强制要求 Section 9 悬挂缩进必须为 420 dxa 且严禁包含 `<w:tabs>`）。
  - **解法**：遵循承重墙约束，撤回 `w:tabs`，保持 `w:ind` 为 420 dxa，利用 OpenXML 原生将悬挂边界作为默认制表位的特性，在 Run 级输出 `<w:tab/>`，既满足垂直对齐需求，又 100% 绿灯通过底模质量门禁。
- **问题 3（文件外部锁定 EBUSY）**：因用户在外部编辑器（如 Word/WPS）中打开了目标交付物，导致流水线覆写时触发 `EBUSY: resource busy or locked`。
  - **解法**：引擎已集成 `safeWriteFileWithLockGuard` 自动降级写入机制，安全写入 `${base} (更新).docx` 与对应 PDF，保障生产不中断。

---

## [2026-10-23] - Section 2 GHS 象形图图片无损跨语言移植与视觉对齐

### 核心交付 (Delivered)
1. **GHS 象形图图片节点跨引擎无损移植 (`transferDrawingToCell`)**：
   - 排查发现此前英文版仅输出纯文本字符串 `[GHS08]`，缺失真实的 GHS 图片；
   - 改造 `buildBaseEnglishEngine`，在危品模式下优先探测中文母版（`baseCnEngine`）Section 2 中的 `<w:drawing>` 图片节点；
   - 自动调用 `transferDrawingToCell` 将高清 GHS 象形图（`word/media/image_ghs_...png`）二进制流及 OOXML 关系映射同步写入英文 DOCX；
   - 冠志英文版与国彩英文版双双拥有与中文版一致的高保真 GHS 象形图图片，视觉图文并茂 100% 对齐。

---

## [2026-10-23] - Section 2 危害品英文装配与中文母版 1:1 绝对镜像同构

### 核心交付 (Delivered)
1. **彻底拔除 Section 2 虚构假数据与死重行**：
   - 物理删除英文底模未与中文母版对齐的 Row 1 `2.1 Emergency Overview` 虚构假数据行（原代码写死吸入有害、刺激等假数据）；
   - 物理删除底模死重行（`Physical and Chemical Hazards`、`Health Hazards`、`M`、`N`、`O`、`P` 等占位行），整表严格收敛为与中文标杆完全对称的 **8 行法定拓扑**。
2. **序号与行拓扑 1:1 绝对镜像对齐**：
   - Row 1: `2.1  GHS Hazard Classification:` -> 生殖毒性 1B (H360)；
   - Row 2: `2.2  GHS Label Elements:` (右列空，彻底清除非法占位符 `"F"`)；
   - Row 3: `GHS Pictograms:` -> 无序号子标签，精准动态推导为单图 `[GHS08]`，彻底清除虚构的 `[GHS07]`；
   - Row 4: `2.3  Signal Word:` -> 动态英译为 `Danger`；
   - Row 5: `2.4  Hazard Statements:` -> 动态英译为 `H360: May damage the unborn child.`；
   - Row 6: `2.5  Precautionary Statements:` -> 完整保留 4 阶段防范规程；
   - Row 7: `2.6  Other Hazards:` -> 精准承接透皮吸收事实（`Risk of cutaneous absorption of N-Methyl-2-pyrrolidone (NMP).`），终结被错误塞入“理化危险”的合规笑话。
3. **动态象形图与信号词推导器 (`deriveGhsPictograms` + `deriveSignalWord`)**：
   - 彻底废除象形图硬编码，基于中文母版事实动态判断生殖/致癌/刺激/易燃/腐蚀等，实测仅生成合法象形图。

---

## [2026-10-23] - Section 1 英文规范与约束落地：用途行业词典动态装配与分类修饰语对齐

### 核心交付 (Delivered)
1. **Section 1 产品用途专业英译转换器 (`translateRecommendedUseToEnglish`)**：
   - 彻底废除旧代码中粗暴写死、虚构“纺织、胶粘剂”假数据的 `/皮革|纺织|纸张|粘合剂/i` 正则截胡逻辑；
   - 建立高精度应用领域行业词典（覆盖金属涂层、透水地坪、纸张涂层、木器漆、皮革涂饰、塑料涂层等 14 大细分领域），严格基于中文母版事实进行保序、去重、动态合成标准英文语法句式；
   - PU-608 产出结果精准锁定为：`Used in metal coatings, permeable flooring, paper coating, wood coatings, leather finishing and other industries.`，100% 对应中文母版事实。
2. **Section 1 化学品分类修饰语专业对齐 (`translateChemicalCategoryToEnglish`)**：
   - 消除对“聚氨酯”普通关键词一刀切的缺陷，精准捕获“改性（Modified）”修饰语；
   - 将 PU-608 的“改性聚氨酯树脂水分散体”精准英译为 `Modified polyurethane resin aqueous dispersion`。
3. **Section 1 结构与排版不变量实测绿灯**：
   - 确认英文版严格保持 9 行标准结构，Row 1 C1 直接承载英文全称；
   - 二级序号行（Row 1、3、4）统一保持双半角空格、半角冒号与 420 dxa 悬挂缩进；
   - 冠志与国彩双实体英文预设派生数据 100% 准确无误。

---

## [2026-10-23] - 英文排版体系方案 A 全量固化与中英文“序号+标签”排版规范闭环

### 核心交付 (Delivered)
1. **中英文“序号+标签”法定排版体系全面统一**：
   - 确立统一规范：**序号 + 两个半角空格（`"  "`） + 英文标签 + 半角冒号（`:`）**（例：`1.1  Product identifier:`、`5.1  Suitable extinguishing agents:`）；
   - 彻底清除全文档所有表格段落残留的 `<w:tabs>` 制表位与 `<w:tab/>`，从物理根源上根除不同 Word/WPS/LibreOffice 版本解析下的文字对齐错位；
   - 统一全文档带二级序号（`X.Y`）标签单元格的 OOXML 悬挂缩进几何为 `<w:ind w:left="420" w:hanging="420"/>`；
   - 全量清洗全角标点（`：`、`，`、`；`、`（`、`）`）为标准半角西文标点，彻底消除英文版全角冒号残留。
2. **方案 A 现代工业标准合规排版全量合入引擎管线 (`pipeline-engine.js` + `docx-engine.js`)**：
   - 章节标题：统一为 Arial 11pt Bold（`sz=22`）；
   - 标签行/单列子标题：统一为 Arial 9.5pt Bold（`sz=19`）；
   - 内容值/长说明行/法规项/免责声明：统一为 Arial 9.5pt Regular（`sz=19`）；
   - 页眉页脚：统一为 Arial 9pt Regular（`sz=18`）；
   - 改造 `formatSection9LabelCell`，英文模式下自动应用 Arial 9.5pt Bold 及双空格，移除旧有 12pt 硬编码。
3. **底模历史遗留伪断行智能自愈 (`standardizeEnglishTypographyAndLabels`)**：
   - 解决历史遗留缺陷：旧底模在较长标签（如 `5.1 Suitable extinguishing agents:`、`2.2 GHS Hazard Classification:`）处使用人工硬回车拆分为两个 `<w:p>`，导致第二段残留 12pt、全角冒号及异常缩进；
   - 自动将单元格内多段伪断行合并为单一原生段落，交由 420 dxa 悬挂缩进自动折行并精确首字垂直对齐。
4. **PU-608 全量 8 格式生产再生成与质量审计全绿灯**：
   - 重新驱动 Agent API 生成 4 DOCX + 4 PDF，经自动化审计脚本检阅：
     - `Total Tabs Remaining: 0` ✅ PASS
     - `Total Full Colons Remaining: 0` ✅ PASS
     - `Chinese Characters: 0` ✅ PASS
     - `Non-Arial Fonts: 0` ✅ PASS
     - `Numbered Label Spacing (Double Space): 0 failures` ✅ PASS
     - `Hanging Indent (420 dxa): 0 failures` ✅ PASS
5. **代码检阅与规范闭环**：
   - 全量改动均通过 `vscode-review`（`review_diff_in_vscode`）在 VS Code 原生 Diff Editor 中逐项通过人工把控与检阅合入。

### 遇到问题与解法 (Problems & Solutions)
- **问题 1：xmldom 命名空间序列化导致属性重复报错**
  - **根因**：在使用 `rPr.getElementsByTagNameNS` 获取已有节点后直接调用 `rFonts.setAttributeNS` 时，xmldom 在序列化为 XML 字符串时重复输出未带命名空间前缀与带前缀的同名属性 `w:ascii`，导致 `parseXml` 抛出 `duplicate attribute: w:ascii` 致命异常；
  - **解法**：在样式应用函数中，先物理移除旧有的 `rFonts`、`b`、`sz`、`szCs` 子节点，再统一通过 `setAttribute('w:ascii', font)` 纯净创建，彻底杜绝重复属性。
- **问题 2：底模历史遗留人工硬回车拆段导致全角冒号无法被段首规则覆盖**
  - **根因**：底模在 Section 2、5、6、9、11、12 的较长标签单元格中人工硬敲回车，拆成 2 个 `<w:p>`，第二段仅包含 `agents：`、`Classification：` 等残留词及全角冒号；旧逻辑仅处理 `ps[0]`，导致第 2 段冒号漏清洗；
  - **解法**：在 `formatEnglishLabelCell` 中，提取单元格内所有段落文本进行智能合并去重，统一格式化为标准单一段落，并物理移除冗余段落，彻底修复排版畸变。

---



### 核心交付 (Delivered)
1. **Section 11 组分毒理学引言行动态守恒 (`smart-matching.js` + `pipeline-engine.js`)**：
   - 修复正则 `/以下[为是].*毒理学数据/i`，精准捕获源文件中的“以下是N－甲基吡咯烷酮毒理学数据：”等合法组分引言行；
   - 终结单说明行硬编码假设：将 Section 12 说明行动态自适应体系推广至 Section 11，中文版 100% 完整保留 Row 3 跨列引言行，英文版基于中文母版动态同构英译（`The following are toxicological data for N-Methyl-2-pyrrolidone (NMP):`）；
   - 在未测端点剪枝阶段显式加入单列说明行免删豁免，彻底杜绝误判误删。
2. **“吸入危险 (Aspiration hazard)”法定保留与动态插行机制**：
   - 确立“源文件即使声明为无数据资料亦属法定有效事实”原则，破除将“无数据资料”一刀切删除的自以为是重构缺陷；
   - 增加模板底模缺失槽位时的自适应插行机制：在特异性靶器官系统毒性后动态插入新行 `11.9 吸入危险：`，英文版同步保留 `Aspiration hazard` 并英译为 `No data available.`；
   - 附加信息顺延递增为 `11.10 附加信息：`，与用户手工标杆 100% 严密吻合。
3. **标签用词优先遵照源文件法定事实**：
   - 皮肤刺激性标签检测源文件用词：当源文件使用“主要皮肤刺激性”时，优先采用 `11.2 主要皮肤刺激性:`，不再被旧模板旧词“原发性皮肤刺激”强行覆盖。
4. **质量门禁 Gate 3 升级为双章节说明行守恒拦截**：
   - 在 `assertDeliverableQuality` 中新增 Section 11 说明行数量断言（`expectedS11PreamblesCount`），任何引言行丢失或截断均触发毫秒级硬性阻断退出。
5. **代码检阅与规范闭环**：
   - 所有改动经 `vscode-review` 在 VS Code 原生差异比对视图中完成审查并合入生效；
   - 本地与全局 `msds-studio/SKILL.md` 同步固化 Section 11 这一法定不变量规范。

### 遇到问题与解法 (Problems & Solutions)
- **问题（对比用户手动导出正确标杆，发现 Section 11 丢失了 NMP 组分引言行与吸入危险行）**：
  - **根因**：
    1. 过去系统仅在 Section 12 支持了双说明行，而在 Section 11 误将说明行正则写死为 `/以下为/`，导致源文件的“以下是...”无法匹配并被清理单列行逻辑误删；
    2. 模板原本缺少吸入危险槽位，且剪枝逻辑将包含“无数据资料”的行粗暴判定为“死重”执行了删除。
  - **解法**：扩充正则至 `/以下[为是]/`，建立动态插行与吸入危险法定免删白名单，并在英文派生阶段完成同构英译与门禁拦截，彻底消灭 Section 11 漏行、错行缺陷。

---

## [2026-10-23] - Web 编辑器导出中心两大关键故障闭环修复 (文件名无法变更 & 编辑后只导出模板)

### 核心交付 (Delivered)
1. **草稿池状态双向原子绑定与导出解耦 (`web/src/main.js`)**：
   - 彻底修复 `ensureCurrentDraft()` 仅首次创建、后续编辑状态与草稿池脱节的问题。每次调用显式将当前 `state.editor.engine`、修改标记 `dirty`、自定义文件名实时同步至活动基准草稿；
   - 修复智能匹配导入（`commit-to-editor`）时未更新草稿池的断裂点，确保导入后的 `templateEngine` 立即成为草稿池有效引擎；
   - 优化 `getBaselineReadiness()`：将草稿（`editing`/`dirty`）明确标识为“草稿 (可直接导出)”，彻底破除过去因状态未标记 `completed` 导致在导出列表中被系统强行跳过的反直觉逻辑缺陷；打开统一导出弹窗时自动勾选当前活动基准。
2. **导出文件自定义命名全链路贯通 (`web/src/main.js`)**：
   - 彻底修复 `computeExportTargets()` 中文件名硬编码 `${baseModel} msds_${b.language} ${b.entity}` 的弊病；
   - 优先提取并消费界面输入的 `state.editor.customFileName` 与草稿级自定义文件名：基础草稿直接采用自定义文件名，预设与多基准基于自定义前缀进行同构派生（如 `${customName}_${b.language}_${b.entity}` 或 `${customName}_${cleanPresetName}`）；
   - 强化输入框联动：在 Ribbon 与 Section 00 输入框修改时同步更新当前活动草稿的 `customFileName`。
3. **新增【导出当前文档 (DOCX)】一键直达安全通道 (`web/src/main.js`)**：
   - 在模板编辑器顶部工具栏新增醒目的【导出当前文档】按钮（绑定 `quick-export-current-docx` 事件）；
   - 提供直接针对 `state.editor.engine` 的零中间环节单文件所见即所得导出，彻底消灭因多格式批导出逻辑导致的混淆。
4. **代码检阅与质量验证**：
   - 全量修改经 `vscode-review`（`review_diff_in_vscode`）在 VS Code 原生差异视图中完成审阅并合入；
   - 语法静态检查 `node -c` 全绿通过。

### 遇到问题与解法 (Problems & Solutions)
- **问题 1（用户在编辑器修改了单元格或导入了提取结果，点击导出下载的却是空白模板）**：
  - **根因**：页面初始化时 `state.editor.drafts['baseline_cn_guanzhi']` 绑定了通过 `fetchTemplate` 获取的纯净官方空白底模；后续用户在工作台点击【导入模板编辑器】或在表格内编辑时，仅修改了活动的 `state.editor.engine`，草稿池内的指针未同步更新；而统一导出中心强制从 `draft.engine` 读取数据导出，导致用户编辑的内容在导出时被完全绕过。
  - **解法**：重构 `ensureCurrentDraft(forceSync = true)` 实现原子级双向同步，并在匹配导入、弹窗打开、就地编辑时强制固化最新引擎；同时修复了 `getBaselineReadiness` 的准入逻辑，确保编辑中的草稿准予直接勾选导出。
- **问题 2（用户在页面修改导出文件名，导出的文件依然保持系统默认命名）**：
  - **根因**：前端虽然在 `input` 事件中记录了 `state.editor.customFileName`，但在计算导出目标的 `computeExportTargets()` 函数中未读取该属性，直接使用了硬编码模板字符串。
  - **解法**：在 `computeExportTargets()` 中增加自定义文件名消费逻辑，针对当前基准与预设派生支持自定义名称，并确保 input 改变时与草稿元数据保持一致。

---

## [2026-10-22] - 全局确立 MSDS Studio 唯一法定通道与严禁直改 DOCX 强阻断规范

### 核心交付 (Delivered)
1. **工程基座不变量注入 (`AGENTS.md`)**：
   - 在 `Operating Invariants` 显式确立“MSDS Studio 唯一法定通道与直改 DOCX 禁令”，明确规定所有 MSDS 生产、装配、英译、预设覆盖与 8 格式导出任务，必须且仅能通过 MSDS Studio API（`/api/msds/pipeline/*`）或底座流水线（`run_pipeline.mjs`）执行；严禁任何 Agent 编写 ad-hoc 脚本使用 `python-docx` 或手搓 XML 直接修改文档。
   - 通过 `ai-harness validate` 结构化合规校验。
2. **全局最高宪法升级 (`~/.gemini/config/GEMINI.md`)**：
   - 在第三章核心操作纪律中确立第 9 项“专用领域工具链与专属引擎唯一路由公理 (Exclusive Domain Engine Routing Axiom)”，严禁绕开成熟工作台直改产出物，凡脱离专用引擎产出之物一律视为非法产物并一票否决。
3. **双端 Skill 操作规约硬化**：
   - 同步更新全局 `msds-studio/SKILL.md` 与仓库本地 `.agents/skills/msds-agent-api/SKILL.md`、`.agents/skills/msds-studio/SKILL.md`，置顶挂载 `[!CAUTION]` 级别专属通道与直改禁令，提供明确的 `node run_pipeline.mjs` 与 API 规范调用 SOP。

### 遇到问题与解法 (Problems & Solutions)
- **问题（Agent 频繁绕开 MSDS Studio 引擎，自行手写脚本直改 DOCX 造成格式灾难）**：
  - **根因**：大模型倾向于依赖“通用直觉”编写一次性小脚本，而此前系统规约中只有推荐技能说明，缺少最高法则级的“唯一法定通道”与“直改即非法”强门禁定义，导致 Agent 屡屡抄近道，绕开了 Clean Slate 清空防污染、XML 拓扑自愈以及 5 大质量门禁。
  - **解法**：在 `AGENTS.md`、全局 `GEMINI.md` 及双端 Skill 文件中全面注入硬性排他性公理，建立代码/规约双重阻断防线，从制度和工程基座上彻底锁死唯一法定入口。

---

## [2026-10-22] - MSDS-Engine 架构级自适应中枢优化与全自动五大质量门禁体系 (彻底终结S12说明行/S11拓扑/S9格式反复问题)

### 核心交付 (Delivered)
1. **OpenSpec 规格提案闭环**：
   - 建立并归档 `engine-systemic-optimization-and-gates` 变更，更新 MSDS 主规格；
   - 确立“源文件自适应双模态装配”、“全局表格拓扑自动巡检自愈”、“发布前全项硬性质量门禁拦截”三大核心工程标准。
2. **架构级自适应与自愈中枢落地**：
   - **Section 12 动态源文件自适应装配体系**（`smart-matching.js` + `pipeline-engine.js`）：根据源文件 `ecotoxicity.logicalLines` 自动解析出说明行（0/1/2行）。源文件包含 2 行说明行时（行 1 为产品免责，行 2 为组分引言），中文版 100% 动态保留 2 行并锚定入 `targetKeepRows`，严禁误删；英文版 100% 精准英译 2 行说明行与生态实测指标，绝不依赖旧模板硬编码。
   - **全局表格拓扑自愈守卫**（`docx-engine.js` 中的 `healAllTableTopologies`）：在 `exportArrayBuffer` 导出前无条件全表扫描，自动修复右侧宽度缺额并对齐基准网格（7972 / 9781 twips），彻底清除悬空 `vMerge`，确保全表右边框 100% 垂直齐平。
   - **法定全项硬性质量门禁套件**（`pipeline-engine.js` 中的 `assertDeliverableQuality`）：
     - Gate 1：Section 9 标签格式必须符合 420 dxa 悬挂缩进且零 `<w:tabs>` 制表位；
     - Gate 2：Section 11 拓扑守恒，11.7 单元格宽度必须为 6262 dxa 且 `gridSpan="3"`，无悬空 `vMerge`；
     - Gate 3：Section 12 说明行数量必须与源文件解析数量（`expectedS12PreamblesCount`）绝对一致；
     - Gate 4：英文版全文字段 100% 零中文残留（`assertZeroChinese`）；
     - Gate 5：页脚修订日期自适应源文件真实日期（`2025/12/03`）。
3. **PU-202A 八格式全套实体重新交付**：
   - 全流程经 MSDS Studio Agent API 端到端跑通并全部通过 5 大硬性门禁，无任何拦截报警；
   - 4 DOCX + 4 PDF 实体验证：Section 12 完整保留 2 行说明行（中文 Row 2: 二甲基乙酰胺引言，英文 Row 2: `The following are ecotoxicological data for N,N-Dimethylacetamide:`），Section 11 右边框齐平无缩水，Section 9 格式严格继承模板，页脚日期动态同步为 `2025/12/03`。
4. **Skill 规范双端治理**：
   - 本地 [`.agents/skills/msds-studio/SKILL.md`](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/.agents/skills/msds-studio/SKILL.md) 与全局 [`msds-studio/SKILL.md`](file:///C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md) 固化第十小节第 4、5 条法定不变量规范。

### 遇到问题与解法 (Problems & Solutions)
- **问题 1（Section 12 说明行过去反复出现少行、组分引言行误删或英文未翻译）**：
   - **根因**：过去系统将 Section 12 假定为单一模式（硬编码只保留 1 行免责），把源文件中的第 2 行特定组分引言行误判为旧模板的组分行执行了删除；且英文翻译管道中只支持了 1 行说明行与固定指标，导致多行引言丢失或生态毒理数据英译截断。
   - **解法**：在 `smart-matching.js` 中构建自适应解析，从源文件中动态识别说明行集合；若源文件为 2 行，则第 2 行（组分引言）自动识别并标记为保留行（`targetKeepRows`）；在 `pipeline-engine.js` 中新增通用 `translateSection12PreambleToEnglish` 与生态指标动态翻译函数，中文 100% 保留，英文 100% 精准对应英译。
- **问题 2（门禁拦截模块因命名空间未导入引发运行时异常）**：
   - **根因**：`pipeline-engine.js` 新增 `assertDeliverableQuality` 门禁函数时，调用了底层 `W_NS` XML 命名空间，但文件头部未从 `./docx-engine.js` 导入该常量，导致 API 接口抛出 `ReferenceError: W_NS is not defined`。
   - **解法**：在 `pipeline-engine.js` 顶部显式导入 `W_NS`，并通过 `review_diff_in_vscode` 检阅合入；重启 API 守护进程后管道恢复毫秒级自检。

---

## [2026-10-22] - 模板编辑器 EN 冠志底模切换状态脱节与智能匹配同步治理

### 核心交付 (Delivered)
1. **OpenSpec 规格提案闭环**：
   - 归档 `2026-10-22-fix-editor-en-template-switch` 变更，更新 `msds-template-editor` 主规格；
   - OpenSpec 全仓 43 项规格校验全绿合规。
2. **基准多态解析器与防抖加锁体系**：
   - 构建 `resolveBaseline`，对 `baseline_en_guanzhi`、`EN 冠志`、`正式模板 · EN 冠志 (OSHA GHS)`、`EN` 等输入实现 100% 鲁棒归一化匹配；
   - 引入 `isSwitchingBaseline` 执行锁并剔除 DOM 与全局冒泡的双重 change 监听器，杜绝并发竞争。
3. **智能匹配与语言版本全链路状态对齐**：
   - 智能匹配导入编辑器（`commit-to-editor`）时同步对齐 `state.editor.currentBaselineId` 与对应草稿池；
   - 编辑器切换至 EN 基准时自动联动右侧预览为 `📑 模板效果`（`previewMode = 'template'`）；
   - Section 00 的【语言版本】（`#hf-lang-select`）联动底模基准切换。

### 遇到问题与解法 (Problems & Solutions)
- **问题 1（在编辑器切换 EN 冠志模板后，编辑器内依然显示为 CN 中文模板）**：
  - **根因**：切换逻辑中基准 ID 不匹配导致未能正确加载英文模板缓存。
  - **解法**：规范化 `resolveBaseline`，统一基准映射关系。
