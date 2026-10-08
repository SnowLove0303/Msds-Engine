# Change Proposal: MSDS Layout & Sequence Refinements (msds-layout-and-sequence-fixes)

## Background & Problem Statement

在对真实 MSDS 样例文档（如 PU-1107、PU-2341E 等）及模板进行深度解析与排版展示时，发现存在以下五个关键问题：

1. **Section 1、3、7、9 序号丢失**：
   - 许多源文档和模板使用 Word 自动编号（`w:numPr`），编号存储在段落元数据而非 `<w:r><w:t>` 文本节点中。在构建单元格角色 `cellRole` 时，`labelText` 仅提取加粗运行区文本而忽略了 `numberingText`，导致模板编辑器与部分视图中 Section 1、3、7、9 的序号完全丢失。
   - 此外，单单元格多段落时，后续段落的序号在渲染时被错误丢弃。
2. **Section 14 多标签同行未正确分行**：
   - 部分源文档（如 PU-2341E Section 14 第 2 行）将 `14.2海上运输：`、`14.3空运`、`14.4用户特殊注意事项：` 塞在同一行的单个单元格内的多个段落中，导致整行挤占，违背“一般一行只有一个标签”的排版规范。
3. **存在冗余空行未被剔除**：
   - 表格中存在所有单元格均为空白文本的无效空行（如 PU-2341E Section 14 第 3 行），影响页面美观和信息密度。
4. **Section 15 加粗说明性标签误归类与排版错误**：
   - Section 15 中的加粗项（如“其它的规定：”、“符合下列法规要求：”）为法规说明性标签，此前被误识别为子级标签（`child`）并强制进行了内缩缩进。用户明确要求：说明性标签绝不能分配序号，严禁使用子级垂直对齐，必须顶格左对齐。
5. **页眉页尾文本字体格式失真与误加粗**：
   - 页眉与页尾被赋予了正文标签的角色样式，导致页眉页尾文本被错误加粗。必须恢复到最初原始版式，并严格禁止加粗。

## Goals

1. **全量恢复 Section 1、3、7、9 序号**：
   - 在 `docx-engine.js` 的 `cellRole` 中，若段落具备 `numberingText` 或首行包含有效序号，`labelText` 与 `cellRole.sequence` 必须完整保留该序号前缀。
   - 支持多段落序号提取，确保编辑器与识别视图中序号 100% 完整展现。
2. **Section 14 自动多行拆分**：
   - 在 `logicalTableRows` 中，若同一物理行的标签单元格中包含多个独立标签段落（如 14.2、14.3、14.4），且数值单元格有对应段落，则自动拆分为多个独立的逻辑行，实现“一行一个标签”。
3. **空行自动检测与静默剔除**：
   - 在构建逻辑表格行时，自动检测所有单元格皆为空白字符的物理空行，并在结构化视图与导出逻辑行中自动滤除。
4. **Section 15 说明性标签左对齐规范**：
   - `classifyLabelTier` 显式判定 Section 15 的加粗行：严禁生成序号，不作为 `child` 缩进对齐，强制作为 `note` / `parent` 顶格左对齐（`padding-left: 0`）。
5. **页眉页尾格式还原与严禁加粗**：
   - 页眉与页脚记录（`word/header*.xml`、`word/footer*.xml`）彻底脱钩正文 `roleStyles`，严格保留其原始 OOXML 字体字号，并强制 `font-weight: normal`（禁止加粗）。

## Impact Analysis

- **受影响范围**：
  - `web/src/docx-engine.js`：`cellRole` 补齐编号、`classifyLabelTier` 增强 Section 15 过滤、`normalizedSequence` 序号提取健壮性。
  - `web/src/main.js`：`logicalTableRows` 增加多标签拆行与空行过滤；`renderParagraph` / `sourceRunStyle` 对页眉页脚禁止加粗并恢复原始属性。
  - `web/src/styles.css`：优化 Section 15 说明性标签及页眉页脚显示样式。
  - `web/tests/smoke.mjs`：新增对拆行、空行剔除、Sec 15 顶格、页眉页脚无粗体、Sec 1/3/7/9 序号完整性的自动化断言。
- **保护性约定**：
  - 严禁修改只读原版源模板（`内嵌模板/`）。
  - 纯客户端解析与运行，无需额外依赖。
