# Change Proposal: table-geometry-and-vmerge-normalization

## Why
在历史处理中，当模板中原有的多列/多行复合表格行（如 Section 11 中带有 `生育力` 子项的 11.7 生殖毒性 3 列行）被自动化算法收敛为单行双列（标签与值）时，仅调用了简单的单元格物理删除，导致：
1. 剩余单元格未继承标准双列行的跨列属性（`w:gridSpan`）与宽度（`w:tcW`），导致该行宽度缺损 1946 dxa（约 3.4 cm），表格右边框凹陷断裂；
2. 单元格保留了多行纵向合并的残余属性 `<w:vMerge w:val="restart"/>`，引起纵向合并悬空和排版错位。

为了彻底杜绝此类表格几何缺陷再次发生，必须在底层引擎中引入通用的“表格行几何自愈与网格守恒机制（Table Row Geometry Normalizer）”，使任何删列、收敛或覆写动作均能自动继承母版基准网格拓扑，实现宽度守恒、跨列补齐与悬空合并自愈，从根本上增强系统的稳健性与可操作性。

## What Changes
1. **建立表格几何自愈与归一化中枢（`normalizeRowGeometry`）**：
   - 在 `web/src/docx-engine.js` 中构建受管函数 `normalizeRowGeometry(row, targetColCount, baselineRow)`。
   - 自动检测并消除悬空的 `<w:vMerge>`（若单行没有后续 continue 行，自动剥除 `vMerge`）。
   - 自动将收敛后的双列行对其同表中标准双列行的几何属性（如 Section 11 中自动设置 `w:w="6262"` 并注入 `<w:gridSpan w:val="3"/>`）。
2. **全流水线与编辑器操作性加固**：
   - 在 `smart-matching.js` 和 `pipeline-engine.js` 中，凡涉及 Section 11 及其他章节行收敛与删列的地方，一律自动调用 `normalizeRowGeometry`。
   - 保证中英文全版本在任意删列与合并场景下，整行总宽度恒等于表格标准总宽（`9781 dxa`），右边框 100% 垂直齐平。
3. **Skill 规范法定化与门禁闭环**：
   - 在本地与全局 `msds-studio/SKILL.md` 中增加“表格几何网格守恒与纵向合并闭环法定不变量”，禁止任何未经几何补全的单元格删除行为。
