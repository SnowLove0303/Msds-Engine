# Proposal: Section 2 智能匹配无值删行规约与表格三列形变/标签错位修复

## Why

用户在审阅 Web 工作台智能匹配模块中的 Section 2（危险性概述）时，明确指出两个严重缺陷：
1. **表格结构异常形变与列错位**：
   - 界面上呈现出一行三列的异常结构，第二列宽度过宽，第三列宽度过载；
   - 加粗标签如 `2.9 环境危害`、`2.10 其他危害` 明明是第一列的节级子标签，却被严重错位排到了第二列！
   - **根本原因诊断**：
     - 在标准模板中，`2.8 健康危害` 是由 1 个父级标题格（`rowspan=5`）与 5 个途径行（吸入、食入、皮肤、眼睛、症状和体征）组成的纵向合并结构。
     - 在执行模板值清空或匹配后，由于前端渲染层 `logicalTableRows` 简单通过 `isEmptyRow` 过滤掉了 4 个空白途径行，但并未联动缩减父级格的 `rowspan`；
     - 导致残留的 `rowspan=5` 向下强行穿透并霸占了后续 `2.9` 与 `2.10` 的第一列位置；浏览器被迫将 `2.9`、`2.10` 标签推至第二列，其值格推至第三列，凭空挤出一个 3 列异常超宽表格！
2. **未执行“无值删行”规则**：
   - 依据标准 MSDS 规范与用户明确指令，Section 2 必须遵从**“无值就隐藏/删行”**的核心规约；
   - 目前 `applyMatchResultToEditor` 仅对 Section 9 实现了剪枝删行，而在 Section 2 中，无值行（如 2.1 紧急情况概述、2.5 危险性说明、2.6 防范说明、2.7 物理和化学危险、2.8 健康危害子行、2.9 环境危害）仍保留在模板中，导致大面积空白行残留，违背了 MSDS 标准规约。

为了彻底消除 Section 2 的排版变形与残留空白行，必须从根本上实施“无值删行 + 序号重排 + 表格跨行几何一致性联动”。

---

## What Changes

1. **Section 2 智能匹配无值全量删行规约 (`applyMatchResultToEditor`)**：
   - 将 Section 2 纳入严格的“无值即删行”执行通道；
   - 遍历 Section 2 模板行，若对应插槽未匹配到有效值（或标记为无值/空白），通过 `deleteRow(editorEngine, tRecord, rIdx)` 进行自底向上的安全物理删行；
   - 针对 `2.8 健康危害` 多行合并块：
     - 若 5 个途径均无数据，整块（5 行）彻底删除；
     - 若部分途径有数据，仅保留有数据的途径行，并动态将首行父格的 `rowspan` 和 `w:vMerge` 调整为实际剩余行数；
   - 删行完成后，自动调用 `renumberRecord(tRecord)`，使 Section 2 剩余各行保持连续编号（如 `2.1 GHS危险性类别`、`2.2 GHS标签要素`、`2.3 其他危害`）。

2. **Web 渲染层表格跨行几何一致性保障 (`main.js` / `render-utils.js`)**：
   - 废除 `logicalTableRows` 中导致 `rowspan` 悬空错位的前端静默跳行逻辑；
   - 以引擎真实的 Table Record 几何结构作为单一事实来源（Single Source of Truth）；
   - 在计算 HTML 渲染时，严格校验每个单元格的有效 `rowspan`，杜绝跨行溢出覆盖后续行造成的虚假列偏移。

3. **回归验证与自动化测试套件扩充**：
   - 新增 `test_section2_pruning_and_layout.mjs` 测试用例，断言：
     - 在 `PU-2341E` 样本智能匹配后，Section 2 无值行均被彻底删除，仅保留有值的行；
     - Section 2 剩余行编号连续无断号；
     - 渲染出的 HTML 表格列数严格保持为 2 列（`gridCols: 2`），彻底消除 3 列形变；
     - `2.9`、`2.10` 等标签绝不偏移到第二列；
   - 确保全量烟测套件 (`npm run test:smoke` 和现有测试) 100% 通过。

---

## Capabilities

### Modified Capabilities
- `section2-smart-matching-pruning-and-layout`: 规范 Section 2 智能匹配结果的无值删行规约与连续编号，修复跨行合并单元格悬空导致的 3 列变形与标签错位。

---

## Impact

- `web/src/smart-matching.js`：在 `applyMatchResultToEditor` 中增加 Section 2 无值删行与合并块跨行联动处理；
- `web/src/main.js`：修正 `logicalTableRows` 与表格渲染，杜绝前端过滤导致的跨行错位；
- `web/tests/test_section2_pruning_and_layout.mjs`：新增专用自动化测试文件；
- 影响界面：Web 智能匹配“三屏同览”与“模板编辑器”中的 Section 2 表格。
