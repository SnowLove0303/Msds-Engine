# 行为契约规范：PA-4840 与 PA-4902 产出物全景重对照与内容保全

> **规范文件**: `specs/content-fidelity.md`  
> **符合标准**: RFC 2119 (SHALL / SHALL NOT / SHOULD)

---

## SPEC-01: PA-4840 Section 2 危险性分类与说明全量保全契约
1. **SHALL 提取全量危险性语句**：当源文档在 Section 2（含 `2.2 标签要素` 或 `CHS危险性类别:`）载有多个危险性分类及危害描述时，流水线解析器 SHALL 提取全部项，严禁仅提取单一 `H412` 编码；
2. **SHALL 呈现全部 6 大危害事实**：
   - 急性毒性4经口吞咽有害 (Harmful if swallowed.)
   - 急性毒性4经皮皮肤接触有害 (Harmful in contact with skin.)
   - 急性毒性4吸入性吸入有害 (Harmful if inhaled.)
   - 眼睛刺激2 造成严重的眼刺激 (Causes serious eye irritation.)
   - 皮肤刺激2 造成皮肤刺激 (Causes skin irritation.)
   - 对水生生物有害并具有长期持续影响 (H412 Harmful to aquatic life with long lasting effects.)
3. **SHALL 双语 1:1 对称**：英文版交付物 Section 2 SHALL 对齐包含上述全部 6 项英文危害声明与分类。

---

## SPEC-02: PA-4840 与 PA-4902 Section 1.1 中文化学品分类绑定契约
1. **SHALL 填充分类值**：中文交付物 Section 1 第 3 行“化学品分类：”对应的第 1 列单元格 SHALL 严格绑定源文件事实（PA-4840 必须为“丙烯酸聚合物分散体”，PA-4902 必须为“水溶性丙烯酸聚合物树脂”），SHALL NOT 留空；
2. **SHALL 建立源头回溯机制**：若模板插槽初始值为空，流水线 SHALL 自动穿透至 `srcEngine` 或结构化事实元数据中检索并回填，杜绝空白单元格遗留。

---

## SPEC-03: PA-4902 Section 2 标签“危险象形标记：无”精准呈现契约
1. **SHALL 忠实呈现无象形标记事实**：当源文件载明“危险象形标记：无”（或象形图无）且产品为非危险化学品时，Section 2 标签要素中 SHALL 清晰规范呈现“危险象形标记：无”或“象形图：无”；
2. **SHALL 保持信号词忠实性**：源文件载明“警告词：警告”时，交付物 SHALL 输出“警告词：警告”（或“信号词：警告”），英文版对应输出 `Signal word: Warning`；
3. **SHALL NOT 虚增或误报**：审计套件 SHALL 识别该项来源于源文件，SHALL NOT 产生“非危品虚假警告词”或“外生虚增象形图”的误判。

---

## SPEC-04: PA-4902 成盐中和剂附注迁移至 Section 2 契约 (PA-3223 标杆规范)
1. **SHALL 迁移至 Section 2**：源文件位于 Section 3 下方的聚合物危险性分类与成盐中和剂法规警示附注，流水线 SHALL 完整迁移至 **Section 2** 的通栏结构中（置于分类与标签要素之间，作为标签要素前置警示，严格对齐 PA-3223 标杆）；
2. **SHALL 纯净化 Section 3 表格**：PA-4902 中英文交付物的 Section 3 成分表格 SHALL 严格保持为 4 行纯化学组分网格（羟基丙烯酸酯聚合物、水、乙二醇丁醚、N,N二甲基乙醇胺），SHALL NOT 在 Section 3 表格内部或底部追加任何附注行；
3. **SHALL 双语 1:1 对齐**：英文版 Section 2 SHALL 动态挂载对应的专业英译成盐中和剂法规说明，Section 3 同样为纯净 4 行。

---

## SPEC-05: PA-4902 Section 11 组分级毒理数据 4 行通栏承接契约
1. **SHALL 采纳范式 1 结构**：PA-4902 Section 11 SHALL 按照 PA-3223 标杆构建 4 行通栏合并表格：
   - Row 0: `11.毒性资料` (11.Toxicity information)
   - Row 1: `该产品无可用的毒理学研究。` (No toxicological studies are available on the product.)
   - Row 2: `下面是这些成分的毒理学数据。` (The following is toxicological data for these ingredients.)
   - Row 3: 完整展示水溶性羟基聚丙烯酸酯与乙二醇丁醚动物实验数据（经皮、吸入、经口 LD50 与刺激性）；
2. **SHALL NOT 仅产出单行**：严禁将 PA-4902 Section 11 降级为单行文字而丢弃关键成分实验数值。

---

## SPEC-06: 产出物全景重对照法医硬审计门禁契约
1. **SHALL 建立自动化物理重对照核验**：构建 `audit_full_fidelity_reconciliation.mjs`，直接提取源文件底层 XML DOM 与产出物 XML DOM 进行逐项硬编码对账；
2. **SHALL 一票否决**：若检测到 PA-4840 Section 2 危害语句缺失、PA-4902 Section 2 象形标记或中和剂说明缺失、Section 3 出现附注行残留、Section 11 LD50 丢失或 Section 1 分类空白，套件 SHALL 立即抛出异常并以非 0 退出码阻断发布。
