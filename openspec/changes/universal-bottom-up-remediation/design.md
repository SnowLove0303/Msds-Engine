# Design: 底层通用性修复与防复发架构

## 1. 模块修改拓扑
1. `web/src/recognition-engine.js`:
   - 扩展 `isNegationCategory` 正则，覆盖 `不属于(?:危害化学品|危险物)`、`Not a hazardous` 等否定句；
   - 修复 `serializeFactsToMarkdown` 在英文文档时对 `Trade secret` 与英文标签的元数据输出，避免误显 `商业机密` 或中文全角冒号 `：`。
2. `web/src/context-governor.js`:
   - **Section 1**：用 `@ANTIGRAVITY_INVARIANT_LOCK` 锁定 CN（`中文名称` 不拼接型号）与 EN（`1.1 Product name` 合并品名+型号）局部差异规范；
   - **Section 2**：移除 lines 1031–1038 对 `2.2 标签要素` 的误删逻辑，保留源文 `2.2 标签要素`（EN：`2.2 Label elements`），同时仍不虚增 `象形图：无` / `信号词：无`；
   - **Section 8**：用 `@ANTIGRAVITY_INVARIANT_LOCK` 锁定 `8.1 暴露控制 -> 8.2 控制参数` 唯一规范顺序；
   - **Section 9**：规范化英文版 `9.3 pH` 等括号末尾多余句号；
   - **Section 11**：新增通用语义解析器 `parseSection11ByConditionAndSubstance(rows)`——先按标准毒理终点/测试条件切分条目，统计每条下涉及的物质数：全部为单物质（≤1 种）时生成标准 2 列 KV 项（`2_COL_KV`），仅当同条件下出现 ≥2 种物质时生成通栏（`FULL_WIDTH_STRUCTURED`）。
3. `web/src/topology-matcher.js` & `web/src/template-editor.js`:
   - `topology-matcher.js`：支持 Section 11 的 2 列 KV 项动态克隆/写入（当模板 S11 行数不足时自动 `insertRow` 克隆 2 列行）；
   - `template-editor.js`：在 `applyTopologyTypographyLock` 中加入通用化学式下标/上标富文本自动渲染（`CO2`、`H2O`、`NO2`、`SO2`、`cm3` 等），确保中英文双语一致；清除居中格 `w:ind`。
4. `web/src/staged-mechanical-audit.js`:
   - 新增 `P6_PDF_NO_LIBREOFFICE`、`P5_S11_DUAL_PARADIGM`、`P5_EN_CHEMICAL_SUBSCRIPT`、`P5_S2_PRESERVE_LABEL_ELEMENTS` 四道防复发硬门禁。
