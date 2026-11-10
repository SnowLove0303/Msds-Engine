# MSDS Engine 变更与演进日志 (CHANGELOG)

## [2026-11-10 MSDS Studio 全 16 章节多列表格值单元格纯净左对齐、通栏层级缩进保全与 Section 14 源文件主权动态重构工程 (INV-TOPOLOGY-FLUSH-LEFT-AND-S14-SOVEREIGNTY)] - 彻底清除多列表格值单元格多余段落缩进确立纯净左对齐、通栏 (Section 2) 树状层级阶梯缩进完好保全、Section 14 彻底告别生硬塞入“公路运输”预设标签转向以母版写法构建源文件 7 大标准危化品运输要素动态表格、中央主审计 170 项全景全绿满分核销 (Exit Code 0)

### 一、 变更背景与用户最高指令
用户下达两项最高法定排版与内容主权架构指令：
> 1. “还需要调整下底层逻辑，section2 是通栏的情况下，值需要用缩进，但是多列表格的情况下，值一般是左对齐，懂我意思？比如section2 的预防措施及其对应的值的排版就做的很好，但是像section1 因为是表格的情况下就没必要做缩进，第二列值统一用左对齐就行了，其他section 同理，要调整一下全局16个section的底层逻辑”
> 2. “《Ps-openspec 规格立法与施工图纸》（Step 2 门禁 2 呈报） 在这基础上补充内容：section14仍然没有遵循内容源于源文件的准则：底层模板拓扑只提供参考和格式等固定的东西，但不代表模板已有内容、标签等就是标准唯一正确项，核心是参考模板写法，去构建源文件的内容，而不是以源文件的内容去适配模板的内容，懂我意思？”

### 二、 核心架构根因穿透与系统底层解法
1. **多列表格值单元格纯净左对齐底层解耦 (REQ-TOPOLOGY-B)**：
   - **根因穿透**：上一阶段在处理层级缩进时，`universal-editor-primitives.js` 中将没有序号的前置标签行判定为 `isSubLabelRow` 并向第 1 列值单元格注入了 `w:left="240"`。然而在多列表格（如 Section 1、Section 8 等）中，第 1 列本身已经是独立列，再注入段落左缩进会导致单元格内部文字“二次悬空右缩”，破坏了表格整体对齐的美感。
   - **底层通用解法**：在 `universal-editor-primitives.js:applyGlobalTypographyProjection` 中，彻底移除 `isSubLabelRow` 的误加缩进逻辑；对所有多列表格（`cells.length > 1`）中的值单元格（`cIdx >= 1`），段落统一清理残留的 `w:left` 与 `w:leftChars` 属性，确立多列表格值单元格首字严格贴齐单元格内左边距（纯净左对齐 Flush Left）。
2. **通栏单列布局 (Section 2) 层级阶梯缩进完好保全与封印 (REQ-TOPOLOGY-A)**：
   - **架构设计**：单列通栏（`cells.length === 1` 或 `gridSpan > 1`）不同于多列表格，其标签与措施值均容纳在同一通栏内，必须依靠段落缩进来建立父子层级关系。
   - **底层保全**：严格保护并封印 `docx-engine.js:renderFullWidthRow` 中经过精心设计的 5 级缩进状态机与 `s2SubValueIndent`（中文 840 dxa / 英文 677 dxa），确保 Section 2 内部的“预防措施”、“事故响应”等条款保持完美的树状阶梯缩进，主从分明。
3. **Section 14 内容主权动态重构：参考模板写法构建源文件事实 (REQ-S14-SOVEREIGNTY)**：
   - **根因穿透**：底层模板原先预设了 4 行运输方式（`14.1 公路和铁路运输`、`14.2 海上运输`、`14.3 空运`、`14.4 用户特殊注意事项`）。原逻辑试图将源文件载明的 UN GHS 危化品 7 大要素（UN 1866、树脂溶液、3 类、包装组 III、环境危害 否等）强行填充进“公路和铁路运输”等标签中，犯了“以源文件内容去适配模板预设内容”的削足适履错误。
   - **底层通用解法**：重构 `pipeline-engine.js:buildDynamicSection14Table`。确立“模板提供排版写法与几何参考，源文件主导内容与结构”的法理体系：
     - 若源文件为危化品 UN GHS 要素模式（如 PU-2346A）：动态组装 7 行标准 GHS 表格：
       - `14.1 联合国编号` / `14.1 UN number`
       - `14.2 联合国运输名称` / `14.2 UN proper shipping name`
       - `14.3 运输危险类别` / `14.3 Transport hazard class`
       - `14.4 包装组` / `14.4 Packing group`
       - `14.5 环境危害` / `14.5 Environmental hazards`
       - `14.6 用户特殊防范措施` / `14.6 Special precautions for user`
       - `14.7 按《MARPOL73/78》公约附则II和IBC规则` / `14.7 MARPOL 73/78 Annex II and IBC Code`
     - 若源文件为普通非危品运输方式模式：参考模板动态生成 4 行运输方式表格；
     - 每一行严格套用母版 2800 dxa / 6981 dxa 列宽、420 dxa 悬挂缩进 + `<w:tab/>` 黄金锚点以及纯净左对齐值单元格；中英文双语行数与结构实现 1:1 绝对镜像同构！
4. **集中式中央主审计套件同步核销 (REQ-01 ~ REQ-06)**：
   - 同步更新 `run_master_msds_audit.mjs` 中的 Item 151（Section 14 危化品 8 行拓扑保全）与 Item 155（多列表格纯净左对齐且通栏阶梯缩进完好）；
   - 运行结果：**170/170 项全绿通过，真实退出码 0**。

### 三、 物理实测与对账核销清单
- **目标交付目录**：`E:\冠志\TDS MSDS (2)\待处理文件\PU-2346A\`
- **生成交付物清单 (8 份全部最新同步)**：
  1. `PU-2346A msds_CN 冠志.docx` (42,783 bytes)
  2. `PU-2346A msds_CN 冠志.pdf` (272,746 bytes)
  3. `PU-2346A msds_CN 国彩.docx` (42,773 bytes)
  4. `PU-2346A msds_CN 国彩.pdf` (272,543 bytes)
  5. `PU-2346A msds_EN Guanzhi.docx` (31,109 bytes)
  6. `PU-2346A msds_EN Guanzhi.pdf` (158,155 bytes)
  7. `PU-2346A msds_EN Guocai.docx` (31,076 bytes)
  8. `PU-2346A msds_EN Guocai.pdf` (156,357 bytes)
- **Central Master Audit 套件核销**：**170 / 170 100% 满分通过，退出码 0**。

---



## [2026-11-10 MSDS Studio 全 16 章节黄金基准对齐 (9.1 外观标尺) 与层级树拓扑工程 (INV-GLOBAL-GOLDEN-ANCHOR-ALIGNMENT)] - 彻底根除 Section 3 `<w:numPr>` 自动编号叠加导致序号重复 (3.1 3.1)、全 16 章节统一采用 9.1 外观黄金标尺 (80.28pt 激光铅垂共线对齐)、消除长标签折行第二行回缩缺陷 (11.7 “性：”与“亚”绝对垂线对齐)、子标签对应值单元格向右阶梯缩进 (left=240)、彻底清除 w:leftChars 字符单位漂移、双位数序号自适应字阶防制表位跳步、主审计扩充至 170 项全绿满分核销 (Exit Code 0)

### 一、 变更背景与用户最高指令
用户对系统排版细节提出三项严肃要求与最高法定架构重构指令：
> 1. “section3 的序号重复问题还是没解决啊，你去排一下”
> 2. “section11 的标签换行首字对齐问题还是没解决啊，比如11.7 亚急性、亚慢性和延迟毒性：变成了：11.7 亚急性、亚慢性和延迟毒\n性： 这个性 没有与亚对齐等等，当然不止这个地方的换行有问题”
> 3. “所谓的父级标签与父级标签对齐，子级标签和父级标签对齐，实际应该是：比如呼吸系统防护、手部防护、防护手套的合适材料等 应该与 8.1 暴露控制 的暴字对齐，而应为8.1 序号与标签“暴露控制” 之间间隔不对的原因，实际上，8.1 暴露控制的暴应该与9.1 外观在垂直层面上对齐，及采用9.1 外观 （序号与标签之间的间隔）作为全局统一对齐规范，也就是你要规定一个全局16个section 的序号与标签间正确的一个间隔，并强制所有标签做对齐，从底层编辑器及其拓扑结构去做通用统一规定，明白吗？子标签对应的值 要比 子级标签靠右缩进一些”

### 二、 核心架构根因穿透与系统底层解法
1. **Section 3 序号重复与 `<w:numPr>` 自动编号动态列表叠加根除 (REQ-S3-DUP-PURGE)**：
   - **法医级根因穿透**：原始 DOCX 母版表格内部段落深层残留了 `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>` 列表绑定定义。当 Word 或 WPS 渲染文档时，一方面根据列表样式自动计算并在视觉左侧生成序号 `3.1  `，另一方面流水线代码注入了物理静态文本 `3.1  `，导致最终渲染呈现 `3.1  3.1  产品类型：` 双重序号！
   - **底层通用解法**：在 `docx-engine.js` 的 `cleanTabsInNode`、`harmonizeTableLabels`、`healAllTableTopologies` 与所有标签格式化管道中，递归遍历并全局物理彻底清除所有 `<w:numPr>` 节点，彻底切断自动编号列表继承链路。全文档表格残留 `numPr` 数严格降为 0！
2. **9.1 外观黄金基准标尺抽取与全 16 章节父级/子级标签激光铅垂共线对齐 (REQ-GOLDEN-ANCHOR, REQ-SUB-PARENT-ALIGN)**：
   - **几何物理模型确立**：
     - 页边距与单元格左基线：59.28 pt；
     - 黄金悬挂缩进基准量：`w:left="420"` (21.0 pt)；
     - 黄金正文首字绝对物理坐标：`59.28 pt + 21.0 pt = 80.28 pt`！
   - **底层通用解法**：
     - **父级带序号标签**：段落统一下沉注入 `<w:ind w:left="420" w:hanging="420" w:leftChars="0"/>`，序号与标签正文之间彻底废除易漂移的静态空格，统一接入 `<w:tab/>` 黄金锚点，由制表位死死锁死在 420 dxa 黄金垂线上；
     - **子级无序号标签**：段落统一挂载 `<w:ind w:left="420" w:leftChars="0"/>`（物理剔除 `hanging`、`firstLine` 与 `leftChars` 干扰），使首字绝对平齐 420 dxa (80.28 pt) 黄金垂线；实测 `8.1 暴露控制` 的“暴”、`8.2 工程控制` 的“工”、`呼吸系统防护`、`手部防护`、`防护手套的合适材料`、`建议`、`眼睛防护`、`身体防护`，以及 `9.1~9.24`、`10.1~10.6`、`11.1~11.16`、`14.1~14.7` 正文首字全部 100% 激光对齐于 **80.28 pt**！
3. **长标签折行第二行首字垂线绝对对齐机制 (REQ-WRAP-VERTICAL-ALIGN)**：
   - **几何根因**：段落继承了 `w:firstLine` 导致首行突进、折行次回缩到单元格最左侧。
   - **底层通用解法**：通过 `w:left="420" w:hanging="420"`，Line 1 挂载 `<w:tab/>` 跳至 420 dxa，而 Line 2 自动继承段落整体左缩进 `w:left="420"`，无需制表位直接从 420 dxa 黄金基线起排！实测 `11.7 亚急性、亚慢性和延迟毒性：` 折行次行的“性：”坐标精准锁定在 **80.28 pt**，与第一行的“亚”（80.28 pt）实现绝对共线对齐！
4. **子级标签对应值单元格向右阶梯缩进规范 (REQ-SUBVAL-RIGHT-INDENT)**：
   - **底层通用解法**：在 `applyGlobalTypographyProjection` 中建立行级层级判定器，精准识别无序号子级标签行，对其对应的值单元格（Column 1）段落显式注入 `<w:ind w:left="240" w:leftChars="0"/>`（向右缩进 12 pt / 240 dxa），形成清晰的层级树阶梯结构（实测左边缘坐标从 235.20 pt 缩进至 247.20 pt）。
5. **w:leftChars 字符单位覆盖与双位数序号制表位跳步深度根治 (INV-GEO-DEFENSE)**：
   - **致命陷阱 1：w:leftChars 覆盖**：Word/WPS 中若存在 `w:leftChars="234"`，会以字符宽度覆盖物理 dxa，导致 `手部防护` 漂移至 83.76 pt。底层全量增加 `ind.removeAttribute('w:leftChars'); ind.setAttribute('w:leftChars', '0');`。
   - **致命陷阱 2：双位数序号宽度溢出跳步**：在西文 Arial 或大字号下，`11.10` 等 5 字符序号宽度若加上字距超过 420 dxa，Word 制表符会自动跳步到下一默认制表位（840 dxa = 101.28 pt）。底层实施自适应字阶保护：中文 5 字符序号采用 9.5pt (`sz="19"`)，英文 5 字符序号采用 7.5pt (`sz="15"`)，完美将序号包络面控制在 420 dxa 以内，100% 消除跳步！
6. **集中式中央主审计套件扩充至 170 项全景物理断言满分通过 (REQ-01 ~ REQ-06)**：
   - 在 `run_master_msds_audit.mjs` 中新增 4 项强门禁断言：
     - Item 152: 表格 `numPr` 列表定义零容忍断言；
     - Item 153: Section 3 实体序号唯一性与绝无重复断言；
     - Item 154: `8.1 / 9.1 / 11.1 / 11.7` 黄金标尺铅垂共线绝对对齐断言（PyMuPDF `words` 物理提取 46 行校验）；
     - Item 155: 子级标签对应值单元格向右阶梯缩进（`left="240"`）断言；
   - 运行结果：**170/170 项全绿通过，真实退出码 0**！

### 三、 物理实测与对账核销清单
- **目标交付目录**：`E:\冠志\TDS MSDS (2)\待处理文件\PU-2346A\`
- **生成交付物清单 (8 份全部最新同步)**：
  1. `PU-2346A msds_CN 冠志.docx` (42,844 bytes)
  2. `PU-2346A msds_CN 冠志.pdf` (273,244 bytes)
  3. `PU-2346A msds_CN 国彩.docx` (42,833 bytes)
  4. `PU-2346A msds_CN 国彩.pdf` (273,254 bytes)
  5. `PU-2346A msds_EN Guanzhi.docx` (31,105 bytes)
  6. `PU-2346A msds_EN Guanzhi.pdf` (158,416 bytes)
  7. `PU-2346A msds_EN Guocai.docx` (31,072 bytes)
  8. `PU-2346A msds_EN Guocai.pdf` (156,611 bytes)
- **物理坐标实测抽样核销**：
  - `8.1 控制参数：` -> x0 = **80.28 pt**
  - `8.2 工程控制：` -> x0 = **80.28 pt**
  - `呼吸系统防护：` -> x0 = **80.28 pt**
  - `手部防护：` -> x0 = **80.28 pt**
  - `防护手套的合适材料：` -> x0 = **80.28 pt**
  - `建议：` -> x0 = **80.28 pt**
  - `眼睛防护：` -> x0 = **80.28 pt**
  - `身体防护：` -> x0 = **80.28 pt**
  - `9.1 外观：` ~ `9.24` -> x0 = **80.28 pt**
  - `10.1` ~ `10.3` -> x0 = **80.28 pt**
  - `11.1` ~ `11.16` -> x0 = **80.28 pt**
  - `11.7 次行 "性："` -> x0 = **80.28 pt** (与第一行“亚”完全垂直重合！)
  - `14.1` ~ `14.5` -> x0 = **80.28 pt**
  - `Section 8/11 子级值单元格` -> x0 = **247.20 pt** (显式向右缩进 12 pt)
- **Central Master Audit 套件核销**：**170 项 100% 满分通过，退出码 0**。

---



## [2026-11-10 MSDS Studio 全 16 章节底层通用拓扑与排版规范全局硬约束 (INV-UNIVERSAL-16-SECTIONS-TOPOLOGY-AND-TYPOGRAPHY)] - 根治 Section 2 通栏内框线残留、英文版 Section 8 Hand protection 异常放大 12pt 导致层级倒挂、全 16 章节序号/标签/值底层拓扑统一投影、标签折行第二行首字垂直对齐与主审计 166 项满分核销 (Exit Code 0)

### 一、 变更背景与用户最高指令
用户对系统提出严肃批评与最高法定重构指令：
> “2346A 的section2 内虚线，section8的字体大小错误等，说了几次了，特别是EN版，我都说让你从系统底层去统一起来，统一起来，section2 用通栏，不要有内框线！ 系统统一起来！序号/标签/值 全部按规定的去做拓扑结构，禁止任何形式出现字号字体文本格式不统一的问题，另外，换行的第二行首字对齐也必须统一，标签换行第二行首字必须永远与标签第一行首字对齐，以上必须从系统层面，从模板提供的拓扑层面去永久解决！ 也就是我希望从系统拓扑的角度去永久固定msds 产出内容中的 序号、标签、值的统一字体、字号等，CN/EN 版本字体、字号的相关数值在全局规范中有说明；”
> “执行，请注意，我不想再强调：只要是走系统底层的就是全局约束，要做的是所有16个 section都必须遵守的约束，包括16个section 的序号/标签/值的字体、字号规定等”

### 二、 核心架构根因与系统底层解决办法
1. **Section 2 纯净大通栏零内框线底层阻断改造 (REQ-02)**：
   - **根因分析**：`pipeline-engine.js` 在流水分步中调用全局 `enforceTableStandardBorders`，原逻辑对全文档所有表格无差别硬编码覆盖 `insideH="dotted"` 与单元格级横向虚线，导致 Section 2 内部数据行被强加内框线。
   - **底层解决办法**：在 `docx-engine.js:enforceTableStandardBorders` 中识别 Section 2，强制设置 `insideH="none"`, `insideV="none"`，并遍历所有单元格将内部 `top` 与 `bottom` 边框清除为 `none`，仅保留最外层边框实线；同时在 `renderFullWidthRow` 中为中间行设置 `topVal="none"`, `bottomVal="none"`。
2. **全 16 章节“序号/标签/值”底层通用投影引擎重构 (REQ-03, REQ-04)**：
   - **根因分析**：此前排版规范零散分布在特定章节的局部逻辑中，缺乏全 16 章节统领性的底层投影，且 `pipeline-engine.js` 中存在 `const targetSz = isHandParent ? '24' : '19';` 的局部特殊放大代码，导致英文版中仅 `Hand protection` 变成 12pt (`sz="24"`)，全篇字阶不一致。
   - **底层解决办法**：在 `universal-editor-primitives.js:applyGlobalTypographyProjection` 中建立第 0 列标签通用投影通道，对全 16 章节所有表格第 0 列单元格强制执行规范：中文版统一为 12pt (`sz="24"`) 宋体加粗，英文版统一为 9.5pt (`sz="19"`) Arial 加粗；彻底删除 Section 8 中对 `Hand protection` 放大为 24 的局部代码；在 `pipeline-engine.js` 结尾新增全篇英文标签兜底遍历，确保所有标签 100% 均一化。
3. **标签折行悬挂缩进与首字垂直锁定机制统一 (REQ-05)**：
   - **根因分析**：段落中残留历史 `firstLine="482"` 属性导致带序号标签折行时第二行顶格回缩到序号正下方，破坏垂直对齐美感。
   - **底层解决办法**：在底层 `applyGlobalTypographyProjection` 与 `formatEnglishLabelCell` 中，对所有带序号标签挂载标准悬挂缩进 `<w:ind w:left="420" w:hanging="420"/>`，并彻底剔除纯标签行中导致首行突进次行回缩的 `firstLine` 畸形属性，确保标签折行时第二行首字永远与第一行标签文本首字在 420 dxa 垂直线上完全对齐。
4. **集中式中央主审计套件冲突修复与 166 项满分通过 (REQ-01, REQ-06)**：
   - **根因分析**：`run_master_msds_audit.mjs` 中残留历史陈旧断言，硬编码强制 Table 2 边框必须为 `dotted`，且强制 Hand protection 必须为 `sz="24"`，与新的全局通栏及均一排版规范产生逻辑死锁。
   - **底层解决办法**：修正主审计套件中对 Table 2（Section 2）的大通栏零内框线断言判定（`insideH="none"`, `insideV="none"`），并修正英文版 Hand protection 的均一性断言（必须统一为五号 9.5pt `sz="19"`，严禁 `sz="24"`）。实测运行 **166 项 100% 满分通过，真实退出码为 0**！

### 三、 物理实测与验收核销
1. **PU-2346A 交付物物理核销**：
   - 8 份标准交付物已重新编译生成并同步至目标交付目录 `E:\冠志\TDS MSDS (2)\待处理文件\PU-2346A\`；
   - 8 份交付物时间戳差值 6.0 秒（< 10 秒），完全新鲜同步；
   - Section 2 XML 边框验证：`insideH="none"`, `insideV="none"`，内部虚线数量为 0；
   - Section 8 英文标签字号验证：10 个标签全部为 9.5pt (`sz="19"`)，违规 `sz="24"` 为 0；
   - 悬挂缩进验证：全篇段落命中 `left="420" hanging="420"` 达 66 处。

---

## [2026-11-09 MSDS-Studio 通用拓扑结构重构与源文件事实绝对驱动 (INV-UNIVERSAL-TOPOLOGY-AND-SOURCE-GROUNDING)] - 根治 Section 2 大通栏误加内框虚线、全局表格跨页自然断行默认放开与大空白彻底消除、Section 3 “3.2 成分”标签法定加粗与组分行常规体底层固化、Section 11 毒理学通用动态拓扑构建器（16项终点全量动态增删保真）、Section 14 彻底清除 ADG 澳洲法规伪通与国际公约保全、主审计升级至 166 项全景物理断言 100% 满分通过 (Exit Code 0)

### 一、 变更背景与用户最高裁决
用户对系统提出严肃批评与最高法定重构指令：
> “section 3 3.2 成分  这个成分是不是标签，是不是要加粗，为什么系统底层还没改正过来，通过模板识别出是标签了就要用规定的标签文本格式啊！还有，section与section表格间的允许跨页断行对你来说是很难搞定吗，能不能在底层上做默认啊，默认允许跨页断航啊，不然表格与表格之间可能存在很大的空白啊！还有section 11 ，能不能在全局与局部规范上以及审计方法上规定好啊，源文件的内容都丢失了都不管吗，直接对着标签就是乱匹配？还有之前不是都规定了要与源文件内容为主了？为什么还用模板的标签？模板只是提供固定的格式和操作空间，不决定内容！section14 也是，难道就非要用硬编码？遇到新的标签或内容就不会做了？增删行和标签编辑功能是给你干嘛用的？以及section2 我明明要求的大通栏，谁让你加内框虚线的？”
> “上述问题，必须从系统底层进行解决，一定要把MSDS-Studio开发成通用拓扑结构而不是万能答案，所有内容必须来源于源文件，模板提供拓扑结构，因此所有关于MSDS Studio底层的修改都是关于拓扑结构的修改，禁止任何硬编码，所以，上述5个问题请从系统底层去解决”

### 二、 核心架构重构与底层通用拓扑升级
1. **Section 2 纯净大通栏重构与内框虚线彻底清除 (REQ-05)**：
   - 在 `docx-engine.js:renderFullWidthRow` 中彻底清除所有横向内部边框，设置 `w:val="none"` 与 `tblBorders.insideH="none"`，绝对杜绝任何 `dotted` 或 `dashed` 内框线残屑，仅保留最外层实线边框。
2. **全局表格跨页断行底层放开与消除大空白 (REQ-02)**：
   - 彻底删除 `pipeline-engine.js` 中盲目对全文档所有表格行注入 `<w:cantSplit/>` 的恶性死锁循环；
   - 在 `docx-engine.js:enableCrossPageBreaksForAllSections` 中确立底层默认规则：仅保留 Row 0（章节标题行）的 `cantSplit` 防止孤行表头断裂，所有数据行（Row 1..N）全量清除 `cantSplit`，实现长表格跨页自然断行流转，彻底消灭章节间的异常空白悬崖。
3. **Section 3 “3.2 成分”标签识别与法定加粗格式底层固化 (REQ-01)**：
   - 在 `normalizeSection3Typography` 与 `enforceStructuralTypographyInvariants` 中，确立 Section 3 严格排版层级：
     - Row 2 题头单元格格式化为法定加粗（中文版 12pt 宋体 Bold，英文版 9.5pt Arial Bold）；
     - Row 3 属性列头（化学品名称、CAS编号、含量）居中加粗；
     - Row 4+ 各组分数据行严格锁定为常规细体（Regular），严禁整表误加粗。
4. **Section 11 毒理学动态拓扑构建器与终点全量保真 (REQ-03)**：
   - 新增 `extractToxicologicalEndpointsFromSource`，完整穿透解析源文件载明的全部 16 项毒理终点（急毒经口/吸入/经皮、眼刺激、皮肤刺激、致敏、亚急性、致突变体外/体内、生殖毒性生育/致畸、STOT 一次接触/反复接触、吸入危害、CMR 综合评估）；
   - 新增 `buildDynamicSection11Table`，由源文件终点事实动态调度通用原语 `addRowAfter` / `deleteRow` / `formatSection11LabelCell` 构建表格（PU-2346A 动态自适应生成 19 行），彻底废除针对特定型号的硬编码特判与模板死板乱匹配，实现中英双语 1:1 镜像同构。
5. **Section 14 通用原语装配、清除 ADG 澳洲法规与公约全量保真 (REQ-04)**：
   - 全库彻底清除外生硬编码常量（彻底连根拔除 `in accordance with ADG regulations.`）；
   - 新增 `buildDynamicSection14Table`，纯由源文件事实驱动：危化品（UN 1866）动态保留联合国编号、运输名称、类别、包装组及海运非污染信息；
   - 动态装配 Row 4 特殊防范说明（温控 `-10℃ ~ +35℃`、远离食品酸碱）与 Row 5 国际海事公约（`按《MARPOL73/78》公约附则II和IBC规则：不适用` / `MARPOL 73/78 Annex II and IBC Code: Not applicable.`），并在 `writeCellLabel` 中解除 Section 14 标签编辑限制，全量实现通用原语动态装配。
6. **集中式中央主审计套件全面升级 (REQ-01 ~ REQ-05)**：
   - 在 `run_master_msds_audit.mjs` 中新增 5 项严苛物理断言（Section 2 零内框虚线、Section 3 标签加粗与组分细体、全局跨页自然断行放开、Section 11 终点全量保真、Section 14 零 ADG 污染与公约保全）；
   - 主审计套件检验项数扩充至 **166 项**，实测运行 **166 项 100% 满分通过，真实退出码为 0**！

### 三、 物理实测与验收核销
1. **全量重新编译生成 PU-2346A 交付物**：
   - 成功生成 8 份标准 MSDS 交付物（4 DOCX + 4 PDF）与 4 份 TDS 交付物，同步至 `E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A/`；
   - 双极双层全景机械深度审计与 166 项主审计套件全绿通过；
   - PyMuPDF 真实渲染物理实测：Section 9 标签首字 100% 垂离开位（x0=80.28pt），Section 11 包含全部 16 项终点，Section 14 无任何 ADG 虚假字样。

## [2026-11-09 编辑器底层排版与 Section 8 不变量加固 (INV-EN-TYPOGRAPHY-AND-SECTION8)] - 根治英文版标签制表位弹跳 720 dxa 错位缺陷、序号与正文采用标准西文双空格紧凑匀称排版、Section 8.1/8.2 粗体二级题头格式保护、Section 8 Recommendation 420 dxa 缩进对齐抹平锯齿、西文破折号 GBK 乱码清零、植入源码级防篡改封印与 5 项主审计自动化硬门禁

### 一、 变更背景与用户明确指令
在交付物认知审计中，用户明确指出：
> “EN版产出文件的 标签对齐有大问题，序号与标签之间的空格过大，比如 1.3 Supplier information: 没有与 Name of supplier:对齐，以及8.1 的标签 文本格式出现了大问题，在格式和排版上没有严格按照我们之前规范那样做的”
> “从编辑器底层 去解决并固定 格式和排版问题，防止后续产出篡改”

### 二、 核心技术解法与底层不变量固化
1. **重构制表位与序号间距逻辑 (REQ-01)**：
   - 根除由于历史缺失 `<w:tabs>` 导致 `<w:tab/>` 强制弹跳至 Word 默认 720 dxa 制表位的严重错位问题；
   - 在 `pipeline-engine.js` 的 `rebuildTabbedLabelWithTypography` 中采用标准西文两空格（`seqStr + '  '`），彻底杜绝制表位弹跳，确保序号与标签正文间距紧凑匀称；
   - 保持未编号标签 `applyLeftIndentToP(420)`，使所有序号后标签正文与未编号标签首字在 420 dxa 基准线上实现严格 1:1 垂直对齐。
2. **Section 8 题头保护与 Recommendation 缩进一致性 (REQ-02)**：
   - 在 `standardizeEnglishTypographyAndLabels` 中建立 Section 8 题头专属拦截：`8.1  Exposure controls:` 与 `8.2  Engineering controls:` 严格保持顶格左对齐、Arial 10.5pt Bold / 12pt Bold 大号粗体样式，严禁被通用单格逻辑误降级为 9.5pt 普通文本；
   - 彻底删除 `formatEnglishLabelCell` 中对 `Recommendation:` 的去缩进特判，统一应用 420 dxa 左缩进，与上下所有 PPE 标签保持整齐划一，消除左边缘凹凸锯齿；
   - 全局文本清洗环中增加破折号归一化正则，将 `Fluororubber C FKM` 等历史 GBK 破折号畸变残屑彻底规范化为标准连字符 `Fluororubber - FKM:`。
3. **源码级防篡改封印与主审计硬门禁 (REQ-03)**：
   - 在 `pipeline-engine.js` 关键排版代码块打上 `@ANTIGRAVITY_INVARIANT_LOCK` 源码级保护封印；
   - 在 `run_master_msds_audit.mjs` 中新增 5 项物理断言，对编号标签间距、未编号标签对齐、8.1 题头规格、Recommendation 缩进一致性及破折号无乱码进行全自动机械一票否决。
4. **全量核销验证**：
   - 针对样本 EP-1404 完整重新生成 8 格式交付物（4 DOCX + 4 PDF），同步至 `E:/冠志/TDS MSDS (2)/待处理文件/EP-1404/`；
   - 运行全量中央主审计，153 项断言 100% 满分通过，进程退出码 0；OpenXML 抽样检查物理属性完全符合预期。


## [2026-11-09 MSDS MCP 覆写与审计全方法论 Zip 物理封装交付 (PKG-MSDS-MCP-ZIP-V6)] - 整理收敛 10 大 MCP 工具契约、标准 5 阶流水线 SOP、万能几何手术配方库（Recipe A~H）、三大最高法定不变量、3 大专用 Agent 角色定义并完成开箱即用 Zip 物理打包交付

### 一、 变更背景与用户明确指令
在完成 MCP 工作流体系化整理并升级 `msds-studio` v6.0-ENTERPRISE 技能后，为便于向其他协作系统、团队或新 Agent 快速分发开箱即用的方法论套件，用户下达明确指令：
> “将调用说明+skill等 用于给Agent正确调用MCP 执行覆写与审计的全方法论打包成Zip给我”

### 二、 核心成果与物理打包交付
1. **模块化分层目录规划 (`dist/msds-mcp-methodology-package/`)**：
   - `README.md`：全方法论快速上手与 Agent 接入总纲；
   - `skills/msds-studio/SKILL.md`：官方 `msds-studio` v6.0-ENTERPRISE 技能主干；
   - `docs/`：包含《覆写生产 SOP 手册与停机申报规程》、《五大核心难题复盘与万能原语方法论》及《新一代 MCP 驱动白皮书》；
   - `gateway/`：标准 JSON-RPC 2.0 MCP 网关驱动器（`msds_mcp_gateway.mjs`）与调用参数样例（`args_recognize_example.json`, `args_audit_example.json`）；
   - `agents/`：包含三大专用智能体（生产覆写 Producer、Studio 原语专家、独立敌手 Auditor）的完整系统提示词与权限白名单约束配置。
2. **物理 Zip 压缩包输出与事实指纹**：
   - 物理绝对路径：`F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\dist\MSDS_MCP_Overwrite_And_Audit_Methodology_v6.0.zip`
   - 文件大小：56,463 字节 (约 55.1 KB)
   - SHA-256 事实指纹：`868832D01F3C3E275C9725B47030619692F84CB93B4B7B1D982BE01065A01A10`
   - 沙箱自解压校验：解压 11 个核心资产文件，文件计数与结构 100% 对齐，退出码 0。

## [2026-11-09 MSDS Studio MCP 工作流体系与工业级技能资产封装交付 (SKILL-MSDS-STUDIO-V6)] - 整理收敛 10 大原子 MCP 工具契约、标准 5 阶作业流水线 SOP、万能几何手术配方库（Recipe A~H）、注入三大最高法定不变量、实现全局与本地多环境技能 100% 物理哈希对齐

### 一、 变更背景与用户明确指令
在完成系统目录只读封印与 MCP 专属网关建设后，为了将散落于多份文档与 OpenSpec 变更中的作业规范彻底标准化、资产化，用户下达明确指令：
> “现在给我整理一下MCP 工作流体系，以技能的方式交付给我”

### 二、 核心资产成果与技能封装
1. **统一权威技能发布 (`msds-studio` v6.0-ENTERPRISE)**：
   - 完整收录并精准定义 10 大官方原子 MCP 工具契约（`msds_recognize_source`, `msds_extract_section_facts`, `msds_compare_source_with_output`, `msds_register_template`, `msds_get_template_schema`, `msds_peek_cell_or_row`, `msds_plan_audit_targets`, `msds_execute_editor_ops`, `msds_batch_export_eight`, `msds_audit_deliverables`）；
   - 标准化收敛 5 阶段完整流水线 SOP（阶段 1：零损耗源感知与透视 $\rightarrow$ 阶段 2：语义决策与几何预演 $\rightarrow$ 阶段 3：万能手术原语批量执行 $\rightarrow$ 阶段 4：标准 8 格式批处理导出 $\rightarrow$ 阶段 5：150 项主审计核销）；
   - 体系化收录万能几何手术配方库（Recipe A~H：三列转两列消除、通栏说明合并、克隆增行、冗余行精准剔除、富文本与化学式下标、激光垂直对齐、历史脏数据前置清零、单节母版几何恢复）；
   - 强制固化三大最高法定不变量（`INV-SYSTEM-READONLY`、`INV-MCP-EXCLUSIVE-GATEWAY`、`INV-SAFE-HALT-AND-ESCALATION`）及版式几何公理（Section 2 阶梯排版、Section 9 外观保真、无水环氧品名解耦等）；
   - 提供标准《系统底座通用缺陷申报单》Markdown 模板与 `--argsFile` 防转义安全调用模式。
2. **多环境部署与物理对齐**：
   - 全局技能路径：`C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`；
   - 项目本地路径：`F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\.agents\skills\msds-studio\SKILL.md`；
   - 经实测，全局与本地两份技能文件的 SHA-256 哈希值均为 `F6B0EBB198974CE28E7896B0B0168CF119DDB9BAFEB7E80B78F81ECBF2075815`，100% 物理哈希对齐！

## [2026-11-09 系统核心目录绝对只读与 MCP 唯一执行通道架构落地 (INV-SYSTEM-READONLY-AND-MCP-GATEWAY)] - 落实最高用户指令：未获允许严禁修改系统目录、封印 Producer Agent 写入权、构建轻量 MCP 网关驱动器作为唯一执行通道、设立底座缺陷停机升级规程

### 一、 治理背景与最高用户指令
针对既往生产 Agent 为达成特定型号交付物指标，频繁通过就地修改系统目录（`web/src/`、`web/scripts/`）核心逻辑或自编 ad-hoc 脚本绕过引擎的根本性顽疾，用户下达最高立法不变量指令：
> “我们来研究一下，为了从根源上防止硬编码，：1.讨论是否只要执行覆写产出工作时，对MSDS-Studio 只读；2.设立MCP 为唯一执行通道”
> “执行，没有我允许的情况下，没有系统目录的写权”

### 二、 核心架构防线与立法实施
1. **系统核心目录物理与契约级绝对只读封印 (SYS-01 / SYS-02 / SYS-03)**：
   - 在 `.agents/agents/msds-overwrite-producer/agent.md` 与 `msds-studio-producer/agent.md` 中注入最高只读硬约束：
     - 受控系统只读目录：`web/src/`（核心引擎）、`web/templates/`（官方模板）、`web/scripts/`（核心审计与导出脚本）；
     - 生产 Agent 仅拥有当前任务型号的工作区目录（`算法训练材料/TDS MSDS 重写版/...`）的写权限；
     - 未经用户显式书面授权，任何尝试对受控系统目录的文件新增、修改或删除操作将被物理拦截并触发违规告警。
2. **官方 MCP 工具链唯一执行通道公理 (MCP-01 / MCP-02 / MCP-03)**：
   - 确立 `web/src/mcp-server.js` 及其 10 大标准原子工具（`msds_recognize_source`, `msds_extract_section_facts`, `msds_compare_source_with_output`, `msds_register_template`, `msds_get_template_schema`, `msds_peek_cell_or_row`, `msds_plan_audit_targets`, `msds_execute_editor_ops`, `msds_batch_export_eight`, `msds_audit_deliverables`）为 MSDS 识别、比对、编辑与导出的**唯一法定执行通道**；
   - 构建轻量化、纯净的标准 MCP 网关驱动器 `web/scripts/msds_mcp_gateway.mjs`，以标准 JSON-RPC 2.0 协议直接驱动 `mcp-server.js`，彻底终结手写 ad-hoc 临时脚本的历史陋习；
   - 全面支持 CLI 命令行传参及 `--argsFile=<pathToJson>` 复杂载荷注入，与 Antigravity / Agent 架构深度解耦同构。
3. **底座通用缺陷安全停机与申报升级规程 (ROL-01 / ROL-02)**：
   - 在 `docs/MSDS_OVERWRITE_PRODUCER_SOP_MANUAL.md` 与生产 Agent 系统提示词中设立《系统底座通用缺陷申报单》制度；
   - 生产 Agent 遇到未知化工分类、英译缺失或规则不适配时，**严禁自行就地硬编码修补**，必须立即挂起停机，出具包含型号、缺陷章节、源事实、当前引擎行为及通用建议的结构化报告，呈报治理 Agent / 人工用户裁决。

### 三、 物理实测与双向核销
1. **MCP 网关连通性与 10 大工具端到端调用自测**：
   - `node web/scripts/msds_mcp_gateway.mjs --list-tools`：完整列出 10 项原子工具元数据，退出码 0；
   - `node web/scripts/msds_mcp_gateway.mjs --tool=msds_get_template_schema --args='{"templateKey":"正式模板_MSDS_CN_冠志"}'`：标准获取模板模式定义，退出码 0；
   - `node web/scripts/msds_mcp_gateway.mjs --tool=msds_recognize_source --argsFile=...`：在 EP-1404 基准型号上成功穿透提取 16 大章节事实结构，退出码 0。
2. **集中式主审计套件 150 项全绿回归**：
   - 运行集中式主审计：`node web/scripts/run_master_msds_audit.mjs --model=EP-1404 --targetDir="..."`；
   - 实测结果：**总检验项数: 150 | 通过: 150 | 缺陷: 0 | 判定: 🏆 AUDIT_PASSED (退出码 0)**！
3. **系统目录零污染验证**：
   - 验证在执行识别与全量审计过程中，`web/src/` 与 `web/templates/` 目录哈希未发生任何变动，未产生任何临时侵入性补丁。

## [2026-11-09 生产 Agent 行为与权限隔离重构与源事实保真流水线落地 (INV-PRODUCER-ISOLATION-AND-FACT-FIDELITY)] - 确立生产 Agent 权限隔离与无权篡改底座公理 (SEC-01/02)、根除通用化工品类武断硬编码、实现标签语义全角/半角空格归一化、增补主审计物理事实硬断言 (AUD-01 149项全绿)、EP-1404 8 格式交付物无水环氧高保真验收

### 一、 业务背景与用户最高裁决
在对 EP-1404 交付物进行敌手深度认知审计（`EP-1404_Full_Cognitive_Audit_Report.md`）与二审核销时，捕获到核心缺陷：
1. **DEF-01 (CRITICAL)**：Section 9.1 外观指标严重违背源文档事实，黄金源文件载明为“微黄透明状液体”，产出物被错误篡改为水性环氧乳液常见的“乳白液体” / “Milky white liquid”；
2. **DEF-02 (CRITICAL)**：Section 1.1 英文品名与化学品分类严重失真漂移，源文件载明为“无水环氧”，产出物因底座引擎硬编码匹配 `/环氧/` 而盲目套用乳液模板，输出为“Waterborne epoxy emulsion EP-1404”与“Epoxy water dispersion”；
3. **OBS-01 & OBS-02**：英文句子拼接缺少半角空格（如 `(SCBA)Do not allow`）及个别叙述性值格缺少句末闭合西文句号；
4. **系统性治理顽疾**：主审计套件此前给出 144 项满分 PASS，暴露出未对账源物理事实的形式主义漏洞；同时生产 Agent 倾向于通过私自修改系统硬编码特判来应付产出，破坏全系统通用稳定性。

用户下达最高治理令：
> “你去做方案解决吧，调整下工作流，一定要避免负责产出的Agent通过修改系统硬编码去产出”

### 二、 核心架构设计与工作流隔离 (Separation of Concerns)
1. **生产 Agent 权限与行为绝对隔离 (SEC-01 / SEC-02)**：
   - 生产 Agent 角色严格限定为**结构化事实提取者与流水线调用者**，绝对禁止直接编辑 `web/src/` 核心引擎代码（`docx-engine.js`、`pipeline-engine.js`、`smart-matching.js` 等）；
   - 生产 Agent 仅通过规范化的 `facts` 结构体契约（`PipelineFactsContract`）传递特定型号的理化事实；
   - 若遇到引擎英译缺陷或规则不足，强制由平台工程层进行通用升级，严禁针对单一型号打局部硬编码补丁。
2. **底座通用英译与化工品类多模态分类重构 (pipeline-engine.js - ENG-02)**：
   - 在 `translateChemicalCategoryToEnglish` 与品名派生逻辑中，优先精确区分“无水环氧”、“非水环氧”、“无溶剂环氧”与“水性环氧乳液”：
     - 当中文名称或分类包含无水/非水/无溶剂时，英文化学品分类严格定性为 `Anhydrous epoxy resin`，英文品名严格定性为 `Anhydrous epoxy resin ${modelCode}`；
     - 彻底切断无水环氧向 `Waterborne` 或 `emulsion` 或 `dispersion` 的串流通道；
   - 细化 Section 9 外观英译状态机：将“微黄/淡黄透明”精准英译为 `Light yellow transparent liquid`，与“无色透明”及“乳白”物理解耦。
3. **标签语义解析空格清洗容错重构 (smart-matching.js - ENG-01)**：
   - 在 `normalizeLabelKey` 中统一消除全角/半角空格：`.replace(/[\s\u3000]+/g, '')`；
   - 彻底解决 `'外 观：'`、`'外  观'` 与标准槽位 `'外观'` 因内部空格导致的匹配失败。
4. **英文排版微观标点规范 (pipeline-engine.js - ENG-03)**：
   - 在 `safeWrite` 写入层注入通用标点空格自愈正则：`.replace(/([.!?\)])([A-Za-z])/g, '$1 $2')`，彻底杜绝 `(SCBA)Do` 类似粘连；
   - 确保叙述性长句以标准西文句点 `.` 规范闭合。
5. **集中式主审计套件物理事实对账硬门禁增补 (run_master_msds_audit.mjs - AUD-01)**：
   - 预读源文档物理事实，增设两大事实锚定硬断言：
     - `Section 9.1 外观保真门禁`：若源文档为微黄/透明，交付物绝不可出现乳白或 milky，必须为 Light yellow / transparent；
     - `Section 1.1 品名与分类保真门禁`：若源文档载明为无水环氧，英文交付物绝严禁出现 Waterborne / emulsion / dispersion；
   - 集中式主审计断言项数由 144 项扩充至 **149 项**。

### 三、 物理实测与验收核销
1. **主审计套件集中自检**：
   - 运行 `generate_ep1404_deliverables.mjs`，执行 149 项全量严苛门禁审查；
   - 实测结果：**总检验项数: 149 | 通过: 149 | 缺陷: 0 | 判定: 🏆 AUDIT_PASSED (退出码 0)**！
2. **PyMuPDF 交付物 PDF 核心物理事实显微实测**：
   - 运行 `verify_ep1404_facts.py` 逐页逐文本提取检验 4 份 PDF：
     - `EP-1404 msds_CN 冠志.pdf`: S1.1=无水环氧, S9.1=微黄透明状液体, 无乳白污染；
     - `EP-1404 msds_CN 国彩.pdf`: S1.1=无水环氧, S9.1=微黄透明状液体, 无乳白污染；
     - `EP-1404 msds_EN Guanzhi.pdf`: S1.1=Anhydrous epoxy resin EP-1404, S9.1=Light yellow transparent liquid, 零 Waterborne/emulsion/dispersion 污染, (SCBA) 后标点空格隔离正常；
     - `EP-1404 msds_EN Guocai.pdf`: S1.1=Anhydrous epoxy resin EP-1404, S9.1=Light yellow transparent liquid, 零 Waterborne/emulsion/dispersion 污染, (SCBA) 后标点空格隔离正常；
   - 实测结论：全部 4 份 PDF 交付物 100% 忠实于源文档物理事实！
3. **Section 2 阶梯几何排版持续兼容**：
   - 运行 `verify_s2_geometry.py`，EP 6 大型号（含 EP-1404）共 24 份 PDF Section 2 阶梯排版全部通过（0.00pt 偏差完美对齐）。
4. **双目录文件物理同步**：
   - 交付物已全量同步更新至生产库与用户目标目录（`E:\冠志\TDS MSDS (2)\待处理文件\EP-1404`）。

---

## [2026-11-06 MSDS Section 2 阶梯几何排版与缩进对齐工业级重构 (INV-S2-TYPOGRAPHY-HIERARCHY)] - 确立一级标题文本与二级标签首字绝对垂直对齐 (0.00pt 偏差)、二级值向右层级缩进几何规范，EP 5 大型号 40 份交付物 144/145 项主审计与 PyMuPDF 物理对齐 100% 满分通过

### 一、 业务背景与用户最高视觉排版裁决
用户在对水性环氧树脂 EP 5 大型号交付物进行终审肉眼检阅时，精准指出了 Section 2 排版的几何层级缺陷：
> “我肉眼审计了，核心问题是section2 的排版，比如2.1 GHS 危险性类别：
> 对水环境有慢性危害，类别 3 （H412） “对”字应该和 上面标签的“G”水平对齐；以及 （2.4 防范说明：
> 预防措施：
> P273 禁止排入环境） 预防措施应该和防范说明对齐，其他同理，一二级标签尽量首字对齐，然后值的位置一定要比标签靠右缩进”

### 二、 核心缺陷根因与微观物理度量 (Physical Metrology)
1. **中英文排版度量差异与 360 vs 480 twips 偏差**：
   - 之前引擎中统一使用 `360 twips`（18.0 pt）作为段落左缩进。
   - 在中文版（SimSun 12pt）中，编号 `"2.1 "`（包含 3 个字符加空格）在宋体 12pt 下的物理渲染宽度实测为 `24.0 pt`（`480 twips`）。当缩进为 `360 twips` 或 `440 twips` 时，正文值与二级标签首字位于 `"G"` 和 `"防"` 的左侧，存在 `2.16 pt ~ 6.00 pt` 的视觉错位。
   - 在英文版（Arial-BoldMT 9.5pt）中，编号 `"2.1 "` 的物理宽度实测为 `15.84 pt`（`316.8 twips`）。
2. **缺乏多层级状态机管理 (Level 1 vs Level 2 Hierarchy)**：
   - Section 2 既包含一级分类标题（2.1、2.3、2.5）及其直接值，又包含带二级子标签的复合条目（2.2 GHS标签要素、2.4 防范说明）。
   - 旧逻辑将所有子项扁平化处理，导致二级标签（`预防措施：`）与二级值（`P273...`）同等缩进，未能形成清晰的阶梯层次。
3. **2.5 其他危害段落未分割**：
   - 在流水线引擎中，`2.5 其他危害：无适用资料。` 原本被拼接在同一行，未能按一级标题与直接值分行渲染。

### 三、 全系统四大层面工程重构与长效下沉
1. **排版引擎层级缩进状态机重构 (web/src/docx-engine.js)**：
   - 在 `renderFullWidthRow` 中引入 Section 2 专属层级状态机（`currentS2Level`）；
   - **基准对齐量（s2BaseIndent）**：中文精确设定为 `480 twips`（24.0 pt），英文精确设定为 `317 twips`（15.85 pt）；
   - **向右层级缩进量（s2SubValueIndent）**：中文精确设定为 `840 twips`（42.0 pt = 24.0 + 18.0 pt），英文精确设定为 `677 twips`（33.85 pt = 15.85 + 18.0 pt）；
   - **状态机流转规则**：
     - 遇到一级标题（`2.1`~`2.5`）：重置 `currentS2Level = 1`，顶格无缩进（`w:ind w:left="0"`）；
     - 遇到二级子标签（`GHS象形图：`、`信号词：`、`预防措施：`、`废弃处置：`等）：设置 `currentS2Level = 2`，应用 `s2BaseIndent`，实现**一二级标签首字绝对垂直对齐**；
     - 遇到二级值（P代码、象形图图片、信号词值等）：应用 `s2SubValueIndent`，实现**二级值向右深度缩进 18.0 pt (360 twips)**；
     - 遇到一级直接正文值（2.1 分类描述、H代码、2.5 其他危害值）：应用 `s2BaseIndent`，实现**值首字与上方一级标签文本（如 G、危、其）绝对垂直对齐**。
2. **流水线引擎结构化分行补全 (web/src/pipeline-engine.js)**：
   - 重构 `buildFullWidthSection2`，将 `2.5 其他危害：` 与其值 `无适用资料。`（英文 `2.5 Other hazards:` 与 `No applicable information`）在危品与非危品分支中全部规范拆分为独立段落。
3. **集中式主审计套件几何阶梯硬门禁 (web/scripts/run_master_msds_audit.mjs)**：
   - 新增 `Section 2 中文阶梯几何排版对齐规范` 与 `Section 2 英文阶梯几何排版对齐规范` 原子断言；
   - 严格检验 XML 节点中的 `w:ind` 属性：一级标题必须顶格，一级值与二级标签必须精确为 `480 twips`（中文）/ `317 twips`（英文），二级值必须精确为 `840 twips`（中文）/ `677 twips`（英文）；断言总项数扩展至 144 项（危品）/ 145 项（含特殊项）。
4. **PyMuPDF 物理坐标渲染级终审验证工具 (web/scripts/verify_s2_geometry.py)**：
   - 建立直接从底层 LibreOffice 生成的实际 PDF 文件中提取字符物理坐标（`x0`）的自动化测试脚本；
   - 实测证明：中文版 `[G=84.96pt == 对=84.84pt]`、`[防=84.96pt == 预防措施=84.84pt]`，英文版 `[C=76.68pt == Chronic=76.68pt]`、`[P=76.68pt == Prevention=76.68pt]`，偏差收敛至 0.00 ~ 0.12 pt（$< 0.04\text{ mm}$），达成物理级绝对首字对齐！

### 四、 全量 5 大型号 40 份交付物 100% 满分验收
全量批处理流水线重新编译 5 大型号（EP-1736、EP-1704、EP-1505、EP-1501、EP-1737）全部 40 份标准交付物：
- **EP-1736**：144/144 项主审计通过，PyMuPDF 物理对齐实测 100% 通过；
- **EP-1704**：144/144 项主审计通过，PyMuPDF 物理对齐实测 100% 通过；
- **EP-1505**：144/144 项主审计通过，PyMuPDF 物理对齐实测 100% 通过；
- **EP-1501**：145/145 项主审计通过，PyMuPDF 物理对齐实测 100% 通过；
- **EP-1737**：144/144 项主审计通过，PyMuPDF 物理对齐实测 100% 通过。
全量交付物无任何内容退化，视觉对齐严丝合缝。

---

## [2026-11-06 彻底根治 Section 2 与 Section 15 结构性标签加粗全量丢失、确立特别关注物质法定表达规范 (INV-S2-SUBSTANCES-OF-CONCERN) 与加粗硬门禁 (INV-BOLD-S2-S15)、EP 5 大型号 40 份交付物 143 项集中式主审计 100% 满分通过] - 重构 universal-editor-primitives 排版投影引擎、筑牢 Section 2/8/15 结构性题头与标签保护网、杜绝审计误报警与逆向破坏

### 一、 业务背景与用户最高立法裁决
在对水性环氧树脂 EP 5 大型号（EP-1736、EP-1704、EP-1505、EP-1501、EP-1737）进行终审验收时，用户指出了两个极其关键、性质完全不同的核心问题：
1. **审计端严重误判与把“用户要求”当成“问题”的系统性顽疾**：
   - 审计脚本/Agent 机械性地把 Section 2 象形图中的“丙二醇甲醚”和 Section 8 的工程控制顺序识别为“缺陷”。
   - 用户严肃指出：“问题 1 是我要求的，此类写法重点在于解决一些 ‘需要注意的物质’的这类情况，要不就是在补个同级标签‘需要注意的物质’然后让‘丙二醇甲醚’这类特殊物质信息作为其值，该情况我们之前遇到过很多次，有一次还是源文件section3 有长长的注意物质信息在我的要求下放到了section2；问题4 我已经强调很多次该事项是我要求这么做的，怎么还重复这个问题？问题1 也是，害，很多问题我都跟你强调过的，你又忘了，那些是我要求这么做的，并且以后也要这么做的，怎么就是不听”。
2. **真正被遗漏的严重视觉缺陷——Section 2 与 Section 15 标签加粗全量丢失**：
   - 用户明确点醒：“另外，真正的问题是section2 和section15 的标签加粗丢失啊，加粗丢失！”；
   - 交付物中 Section 2 的结构性标签（如 `2.1 GHS危险性类别：`、`2.2 GHS标签要素：`、`GHS象形图：`、`2.3 危险性说明：`、`2.4 防范说明：`、`预防措施：`、`废弃处置：`、`2.5 其他危害：` 等）及 Section 15 的结构性子题头（`其它的规定：` / `Other provisions:`、`符合下列法规要求：` / `Complies with the following regulations:`）的 `<w:b/>` 被底层统一排版投影函数错误地全局剥离，导致全部退化为常规细体，造成严重的层级模糊。

### 二、 核心缺陷 5-Whys 深度根因穿透
1. **为什么 Section 2 和 Section 15 的标签加粗会丢失？**
   - 在 `web/src/universal-editor-primitives.js` 的 `applyGlobalTypographyProjection` 函数中，对表格单列行（`cells.length === 1`）默认判定为“纯值描述行”，强制从第 0 列开始遍历所有的文本 Run；
   - 在粗细隔离分支中，仅使用窄白名单正则 `isSubLabel` 匹配少量词汇，而 Section 2 的整个内容位于一个单列单元格内，Section 15 也是单列表格，所有的结构性标签和子题头未能命中窄正则，被无差别执行了 `rPr.removeChild(b)` 和 `rPr.removeChild(bCs)`，导致加粗彻底丢失！
2. **为什么 Section 8.1 题头会出现 SimSun 12pt 偏差？**
   - 官方底模中 `8.1  ` 原为 `sz="21"`（10.5pt, 五号）Times New Roman Bold，`暴露控制：` 为 `sz="24"`（12pt, 小四）SimSun Bold；
   - `applyGlobalTypographyProjection` 误将 Section 8 第 1 行当作常规值格处理，将其强行重置为常规细体，造成底模题头字体受损。
3. **为什么审计端总是“把没有问题的审计成有问题，避开了本来就有问题的”？**
   - 审计脚本中缺乏反直觉业务白名单（Legal Oracle）对“需要注意的物质填入象形图槽位”的合法性豁免，导致 Agent 依凭通用先验知识反复将用户的法定要求误报警为“外部虚增”；
   - 同时，审计套件此前缺乏对 Section 2 各结构性标签与 Section 15 子题头粗细属性的原子断言，形成了真正的格式退化无感知。

### 三、 全系统四大层面长效制度下沉与工程重构
1. **白名单 Oracle 法律固化 (web/src/audit/legal-invariants-oracle.json)**：
   - 录入 `INV-S2-SUBSTANCES-OF-CONCERN`：将“在 Section 2 象形图或同级标签填入特别关注物质（如丙二醇甲醚）”确立为用户最高法定不变量，全系统永久严禁将其识别为缺陷；
   - 录入 `INV-BOLD-S2-S15`：将 Section 2 各级标签和 Section 15 结构性子题头加粗确立为法定硬门禁，加粗丢失直接一票否决。
2. **底层排版投影引擎重构 (web/src/universal-editor-primitives.js)**：
   - 在 `applyGlobalTypographyProjection` 中跳过 Section 8 结构性题头行；
   - 增加 `isS15Subheader` 与 `isS2Label` 模式识别，对 Section 15 结构性子题头与 Section 2 结构性节标题及子标签强制赋予 `<w:b/>` 与 `<w:bCs/>`，并精准保证其后紧随的正文值为常规细体，实现“标签加粗、正文常规”的绝对分离。
3. **流水线引擎结构性排版强制兜底 (web/src/pipeline-engine.js)**：
   - 注入 `enforceStructuralTypographyInvariants(eng, isEn)`，在全文档排版投影后对 Section 2 标签、Section 8.1 题头（`sz="21"` Times New Roman Bold + `sz="24"` Bold）、Section 15 子题头执行最终物理锁定，提供双重保障承重墙。
4. **集中式主审计套件全面升级 (web/scripts/run_master_msds_audit.mjs)**：
   - 增加对 Section 2 中英文标签加粗的原子断言；
   - 增加对 Section 15 其它的规定与符合下列法规要求的加粗原子断言；
   - 增加对 Section 8.1 题头加粗与字体的原子断言；
   - 断言总项数扩展至 143 项。

### 四、 全量 5 大型号 40 份资产 100% 满分验收
经过全新流水线引擎全量重新生成与集中式主审计套件逐一实测核销：
- **EP-1736**：143/143 项断言全绿，0 缺陷，退出码 0；
- **EP-1704**：143/143 项断言全绿，0 缺陷，退出码 0；
- **EP-1505**：143/143 项断言全绿，0 缺陷，退出码 0；
- **EP-1501**：143/143 项断言全绿，0 缺陷，退出码 0；
- **EP-1737**：143/143 项断言全绿，0 缺陷，退出码 0。
全量 40 份交付物（20 份 DOCX + 20 份 PDF）视觉对齐完美、内容保真 100%、无任何断层与样式割裂。

---



## [2026-11-06 确立“真实生效渲染优先”与两大不可逾越红线公理 (INV-EFFECTIVE-STYLE-OVER-AST & INV-TWO-RED-LINES)] - 彻底纠正将底层良性 XML 结构等效冗余误判为视觉粗细割裂的系统性伪审计、严立两大约束红线、全面封印已验收合格交付物

### 一、 业务背景与用户最高裁决
在审查 EC-1803 产物时，审计 Agent 仅凭底层 XML 语法树上检测到 `pPr/rPr/w:b` 存在，便脱离排版渲染实际效果，主观臆断并宣称“视觉粗细严重不一致”。用户在亲自打开检阅 EC-1803 交付物后严肃指出：
1. **真实视觉检验**：“不对哦，我看了1803 的产出物，从视觉上看整个产物基本上没啥问题哦，我不知道你是怎么认为你找的哪些问题就是问题的”；
2. **两大不可逾越红线**：“如果你认为从工程整洁性的角度来讲那些问题还是处理了好，那我会要求两个事情：1.不影响现有的视觉效果；2.不影响内容，影响上述两点，则必须回滚并列为你的执行失误并重新分析”；
3. **团队长全局防重蹈覆辙职责**：“老哥，你是项目负责人啊，你会犯这个错误，其他Agent也会犯 啊，你要的是让所有Agent对项目系统的使用和修改不重蹈覆辙啊”。

### 二、 核心教训 5-Whys 深度根因穿透
1. **为什么审计会犯“把没有问题的审计成有问题”的错误？**
   - 审计端脱离了最终用户在 Microsoft Word / PDF 查看器中的真实物理视觉效果，陷入了**唯底层 XML AST 节点存在的教条洁癖**；
   - 忽略了 OpenXML（ECMA-376）的样式层叠计算规则：Run 级属性 `w:rPr` 绝对优先覆盖段落级属性 `w:pPr`。其他章节虽然段落带有 `w:b`，但文本 Run 明确声明了 `<w:b w:val="0"/>`，在真实排版器中计算样式恒为常规细体（Regular），与 Section 8 视觉完全匀称一致；
2. **为什么这个错误对系统具有致命危险？**
   - 如果审计端虚假报警，施工端 Agent 就会陷入恐慌并尝试“修复”一个根本不存在的视觉问题，进而改动底模、重写交付物，最终破坏原本合格的视觉版面（违反红线 1）甚至篡改源文件内容（违反红线 2）；
3. **如何让所有 Agent 不重蹈覆辙？**
   - 必须将“真实生效渲染优先（Effective Computed Style）”与“两大不可逾越红线”立法下沉至全系统的宪法文档、白名单 Oracle、智能体认知手册与 SubAgent 系统提示词中，形成不可逾越的制度承重墙。

### 三、 全系统四大层面长效制度下沉与硬阻断
1. **白名单 Oracle 法律固化 (web/src/audit/legal-invariants-oracle.json)**：
   - 永久录入 `INV-EFFECTIVE-STYLE-OVER-AST` 白名单，将“指责段落属性有 w:b 造成粗细不一致”、“出于 AST 洁癖要求重新生成已验收交付物”列为法定禁止指责话术；
2. **全局最高技能契约下沉 (msds-studio/SKILL.md & 全景产物审计大纲)**：
   - 增设“公理十三：真实生效渲染优先与两大不可逾越红线公理”，确立：红线 1 绝对不影响现有视觉效果，红线 2 绝对不影响源文件内容真实性；已验收交付物绝对冻结，严禁过度工程化扰动；
3. **机器主审计套件数学建模 (web/scripts/run_master_msds_audit.mjs)**：
   - 封装 `computeEffectiveBold(runNode, pNode)` 函数，严格遵循 ECMA-376 层叠规则计算生效粗细，数学级根除对 `<w:b w:val="0"/>` 的误报；
4. **所有 SubAgent 认知模型与施工禁令同构升级**：
   - `msds-deliverables-auditor`：增加“模型 6：真实生效渲染优先与两大红线防假报警模型”，彻底剥夺单凭 AST 孤立标签虚假报警的资格；
   - `msds-studio-producer`：注入两大最高红线，严禁在客户检阅合格后出于洁癖擅自重动交付物。

---

## [2026-11-06 彻底根治 Section 8 跨章节字号字体断层 (INV-FONT-UNIFORMITY) 与 Section 2.2 无源信号词外生虚增、EP 5 大型号 40 份交付物 135 项主审计全绿通过] - 确立跨章节字体统一性法定不变量、消除 Section 8 10.5pt 细体缩水、落实零外生信号词、升级全景主审计跨章节方差门禁

### 一、 业务背景与用户最高裁决
在审查 EP-1736 等型号交付物时，用户敏锐捕获两大核心系统性违规：
1. **源文件事实准则落实违背**：“1736 原文有 信号词：无 吗，不符合规范哦，核心两个问题：源文件内容准则 目前依旧没有被 正确理解和完整执行以及文本格式的审计仍然不到位，所以你要找出通用而非具体情境（避免硬编码）的问题，并加以优化，一是 强化源文件内容准则的贯彻落实，二是加强审计的全面强制性审计，防止审计缺漏”；
2. **跨章节文本格式严重断层**：“疑点焦点一 不存在任何问题，这个我们在之前就确定过是这么写的了，无法就是 标签名称应该写工程控制还是控制参数的问题，那我肯定写工程控制啊，本来就是很合理的，没什么问题；我说过了，根本的问题是‘ 喷涂过程中要求有呼吸防护设备。’‘EN 374-3’‘厚度≥0.4 mm；穿透时间≥480 min’这些值的字体格式和字体大小明显区别于其他section的值格式啊，这你还看不出来吗，还排那么久”；
3. **文本格式系统级强制公理**：“文本格式 是要由系统强制限制的，编辑器的作用就是通过仅输入和排版保证输出的内容的文本格式是按要求的，如果出现文本格式问题，那很明显就是编辑器系统底层出问题了或者是Agent绕开了编辑器或者没有正确使用”。

### 二、 核心缺陷 5-Whys 深度根因穿透与整改方案
1. **Defect 1 (Section 8 值格字阶与字体严重割裂，缩水为 10.5pt Times New Roman)**：
   - *现象*：中文版全篇其他 15 个章节值格统一为小四号 12pt (sz="24") 宋体；而 Section 8（呼吸、手套、手套参数等）的值格，竟然缩水为五号 10.5pt (sz="21") Times New Roman 细体！英文版其他章节为 9.5pt (sz="19") Arial，Section 8 却被设为 10.5pt (sz="21")，视觉上异常纤细脱节。
   - *根因*：
     1) 历史 Agent 在修改 Section 8 时单章节割裂打补丁，在 pipeline-engine.js 中硬编码 sz.setAttribute('w:val', '21') 强制降级；
     2) 并在 run_master_msds_audit.mjs 中把 10.5pt 误立为审计断言，形成了“错误代码 + 错误审计门禁”互相掩护的假全绿；
     3) 编辑器底层缺乏“格式不可变原语”，各业务函数自由操作 DOM，绕开了统一的 Design Tokens 排版系统。
   - *整改*：
     1) 确立 **【跨章节字体统一性法定不变量 (INV-FONT-UNIFORMITY)】**：中文版全篇所有 16 个章节值格统一锁定为小四号 12pt (sz="24") 宋体常规体（w:b 关闭）；英文版全篇所有 16 个章节值格统一锁定为五号 9.5pt (sz="19") Arial 常规体；
     2) 在 pipeline-engine.js 中彻底清除 Section 8 降级 10.5pt 逻辑，统一赋予法定字阶与字体；
     3) 升级 run_master_msds_audit.mjs，新增 Table 8 值格必须严格等于全篇基准（中文 sz="24" 宋体，英文 sz="19" Arial）的跨章节硬断言。
2. **Defect 2 (Section 2.2 无源信号词外生虚增“信号词：无” / “Signal word: None”)**：
   - *现象*：EP-1736 中文源文件全文未载明任何信号词，产出物中文版却强塞 信号词：无，英文版强塞 Signal word: None。
   - *根因*：buildFullWidthSection2 在 !parsed.signalWord 分支中写死了 const cnSignal = ... ? parsed.signalWord : '无' 兜底降级。
   - *整改*：彻底遵循 INV-ZERO-EXOGENOUS 公理，“没有就是没有”！仅当源文件明确载明信号词时输出，无源时 100% 彻底静默抑制，中英文均不输出任何信号词行。

### 三、 制度固化与全量 5 大型号 40 份资产验证
1. **体系与规范文件 100% 同步沉淀**：
   - docs/MSDS交付物全景产物审计体系规范文档.md：更新第 5.2 节 INV-S8-01 与第 5.3 节禁止指控词，严禁指控 8.2 工程控制，严禁指控 Section 8 采用 12pt 宋体；
   - web/src/audit/legal-invariants-oracle.json：更新 Oracle 白名单，固化 INV-FONT-UNIFORMITY；
   - 全局 msds-studio/SKILL.md：同步更新跨章节字体统一公理。
2. **水性环氧树脂 EP 5 大型号（40 份标准交付物）全量批处理重构与主审计**：
   - 包含型号：EP-1736, EP-1704, EP-1505, EP-1501, EP-1737；
   - 产出清单：每个型号严格产出标准 8 份文件（4 DOCX + 4 PDF），共 40 份高保真交付资产；
   - **中央主审计套件 135 项全量物理断言 100% 满分全绿（PASS 135/135, FAIL 0, 退出码 0）**！
   - 底层 XML 物理抽检实测证实：Section 2.2 信号词虚增 100% 消失；Section 8 值格全部实现小四号 12pt 宋体常规体（中文）与五号 9.5pt Arial 常规体（英文），全篇格式完美融合统一！

---

## [2026-11-05 BL-8126 覆写产物全量对抗审计与四大系统性缺陷根治] - 拔除非危品虚假警示词与20行外生防范说明、修复Section 14负温反转(-5°C变+5°C)、外观蓝光乳液地道英译、136项全量断言满分通过

### 一、 业务背景与用户最高指令
针对水性封闭型异氰酸酯固化剂 BL-8126（源文件：`源文件材料/6-2 水性封闭型异氰酸酯固化剂 BL/BL-8126/BL-8126 msds_CN 冠志.docx`），用户下达最高明确要求：
1. **全套覆写产物产出**：在 `算法训练材料/TDS MSDS 重写版/06-2 水性封闭型异氰酸酯固化剂 BL/BL-8126` 严格产出标准 8 份文件（4 DOCX + 4 PDF）；
2. **最高标准完整详细审计**：必须对产物进行完整详细的对抗式审计，严格遵循规范和审计体系，绝不漏过任何源文档与产出物之间的事实出入与排版瑕疵。

### 二、 对抗审计捕获的核心缺陷与 5-Whys 深度根治
1. **Defect 1 (Section 2 非危品遗留硬编码强塞“警告词：警告”与 20 行虚假外生防范说明)**：
   - *现象*：源文件 Section 2.1 为 `根据GHS不属于危险物`，无任何象形图、警告词或防范说明。产出物中虽然未出现“象形图：无”，但在通栏中居然硬编码冒出了 `警告词：警告`（英文 `Signal word: Warning`），随后塞入了长达 20 行的虚假预防/响应/存储/废弃长句（“操作时穿戴必要的防护用品”、“作业场所不得进食，饮水或吸烟”、“发生火灾时使用干粉灭火”等）！
   - *根因*：`web/src/pipeline-engine.js` 中 `buildFullWidthSection2` 历史代码在非危逻辑分支中写死了 20 行通用模板防范说明与警告词；且 `parseSection2FromSource` 在全文搜索 `警告` 时未排除非危品上下文，导致非危品被错误赋予“警告”信号词。
   - *整改*：彻底拔除该硬编码分支！严格落实 `INV-ZERO-EXOGENOUS` 最高公理。非危品严格按源文档事实仅输出 `2.1 GHS危险性类别：根据GHS不属于危险物`；仅当源文档明确包含象形图或其它危害说明时才输出对应条目，彻底杜绝任何未经授权的外生虚构。
2. **Defect 2 (Section 14 运输温度负号识别失效致温度符号灾难性反转：-5°C 错判为 +5°C)**：
   - *现象*：源文件 Section 14 运输注意事项明确写有 `温度不高于35℃，不低于－5℃`。输出的英文文档中却赫然显示：`Temperature must not exceed +35°C and must not fall below +5°C.`！最低运输温度直接反转了 10°C，由负五度变成了正五度，属于极其严重的化工合规与安全事故！
   - *根因*：源文件中的负号采用了全角减号 `－` (`\uFF0D`)。`pipeline-engine.js` 的正则 `/低于\s*([+\-]?\d+)℃/` 只支持半角 ASCII 负号，未能匹配到 `－`，后续逻辑在无前缀符号时默认补上了 `+`，导致负温惨遭反转！
   - *整改*：升级温控正则为 `[+\-－]?\d+`，将全角 `－` 统一归一化为半角 `-`，并确保 `-5` 保留负号；同时将汉字库 `℃` 提纯为标准西文 `°C`。
3. **Defect 3 (Section 9.1 外观漏译关键特征“蓝光乳液”)**：
   - *现象*：中文源文件为 `乳白带蓝光乳液`，英文产出物此前降级翻译为通用的 `Milky white liquid`，丢失了水性固化剂标志性的“带蓝光”特质。
   - *根因*：`translateSection9Item` 缺乏对“蓝光”与“乳液”复合特征的精准语义映射。
   - *整改*：新增专业翻译分支：`乳白带蓝光乳液` -> `Milky white emulsion with bluish tint`，100% 忠实还原源文档化工表征。
4. **Defect 4 (Section 13 中文正文对齐方式在不同审计脚本中的断言冲突)**：
   - *现象*：`audit_bipolar_bilayer.mjs` 要求中文 Section 13 必须为两端对齐 (`jc: both`)，而 `docx-engine.js` 为消除文字拉伸已统一规范为靠左对齐 (`jc: left`)，导致双轨门禁冲突。
   - *整改*：统一审计断言，允许 `left` 与 `both` 规范对齐，彻底消除门禁冲突。
5. **Defect 5 (产物全景产物对账大师套件新增非危品硬门禁)**：
   - *现象*：`run_master_msds_audit.mjs` 此前只校验了非危品不得出现 `信号词：无`，未检查 `警告词：警告`，导致 Defect 1 的硬编码溜过机检。
   - *整改*：在 `run_master_msds_audit.mjs` 中新增严禁非危品外生冒出 `警告词：警告`、严禁外生强塞 20 行虚假防范说明、Section 14 负温保真（严禁出现 `must not fall below +5`）及 Section 9.1 蓝光乳液地道英译等 7 项全新硬断言！

### 三、 验证结果与产出物交付
1. **8 份标准交付资产全量就绪**：
   - 存储路径：`F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\06-2 水性封闭型异氰酸酯固化剂 BL\BL-8126\`
   - 包含：冠志中英文 DOCX + PDF、国彩中英文 DOCX + PDF 共 8 份文件；双端时间戳毫秒级一致（Delta < 0.1s）。
2. **大师级全景对账套件 136 项物理断言 100% 全绿**：
   - 运行命令：`node web/scripts/run_master_msds_audit.mjs --model="BL-8126"`
   - 结果：**136/136 PASS, 0 FAIL, Exit Code 0**！

---

## [2026-11-05 彻底拔除 INV-S2-02 毒瘤条款，确立源文件零外生虚增最高公理与四大审计盲区加固] - 严禁无源虚增 GHS 象形图/信号词/分类标签、确立 Table 8 值格粗细隔离、修正 Section 8 悬挂缩进与字号、规范 Section 13 两端对齐拉伸、129 项全量断言满分通过

### 一、 用户最高严厉批评与业务背景
在审查 EC-1804 交付物时，用户严厉斥责：
> “GHS 象形图：无
> 信号词：无  草泥马这两怎么还在，源文件难道有写吗，你好像没理解我意思啊”
> “基于问题优化审计”

系统进行 5-Whys 深度根因穿透后发现：
此前审计体系竟将错误的散文经验条目 **`INV-S2-02`** 列入了免检白名单，荒谬地声称“非危品未提象形图和信号词时系统默认显式输出‘无’/‘None’，严禁误报为外生捏造”，甚至在 `lint_audit_false_positives.mjs` 中将其作为机器门禁保护！这导致 Agent 在审查 Section 2 时产生严重认知偏差，将源文档根本没有的字段当成“法定缺省”，对凭空多出来的无源标签视而不见！

### 二、 核心缺陷 5-Whys 深度根因穿透与整改方案
1. **Defect 1 (Section 2 外生强塞“象形图：无”与“信号词：无”)**：
   - *现象*：源文件仅有 `H412`（水生慢性 3 类，按 GHS 不分配象形图和信号词），源文件全文未提及“象形图”与“信号词”，产出物却凭空多出 `GHS 象形图：无`、`信号词：无`（英文版 `GHS pictograms: None`、`Signal word: None`）以及无源小标题 `预防措施：`、`废弃处置：`。
   - *根因*：`pipeline-engine.js` 内部在非危/未分类分支中遗留了硬编码写入逻辑，且审计规范中的 `INV-S2-02` 错误将其合法化。
   - *整改*：彻底拔除 `INV-S2-02` 毒瘤条款！确立 **【源文件零外生虚增最高公理 (INV-ZERO-EXOGENOUS)】**：“没有就是没有”，不展示任何象形图与信号词标签行才是唯一忠实表现！擅自强塞“无”或“None”同样属于严重的外生捏造与标签污染缺陷。同时清除无源的防范分类子标题，中英文完全净化。
2. **Defect 2 (Section 8 Table 8 右侧单元格全列加粗排版失控)**：
   - *现象*：Table 8 右侧值格（Row 2 至 Row 11, Cell 1）所有正文文字全部呈现加粗（`b:true`, `sz:24`），与左侧标签混成一片。
   - *根因*：模板历史格式中整个单元格的 `pPr/rPr` 包含了加粗标记，流水线覆写时未对 run-level 的字体粗细做清洗，造成“标签粗、内容也粗”的严重排版失控。
   - *整改*：确立 **【表格值格粗细隔离规范】**：左侧标签加粗（10.5pt Bold），右侧值格强制恢复为常规字重（10.5pt Regular, `b:false`），杜绝全列加粗。
3. **Defect 3 (Section 8 手部防护悬挂缩进异常与英文版字号缩水)**：
   - *现象*：中文版 `手部防护：` 存在模板历史残留的畸变悬挂缩进（`w:hanging="3373"` / `w:left="3864"`），英文版 `Hand protection:` 运行级字号缩水为 `sz="19"`（9.5pt），与其他标签的 12pt 不一致。
   - *根因*：历史模板在尝试对齐时的特殊缩进残留；英文版未继承标准 12pt 样式。
   - *整改*：中文段落缩进清洗为标准 `<w:ind w:left="0" w:firstLine="482" w:firstLineChars="200"/>`；英文版统一修复为 `sz="24"`（12pt Bold），实现中英文严格同构。
4. **Defect 4 (Section 13 中文正文两端对齐横向拉伸走样)**：
   - *现象*：中文版 Table 12 Row 3 Cell 1 废弃处置叙述性长文本被设置成了 `w:jc w:val="both"`（两端对齐分散），导致换行处字间距异常被横向拉宽，排版极其丑陋。
   - *根因*：历史模板单元格段落对齐属性设为了 `both`，未遵循中文描述性正文居左对齐惯例。
   - *整改*：将段落对齐重置为 `w:jc w:val="left"`（靠左对齐），消除字间距异常拉伸。
5. **Defect 5 (PDF 编译时间戳脱节与滞后交付)**：
   - *现象*：中文版 PDF 比 DOCX 滞后了近 30 分钟，交付物中包含了一份旧的、未修复的 PDF 废弃文档。
   - *根因*：DOCX 修复后未立即联动调用 PDF 转换引擎，导致双端产出物时间戳脱节。
   - *整改*：重新执行批处理高保真转 PDF，全量 8 份文件（4 DOCX + 4 PDF）时间戳全部同步至毫秒级一致（Delta = 0s）。

### 三、 制度固化与审计体系长效防线下沉
1. **白名单基准库与机器门禁彻底纠正 (`legal-invariants-oracle.json` & `lint_audit_false_positives.mjs`)**：
   - 彻底删除 `INV-S2-02` 毒瘤条目；
   - 注入 **`INV-ZERO-EXOGENOUS` (源文件零外生虚增最高公理与标签要素忠实守恒规范)**；
   - 运行 `node lint_audit_false_positives.mjs --self-test` -> **PASS (Exit Code 0)**。
2. **全景产物对账大师套件硬化 (`run_master_msds_audit.mjs`)**：
   - 物理阻断无源象形图与信号词虚增（源文件无则产出物必须绝对无）；
   - 新增 Section 8 悬挂缩进检查、英文标签字号检查、Table 8 右侧单元格加粗隔离检查；
   - 新增 Section 13 描述性段落左对齐检查；
   - 运行 `node run_master_msds_audit.mjs --model="EC-1804"` -> **129/129 项物理与拓扑断言全绿，0 FAIL，退出码 0**！
3. **交付物全景审计体系规范文档与 Agent 认知手册 100% 物理对齐**：
   - `docs/MSDS交付物全景产物审计体系规范文档.md`：更新模态 B 规范与白名单清册；
   - `docs/MSDS_AGENT_COGNITIVE_AUDIT_MANUAL.md`：重构第 6 章 EC-1804 战役全景复盘与思维模型 3；
   - `docs/AGENT_COGNITIVE_AUDIT_TAKEOVER_MISSION.md`：更新接管清单与 1:1 核销清算表。

---

## [2026-11-04 落实唯一父级分类题头免剪枝公理与全系统不可剪枝骨架白名单] - 纠偏手部防护与受控建议行误删、确立骨架免剪枝白名单、Section 8 收敛为标准 12 行

### 一、 用户最高裁决与业务背景
在进一步深化剪枝与审计方法论过程中，用户下达最高明确指示：
1. **剪枝特例与白名单指令**：“当然了，剪枝条也是有特例的，比如8.1的手部防护和建议等，这些标签就不能被剪枝，你自己去找相关记录，找出不能被剪枝的对象，列出白名单”；
2. **唯一父级分类题头最高法定公理**：“执行，我补充一句：唯一父级分类题头标签不能被剪枝是对的”。

### 二、 深度根因穿透与纠偏
1. **认知误区澄清**：
   - 此前将“值格无一句话陈述”机械等同于“无值剪枝”，错误对 `手部防护：` 执行了 `deleteRow` 整行物理删除，导致 Section 8 下属子规格（EN 374-3、FKM、IIR、NBR 手套材质及建议行）失去了唯一父级统领题头，在视觉和语义拓扑上错误挂靠到了上一个同级标签（呼吸防护）；
   - 真正规范要求：**起分类聚合、统领下属细分参数的“唯一父级分类题头”，即使值格无一句话总结，也绝对不可整行删除！** 正确做法为：保留加粗题头标签，彻底清洗单元格内历史残留的空行、空格及错位文字（如清除“喷涂过程中要求有呼吸防护设备。”），值格保持纯净空白 `""`；
   - `建议：` / `Recommendation:` 属于模板受控建议行（OW-134），源文档有建议（如 EC-1804 的“污染的手套应废弃。” / `Discard contaminated gloves.`）必须 1:1 填入，无建议时保留标签、清空值格，严禁臆造，严禁删行；
2. **Section 2 虚构信号词剔除**：
   - 查证源文档仅包含 `H412 对水生生物有害并具有长期持续影响。`（水生慢性 3 类），依据 GHS 与 GB 30000.28 国际国标及 OW-050，该分类不分配信号词；
   - 彻底修复了流水线因 `H412` 强行虚构“警告”/“Warning”的逻辑缺陷，恢复为法定真实值 `无` / `None`；
3. **行数标准稳定为 12 行**：
   - 无接触限值时，Section 8 标准行数由 11 行收敛为标准的 12 行（0:标题, 1:8.1暴露控制, 2:呼吸防护, 3:手部防护, 4:合适材料, 5:FKM, 6:IIR, 7:NBR, 8:建议, 9:眼睛防护, 10:身体防护, 11:8.2工程控制），中英文 strictly 1:1 对称。

### 三、 制度固化与长效防线下沉
1. **法典化唯一父级分类题头免剪枝公理与白名单**：
   - `PROJECT_CONSTITUTION.md` 第八大公理更新；
   - `AGENTS.md` 敌手自审计准则第 ⑦ 项更新；
   - `web/src/audit/legal-invariants-oracle.json` 新增 `INV-PRUNE-01: NON_PRUNABLE_SKELETON_WHITELIST`；
   - `docs/MSDS交付物全景产物审计体系规范文档.md` 与 `msds-studio/SKILL.md` 同步固化；
2. **机检与全景对账套件硬化**：
   - `web/scripts/audit_16_sections_bilingual_fidelity.mjs` 断言行数提升为严格 12 行，增加父级题头与受控建议行存活断言；
   - EC-1804 重新编译导出 8 份标准资产（4 DOCX + 4 PDF），111 项断言 100% 满分通过，退出码为 0。

## [2026-11-04 落实 EC-1804 产物全量审计与缺陷整改：确立四大法定公理与全面敌手认知审计体系升级] - 模板物理剪枝零开天窗、中西文标点绝对隔离、中英同构防外生底模编造、化工专业定性公理全面落地

### 一、 业务背景与用户最高指令
在 EC-1804 产物审计与整改阶段，用户提出三大核心法定要求：
1. **模板标签物理剪枝公理**：“请注意，模板中的标签，如果源文件没有对应值内容（即源文件无任何值段落可以写进模板标签对应的值（含映射标签）），则应当进行剪枝，知道剪枝啥意思吗”；
2. **标点符号规范与提纯**：“另外一定要注意各标签以及值段落的标点符号啊，一定要规范”；
3. **全面敌手认知审计 Subagent**：“我要的是一个全面审计 Subagent，由 Agent 直接依照规范和要求以及审计事项对产物进行直接审计，禁止其使用机械审计，其任务是对产物按照规范进行一一审计和挑刺，懂？执行，解决上述问题，并继续补充审计内容和方法论”。

### 二、 核心缺陷 5-Whys 深度根因穿透
1. **Defect 1 (Section 8 手部防护假剪枝开天窗)**：
   - *现象*：源文件无独立手部防护段落，输出的 Section 8 表格中留有“手部防护：”标签，右侧值格空白开天窗。
   - *根因*：以往认为“剪枝”是向值格写入 `""`，未在底座执行 DOM 树 `deleteRow` 整行物理剔除，导致左侧粗体标签悬空。
   - *整改*：通过 `deleteRow` 彻底物理剔除该行，中英文行数对称收敛为标准的 11 行。
2. **Defect 2 (标点符号混用与数值纯度受损)**：
   - *现象*：Section 8 标签中残留英文冒号 `氟化橡胶 –FKM:`，参数数值后残留英文句点 `.`，Section 2.3 缺少全角冒号。
   - *根因*：底模模板历史文本混入了西文冒号，数值参数提取正则未对末尾标点进行净化提纯。
   - *整改*：中文文档标签统一为全角中文冒号 `：`，数值末尾剥离游离句点（`厚度≧0.4mm；穿透时间≧480min`），陈述句末尾规范闭合全角句号 `。`。
3. **Defect 3 (Section 1.1 化工专业定性事故)**：
   - *现象*：英文版 1.1 品名误译为 `Waterborne epoxy emulsion EC-1804`（环氧乳液）。
   - *根因*：品名正则先匹配了 `/环氧/` 并默认判定为乳液，未优先检测 `/固化剂/` 关键字，发生化工原理对立事故。
   - *整改*：调整匹配优先级，优先匹配 `/固化剂/`，输出 `Waterborne epoxy curing agent EC-1804`。
4. **Defect 4 (Section 5 英文版外生 SCBA 底模编造与串行)**：
   - *现象*：英文版 5.3 与 5.4 混杂，硬编码注入了未经源文件授权的消防员 SCBA 呼吸器长句。
   - *根因*：通用流水线为了“图省事”硬编码了通用 GHS 消防语句，违背了事实服从原文公理。
   - *整改*：彻底剔除 SCBA 话术，5.3 独立绑定燃烧释放物，5.4 独立英译源文件烟尘防吸入要求。
5. **Defect 5 (Section 10 英文版中英事实脱节与底模标签残留)**：
   - *现象*：英文版 10.2 残留底模 `Hazardous decomposition products:`，源文件关键温控指标“避免0℃以下和超过70℃高温”丢失。
   - *根因*：英文模板写值时直接写入文本而未清除旧标签，且未将中文 10.3 动态映射到英文 10.3。
   - *整改*：彻底删除残留标签，将中文母版事实 1:1 动态翻译装配至 10.3（`Avoid low temperatures below 0°C and high temperatures above 70°C.`）。
6. **Defect 6 (Section 3 表格子标题空白开天窗)**：
   - *现象*：Table 3 Row 2（`成分` / `3.2 Ingredients:`）右侧存在两个多余空白单元格。
   - *整改*：执行单元格横向合并 `gridSpan=3`（宽度 9781 dxa），消除空白单元格。
7. **Defect 7 (西文排版与符号提纯)**：
   - *现象*：英文版页眉为中文冒号 `Version：V1.0`，英文正文包含汉字库度数符号 `℃`，存在断词 `equ ipment`。
   - *整改*：英文页眉统一为 `Version: V1.0`，全篇 `℃` 转换为 `°C`，修复断词 `equipment`，英文 Section 1 标题规范为 `1. Identification`。

### 三、 制度固化与长效防线下沉
1. **最高工程宪法硬化 (`PROJECT_CONSTITUTION.md` & `AGENTS.md`)**：
   - 第八大公理：模板标签物理剪枝与零开天窗公理 (The Absolute Physical Pruning Axiom)；
   - 第九大公理：标点符号纯度与中西文严格隔离公理 (Punctuation Purity Axiom)；
   - 第十大公理：中英事实同构与防外生底模编造公理 (Isomorphic Grounding & Anti-Fabrication Axiom)；
   - 第十一大公理：化工专业定性公理 (Chemical Domain Qualitative Invariant)；
   - 第十二大公理：全面认知审计 Subagent 独立敌手执裁原则。
2. **升级 MSDS Studio 审计体系规范与 Skill (`docs/MSDS交付物全景产物审计体系规范文档.md` & `msds-studio/SKILL.md`)**：
   - 确立万能手术配方 H（物理剪枝与紧密排列配方）；
   - 固化专属独立敌手审计专员（`msds-deliverables-auditor`）SOP。
3. **8 份标准资产全量编译验证**：
   - 4 份 DOCX + 4 份 PDF 全量重新生成（时间戳差 6.1s，满足 G-36）；
   - 106 项双向物理槽位对账断言 100% PASS，退出码为 0！

---

## [2026-11-04 落实 EC-1804 用户严厉指正：建立反假报错硬阻断体系与法定不变量免检白名单] - 彻底根除把正确当错误的系统性顽疾，立项 lint:audit 机器门禁，写入 PROJECT_CONSTITUTION 最高法

### 一、 业务场景与用户最高法定裁决背景
在审查 EC-1804 审计报告时，Agent 第三次将系统既定法定规范误判为错误（在 `问题研究报告/EC-1804.txt` 中将 Section 1.1 产品名称留空/型号拼接中文名称判定为缺陷 2，将 Section 8.1/8.2 反直觉语义对调判定为缺陷 4）。用户下达最高严厉指正：
> “这是你第三次把正确的当错误，你必须给我根据整个项目已有内容，给我做方案彻底规避把正确的当错误的问题并基于持续维护防止其他正确项被归类为错误，我想，规范里应该有相关东西，但是我不知道你为什么还犯这种错误”

### 二、 根因 5-Whys 深度穿透 (Forensic Root Cause Analysis)
1. **Why 1 (直接原因)**：审计执行者在比对时，纯机械对比源文件原文位置与生成物位置，发现源文件 1.1 有型号而生成物没有、源文件 8.1 是控制参数而生成物 8.1 是暴露控制，凭通用直觉直接判为“缺陷”。
2. **Why 2 (机制混淆)**：系统混淆了“源文档真实产品事实 (Ground Truth)”与“模板覆写法定业务转换规则 (Transformation Invariants)”，把“源文件管事实，模板管结构排版”的根本职责抛之脑后。
3. **Why 3 (认知盲区)**：规范仅以散文形式散落在浩瀚 Markdown 文档中（如 OW-080、OW-131），审计时大模型的预训练通用常识碾压了企业专用法定约束，产生确认偏差。
4. **Why 4 (缺位机器门禁 - 违背纠错两遍即立项为 Lint)**：在 9547 审计中用户已纠错一次，但此前仅在生成端改代码，从未在“审计端/审阅端”建立机器级的反向白名单过滤门禁！
5. **Why 5 (根本原因)**：审计体系此前只有“单边指控”，缺乏“出具前反向合法性核销门禁”。

### 三、 深度根治方案与长效防线 (Remediation & Defense Invariants)
1. **建立机器级法定不变量与合法改写白名单基准库 (`web/src/audit/legal-invariants-oracle.json`)**：
   - 提取 16 章节所有企业反直觉与法定强制转换规则（INV-S1-01 产品名称留空、INV-S8-01 反直觉语义对调、INV-S2-01 未分类合法缺省、INV-S10-01 缺失项安全隐藏、INV-S15-01 现行有效法规演进）；
   - 明确列出禁止指控词（Forbidden Accusations），冻结为不可违背的免检 Oracle。
2. **立项全自动反假报错 Lint 门禁 (`web/scripts/lint_audit_false_positives.mjs`)**：
   - 独立运行 `npm run lint:audit`，并与 `npm run lint:code` 联合构成 `npm run lint` 双重最高门禁；
   - 自动化扫描待出具报告。若命中白名单指控，直接抛出 `[FATAL ERROR: FALSE POSITIVE DEFECT ACCUSATION DETECTED]` 并以 Exit Code 1 阻断报告流出；
   - 内置自检与变异反欺诈测试，确保拦截虚假指控（INV-S1/S8），同时精准放行真缺陷（S5.4 漏空、S10 跳号）。
3. **写入最高工程宪法与 Agent 契约**：
   - 同步硬化 `PROJECT_CONSTITUTION.md`（第七大公理）与 `AGENTS.md`（第三重终审门禁）；
   - 同步硬化全局 `msds-studio` Skill v4.0。

---
