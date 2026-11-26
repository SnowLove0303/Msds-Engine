# Design: 模板对齐策略识别、执行与机械审计架构

## 1. 因果链条
`inspectTemplateSchema`（识别模板对齐策略） → `formatSection3GridCenter` / `applyTopologyTypographyLock`（写入与排版锁定时清除居中单元格 `w:ind`、统一 `jc="center"` + `vAlign="center"`） → `staged-mechanical-audit.js`（机械审计强制校验 S3 与 S8 OEL 居中与零 `w:ind`）。

## 2. 精确修改点
1. `web/src/template-editor.js`:
   - 提取公共辅助函数 `clearParagraphIndent(pPr)`，统一清除 `w:ind` 节点或全部缩进属性；
   - 在 `inspectTemplateSchema` 中为每行/每格提取 `jc`、`vAlign` 与 `alignmentPolicy`（`MULTI_COL_CENTER` / `KV_TWO_COL` / `FULL_WIDTH_LEFT` / `SECTION_TITLE`）；
   - 在 `formatSection3GridCenter` 中除设置 `jc="center"` 外，调用 `clearParagraphIndent(pPr)` 并设置 `vAlign="center"`；
   - 在 `applyTopologyTypographyLock` 中：
     - 对 `isS8OelHeaderRow || isS8OelDataRow`（控制参数物质表）在设置 `jc="center"`、`vAlign="center"` 的同时调用 `clearParagraphIndent(pPr)`；
     - 通用兜底：对任意表格中最终 `jc === 'center'` 的段落（涵盖 S3 `cells.length >= 3` 与 S8 OEL），强制调用 `clearParagraphIndent(pPr)`，彻底根除母版遗留 `w:ind` 偏心问题。
2. `web/src/staged-mechanical-audit.js`:
   - 升级 `P5_S3_CENTER` 并新增 `P5_S3_ZERO_INDENT`（校验 S3 `r >= 3` 所有居中单元格无 `w:ind`）；
   - 新增 `P5_S8_OEL_ALIGNMENT`（当文档存在 S8 OEL 多列表时，校验表头与数据行均为 `jc="center"`、`vAlign="center"` 且无 `w:ind`）。
