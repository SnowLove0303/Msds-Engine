# 技术设计：全 16 Section 标签序号双槽对齐与表头格式统一方案 (Design)

## 1. 架构与模型总览

本设计旨在彻底打通底层 OOXML 拓扑模型（`docx-engine.js`）与前端渲染引擎（`render-utils.js`、`styles.css`），将渲染决策从粗糙的“几何列索引（`isFirstColumn`）”升级为基于“结构化角色元数据（`cell.role` / `cell.fontRole`）”的高精度渲染流水线：

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        底层拓扑与母版模型 (docx-engine.js)                │
│   • 表头三列锁定: role = 'table-header', fontRole = 'label-header', bold=true │
│   • 单列说明行识别: role = 'value-only' / 'source-note', fontRole = 'value'   │
│   • 导出时母版 XML run 同步补齐 <w:b/> 加粗标记                            │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ 传递结构化单元格元数据
┌────────────────────────────────────▼───────────────────────────────────┐
│                        前端渲染引擎 (render-utils.js)                   │
│   • 表头统一处理器: 强制加粗、统一下划线、消除 label-child-row 偏位缩进      │
│   • 标签双槽位 Grid: .sequence-slot (固定宽) + .label-text-slot (正文槽)    │
│   • 悬挂缩进保障: 多行长标签续行严格在 .label-text-slot 内折行，首字对齐     │
│   • 窄列防折断: min-width 保护与语义词边界断行 (取消无脑 anywhere 逐字折行) │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ 应用高精 CSS 样式
┌────────────────────────────────────▼───────────────────────────────────┐
│                        全局视觉表现层 (styles.css)                     │
│   • 移除第一列 !important 置顶覆盖，恢复垂直居中 (vertical-align: middle) │
│   • 声明 --sequence-width 与统一的网格基准对齐线                          │
│   • 建立统一的 .table-header-cell 与 .value-only-cell 样式类            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心模块与实现细节

### 2.1 Section 3 表头三列（化学品名称 / CAS编号 / 含量%）统一加粗与版式治理
- **根因消除**：在 `正式模板_MSDS_CN_冠志(1).docx` 中，`CAS编号` 与 `含量` 缺少 `<w:b/>` 节点，且 `renderParagraph` 依赖 `isFirstColumn` 导致第 1、2 列被降级为非加粗值。
- **治理方案**：
  1. **渲染器特权识别**：
     当 `cell.role === 'table-header'` 或 `cell.fontRole === 'label-header'` 或 `row.cells.some(c => /CAS编号|化学品名称/i.test(c.text))` 时：
     - 强制赋予 `forceBold = true`，使 `sourceRunStyle` 输出 `font-weight: 700`；
     - 强制保留 `text-decoration: underline`；
     - 移除第 0 列由 `label-child-row` 带来的 `padding-left: 2.2rem` 畸形缩进，三个单元格统一赋予 `table-header-row` 容器类，拥有完全一致的 `padding` 和行高；
  2. **DOCX 导出同步固化**：
     在 `writeCellValue` 或引擎导出前，扫描 Section 3 表头行，确保导出的 OpenXML 中三列表头的 `<w:rPr>` 均含有 `<w:b/>`，实现“所见即所得”的 Word 文档一致性。

### 2.2 序号与标签首字固定双槽位（Double-Slot Grid）与多行悬挂缩进
- **根因消除**：原 inline-block 序号流导致 `1.1` 与 `10.1` 占用不同宽度，推动后续标签首字 X 坐标抖动；长标签折行时跌回单元格最左侧。
- **治理方案**：
  1. **双槽位 Grid 容器**：
     重构 `renderParagraph`，当存在前缀序号时，输出以下结构：
     ```html
     <div class="label-line-grid ${tierClass}" style="${sourceParagraphStyle(paragraph, isFirstColumn)}">
       <span class="sequence-slot" style="${sequenceStyle}">${escapeHtml(sequence.text)}</span>
       <span class="label-text-slot">${runMarkup}</span>
     </div>
     ```
  2. **CSS 网格声明**：
     ```css
     .label-line-grid {
       display: grid !important;
       grid-template-columns: var(--sequence-width, 2.8rem) minmax(0, 1fr) !important;
       column-gap: 0.35rem !important;
       align-items: baseline !important;
       width: 100% !important;
     }
     .sequence-slot {
       white-space: pre !important;
       font-weight: 700 !important;
       user-select: none;
       flex-shrink: 0;
     }
     .label-text-slot {
       min-width: 0 !important;
       overflow-wrap: break-word !important;
       word-break: normal !important;
     }
     ```
  3. **效果保证**：
     - 所有 Section 标签首字均以 `--sequence-width`（2.8rem）为统一起始基准线，彻底消除位数抖动；
     - 当标签文本（如 Section 11.8 特异性靶器官毒性）在 `.label-text-slot` 内部换行时，第二行自然在该槽内继续折行，天然实现完美的**悬挂缩进（Hanging Indent）**，绝不回弹到序号下方或单元格左边缘！

### 2.3 垂直居中治理与防伪竖排宽度锁定
- **垂直居中**：
  - 从 `styles.css` 中删除 `.structured-table td:first-child { vertical-align: top !important; }`；
  - 在 `sourceCellStyle` 中，将标签单元格的垂直对齐默认设为 `middle`（除 Row 0 章节大标题为 `top` 以外）；
- **窄列防伪竖排**：
  - 针对 Section 8、Section 11 等窄标签列，设置 `min-width: 110px`；
  - 样式从 `overflow-wrap: anywhere; word-break: break-word;` 调整为 `overflow-wrap: break-word; word-break: normal;`，禁止汉字逐字垂直断行，英文单词及括号（如 `（w/w）`）禁止被暴力横向截断。

### 2.4 单列说明行语义解耦 (`value-only` / `source-note`)
- 扫描 Section 13、15、16 中的单列大文本行（如法规说明、EWC条目、免责声明）：
  - 赋予 `role = 'value-only'` 与 `fontRole = 'value'`；
  - 渲染为 `.value-only-row`，采用普通正文字体与紧凑段距，不带序号槽，不注入加粗样式。
