# Tasks: Section 2 智能匹配无值删行规约与表格三列形变/标签错位修复

## 1. 规则契约与自动化测试先行
- [x] 1.1 编写 `web/tests/test_section2_pruning_and_layout.mjs` 测试桩，覆盖：
  - Section 2 在匹配无值时的物理删行（`deleteRow`）断言；
  - Section 2 删行后的序号连续性断言（`2.1`, `2.2`, `2.3` 等无断号）；
  - Section 2 渲染 HTML 表格列数与单元格列索引（无 3 列溢出，标签 100% 居于第一列，`2.9`/`2.10` 无错位）。

## 2. Section 2 智能匹配无值删行核心逻辑实现
- [x] 2.1 在 `web/src/smart-matching.js` 的 `applyMatchResultToEditor` 中实现 Section 2 专属审阅与删行处理：
  - 精确识别 Section 2 中未获得有效值的单行插槽并加入待删队列；
  - 精确处理 `2.8 健康危害` 合并块（全部途径无值时整块删除；部分有值时删除空途径行并联动调整父单元格 `rowspan` 与 `<w:vMerge>`）；
  - 执行自底向上安全物理删行；
  - 触发 `renumberRecord` 重新连贯排号。

## 3. Web 渲染层跨行几何一致性与列对齐修复
- [x] 3.1 改造 `web/src/main.js` 中的 `logicalTableRows` 逻辑，消除前端假删行脱节问题，确保渲染几何与数据模型 100% 同步；
- [x] 3.2 改造 `web/src/render-utils.js`，增加单元格 `rowspan` 边界防御截断，防止任何历史残余或异常跨行溢出覆盖后续行造成第 3 列列挤出；
- [x] 3.3 确保第一列标签与第二列值格样式与宽度严格对齐（`3519` : `6276`），消除宽度过宽与过载现象。

## 4. 全量测试与真实验收
- [x] 4.1 运行 `node web/tests/test_section2_pruning_and_layout.mjs`，确保 Section 2 删行与几何布局验证全部通过；
- [x] 4.2 运行 `node web/tests/test_template_residual_clearing.mjs`，确保全量多样本反向残留排查与注入通过率保持 100%；
- [x] 4.3 运行 `npm run test:smoke` 确保全量烟测套件无回归。
