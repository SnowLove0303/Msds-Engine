# Design: 模板自适应排版规范与通用页尾时间中枢架构设计

## Context

MSDS Studio 在生产中文与英文 8 格式文档时，长期面临模板多样性挑战：
1. **英文模板的人为换行污染**：底模制作人员在英文标签（如 Section 5、6、9、11、12）中为了视觉断行，硬敲回车插入了多个 `<w:p>`。这破坏了 Word 的流式排版模型，导致第二行段落丢失悬挂缩进（`w:ind`）并顶格，造成单词割裂（如 `Persistence and` 与 `degradability` 割裂断行）；
2. **页脚时间硬编码耦合**：底模更新逻辑 `updateHeaderFooterData` 强行假设页脚存在且格式为 `table[0].rows[0].cells[1]`，且在流水线中硬编码了 `2026/10/10`，导致对未来不同版式的新模板缺乏兼容性，且无法从源文件提取真实日期。

## Architecture Decisions

### 1. 模板无关的标签平整化引擎 (Label Flattening & De-wrapping Engine)

在 `docx-engine.js` 中新增核心标准化方法 `harmonizeTableLabels(engine)`：
- **目标范围**：所有 16 章节表格中符合标签模式的单元格（第 0 列，或纯文本以 `^\d+(\.\d+)*` 起头）；
- **平整化步骤**：
  1. 识别单元格内的所有 `<w:p>` 段落；
  2. 若段落数 > 1 或包含 `<w:br>`，提取各段文本，在段间边界处根据前后字符智能补充半角空格（避免英文字词粘连，如 `and` 与 `degradability` 粘连为 `anddegradability`）；
  3. 清除所有 `<w:br>` 软回车与除第 1 段外的所有多余段落；
  4. 将合并后的规范流式文本写入首段；
  5. 统一为该单元格的首段注入标准的悬挂缩进 `<w:ind w:left="457" w:hanging="457"/>` 与左对齐制表位 `<w:tabs><w:tab w:val="left" w:pos="459"/></w:tabs>`；
  6. 清除限制流式折行的非标属性（如 `w:noWrap`），交由 Word/PDF 依据单元格宽度自然、智能地按词边界流式折行。

### 2. 通用自适应页脚时间中枢 (Universal Adaptive Footer Engine)

彻底重构 `updateHeaderFooterData` 为自适应多模态更新：
- **日期智能抽取 (Adaptive Extraction)**：
  - 新增 `extractAdaptiveDate(sourceEngine)`：依次扫描源文档 `word/footer*.xml` -> 正文 Section 1/16 表格 -> 正文段落，提取真实的修订/生效日期；
  - 若源文档未声明日期，则回退至用户显式传入参数或当天系统日期。废除任何固定写死的 `2026/10/10` 默认参数。
- **多模态页脚自适应注入 (Multi-Modal Injection)**：
  - 扫描所有 `word/footer*.xml`；
  - **表格分支**：遍历每个单元格，使用正则 `/修订日期|Revision Date|Date|\d{4}[\/年\.-]\d{1,2}[\/月\.-]\d{1,2}/i` 动态探测日期格并更新；若未探测到显式日期格但单元格数 >= 2，则在最右侧单元格中安全追加；
  - **段落分支**：遍历每个 `<w:p>`，查找包含日期模式的 `<w:r>` 并平滑替换文字，保持原有的段落对齐与字体属性；
  - **空白/缺失分支**：若模板无有效页脚内容，自动构建标准包含公司、型号代码与修订日期的页脚骨架。

### 3. 流水线阶段解耦与标准化装配

在 `pipeline-engine.js` 中：
- `buildBaseChineseEngine` 启动时首先调用 `extractAdaptiveDate(srcEngine)`，将提取出的真实日期贯穿整个生产周期；
- 在 Base-CN 和 Base-EN 生成完成后、导出交付物前，统一调用 `harmonizeTableLabels(engine)`，使所有标签无论来自何种底模均达到统一的排版几何不变量标准。

## Verification Plan

1. **底层单测验证**：
   - 验证英文底模经平整化后，`12.2`、`5.2`、`5.3`、`6.2`、`9.16` 等标签单元格的段落数严格降为 1，且单词间有且仅有 1 个空格；
   - 验证表格型和段落型 Footer 更新函数，在各种未知结构下均能成功注入日期；
2. **端到端流水线交付物验证**：
   - 运行 `node web/rebuild_ep1702.mjs`；
   - 验证生成的 4 DOCX + 4 PDF 中，英文标签无断词无生硬换行，页尾时间准确呈现在 Footer 中；
3. **OpenSpec 严格校验与归档**。
