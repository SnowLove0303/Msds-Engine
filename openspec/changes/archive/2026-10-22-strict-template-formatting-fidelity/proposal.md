# Change Proposal: strict-template-formatting-fidelity

## Why

在历史演进过程中，MSDS Engine 的编辑器功能与覆写流水线存在局部手写样式的反模式（如自作主张修改悬挂缩进为 457、私自注入 `<w:tabs>` 制表位、私自将模板原生 Arial 字体替换为黑体、中英文流水线标签样式不一致等）。这违背了“格式基于模板”的法定最高原则，导致 Word 与 PDF 输出在行高、字体反差、悬挂对齐等方面产生视觉与排版缺陷。

为了彻底消除此类随心所欲的样式篡改，必须在编辑器（Web/API）与 Skill 规范中建立全局强约束：所有写入单元格的行为除经过论证的特殊语义豁免外，必须首先进行语义二元归类（“标签 Label” 或 “值 Value”），并强制应用模板原生提取的标准格式。严禁任何模块随意篡改字体、字号、加粗、行间距与缩进。

## What

1. **模板格式客观事实锚定（Source of Truth）**：
   - 从母版文档（`正式模板_MSDS_CN_冠志(1).docx` 与 `正式模板_MSDS_EN_冠志(1).docx`）中提取并固化标签与值的精确排版事实（Section 9 标签：西文序号 10.5pt 加粗 + 标签 Arial 12pt 加粗，悬挂缩进 420 dxa，行距 300 dxa，零制表位；普通表格标签：10.5pt 加粗；普通值：10.5pt 常规）。
2. **统一语义分类格式引擎（Semantic Class Formatter）**：
   - 在 `web/src/docx-engine.js` 中构建受管函数 `applySemanticCellFormat(cell, type, options)`，收敛所有的标签与值写入逻辑。
   - 对 Section 9 及全局各 Section 的写入逻辑进行重构，强制走语义分类，彻底消除硬编码黑体与错误制表位。
3. **英文流水线保真度对齐**：
   - 确保英文覆写流水线（`pipeline-engine.js`）完全共享并强制执行相同的语义格式规则，杜绝英文版标签与值格式降级为单一纯文本的问题。
4. **Skill 规范法定化**：
   - 同步更新本地与全局 `msds-studio` Skill，将“仅允许标签与值归类，强制与模板对齐，严禁随意篡改”固化为最高不可动摇原则。
