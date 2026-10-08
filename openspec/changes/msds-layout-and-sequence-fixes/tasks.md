# Tasks

## 1. 表头 Section 标题行（Row 0）绝对硬锁定与原始透传（严禁篡改表头格式）

- [x] 1.1 在 `web/src/main.js` 的 `renderParagraph` 与 `classifyLabelTier` 中建立第一道强拦截门禁：当 `row.index === 0` 或 `cell.row === 0` 时，绝对禁止执行 `normalizedSequence`，绝对禁止剥离序号，绝对禁止注入宽空格；直接以原始 runs 100% 透传输出。
- [x] 1.2 彻底删除 `normalizedSectionTitle` 函数，严禁擅自改写 `v1.` 或修改源文档标题格式。
- [x] 1.3 验证所有 16 节的表头（如 `1.物料及供应商标识`、`v1.物料及供应商标识`、`3. 成分/组成资料`、`9. 物理和化学特性` 等）文本与格式 100% 保持原始原样。

## 2. 数据行标签序号全量提取与零丢失修复（针对 1.1, 1.2, 3.1, 7.1, 9.1...）

- [x] 2.1 在 `web/src/docx-engine.js` 的 `cellRole` 中，全量兼容 Word `w:numPr` 自动编号机制：无论文字 run 是否加粗，凡段落携带 `numberingText`，均将编号完整注入 `labelText`（`${num}  ${text}`），彻底解决非加粗标签或特殊格式标签丢失序号的问题。
- [x] 2.2 优化 `normalizedSequence`：匹配单级与多级序号（1.1, 1.2, 3.1, 7.1, 9.1...），统一采用自然间距（`${seq}  `），杜绝 4-5 个空格导致的视觉断层。
- [x] 2.3 在 `web/src/main.js` 的 `splitMultiLabelRow` 中，确保分行后生成的独立单元格能继承段落的原生 `numberingText` 与完整标签属性，杜绝拆行过程丢失编号。

## 3. Section 14 多标签分行与“一行一标签”拆分

- [x] 3.1 在 `web/src/main.js` 的 `logicalTableRows(record)` 中，当数据行（row.index > 0）首列包含多个独立标签段落（如 Section 14 Row 2 的 14.2、14.3、14.4）时，自动拆分为对应独立的逻辑行。
- [x] 3.2 验证 Section 14 第 2 行被拆分为 14.2、14.3、14.4 三行，且每行序号与标签完整展现。

## 4. 冗余空行自动检测与静默剔除

- [x] 4.1 在 `logicalTableRows(record)` 中自动检测所有单元格皆为空白文本且不含图片的物理行（如 Section 14 第 3 行）并自动滤除。

## 5. Section 15 说明性标签顶格左对齐规范

- [x] 5.1 在 `classifyLabelTier` 中将 Section 15 所有加粗项（“其它的规定：”、“符合下列法规要求：”等）判定为 `parent`（顶格左对齐，padding-left: 0），严禁分配序号，严禁作为 `child` 产生内缩垂直对齐。

## 6. 页眉页脚最初格式恢复与严禁加粗

- [x] 6.1 对页眉页脚记录（`word/header*.xml`、`word/footer*.xml`）彻底禁用正文表格的 `roleStyles`，应用 `font-weight: normal !important`，绝对禁止加粗。

## 7. 自动化测试与全量文档回归验证

- [x] 7.1 更新 `web/tests/smoke.mjs`，增加针对 Row 0 表头未被修改、Section 1/3/7/9 序号完整性、Section 14 拆行、空行剔除、Sec 15 顶格及页眉页脚禁止加粗的回归断言；执行 `npm run test:smoke` 保持全绿。
- [x] 7.2 运行 `npm run build` 确保生产构建干净通过。
