# MSDS Studio 匹配结果逐标签、逐值、逐位置批注与 Agent 友好导出开发方案

报告日期：2026-10-07

适用范围：智能匹配页面、模板编辑器、匹配结果导出、Agent 审阅和问题回溯

本方案是开发设计和实施方案，不直接修改代码。

---

## 1. 建设目标

需要新增一套可审计的匹配结果批注能力，满足以下要求：

1. 匹配结果中的每一个标签都可以批注；
2. 匹配结果中的每一个值都可以批注；
3. 匹配结果中的每一行、每一个单元格、每一个 Section 和每一个可定位位置都可以批注；
4. 批注必须能够区分源文件、匹配结果、模板和导出后的编辑结果；
5. 批注不能只是一段无法定位的自由文本；
6. 批注必须能导出，并且导出后 Agent 可以直接判断问题位置、实际内容、期望内容和来源证据；
7. 批注完成后，可以继续调用模板编辑模块导出正式匹配结果 MSDS；
8. 正式 MSDS 文档应保持干净，批注作为独立审阅证据导出，不能把内部批注文字写进正式产品值中；
9. 导出后重新加载 DOCX，批注锚点仍然可以定位到同一个 Section、行、单元格和值；
10. 标签、值、位置和批注之间必须共享同一个稳定锚点体系。

最终输出不应只是一份带颜色或带标记的 Word 文件，而应是：

    一份正式 MSDS DOCX
    一份 Agent 可直接读取的结构化批注文件
    一份可选的人类审阅表
    一份包含源文件、模板、匹配结果和批注关系的审阅包清单

---

## 2. 当前代码调查结论

### 2.1 当前已有能力

当前代码已经具备以下基础：

- web/src/docx-engine.js
  - 读取 DOCX；
  - 抽取 Section、行、单元格、标签和值；
  - 保存 cell.row、cell.col、rowspan、colspan；
  - 保存 labelText、valueText、role、fontRole、editable；
  - 支持 writeCellValue、writeCellLabel；
  - 支持 exportArrayBuffer；
  - 支持 portableModel；
  - 支持模板审计和结构审计。

- web/src/smart-matching.js
  - runSmartMatching；
  - matchedSections；
  - matchedRows；
  - sourceRecord；
  - slotId；
  - key；
  - standardLabel；
  - rawSnippet；
  - status；
  - reason；
  - stats；
  - applyMatchResultToEditor；
  - 模板写入、剪枝和重编号。

- web/src/msds-handoff.js
  - extractSourceFacts；
  - sourceLocator；
  - factId；
  - semantic slot；
  - sourceMapping；
  - collectTemplateSlots；
  - buildMappingPlan；
  - reviewMappingPlan；
  - mappingIssues；
  - source coverage；
  - needs-review / unresolved / ambiguous / conflict 状态。

- web/src/main.js
  - 智能匹配页面；
  - 原始识别表；
  - 标准匹配表；
  - 模板编辑器；
  - commit-to-editor；
  - exportJson；
  - exportDocx；
  - Section 导航；
  - 编辑器值修改；
  - 行追加和删除。

### 2.2 当前缺失能力

当前没有：

- annotation 或 comment 数据模型；
- 批注的持久化存储；
- 批注与标签、值、行、单元格、位置的统一锚点；
- 匹配页面的批注入口；
- 模板编辑器中的批注入口；
- 批注状态、严重程度和处理状态；
- 批注和 source fact 的稳定关联；
- 批注和 match key / slotId 的稳定关联；
- 批注导出；
- 批注随编辑结果进入导出的 review bundle；
- Agent 专用的可追溯 JSON/NDJSON 结果格式；
- 人类可读的批注表格或摘要。

当前 exportJson() 只导出识别模型，不导出匹配结果和批注。

当前 exportDocx() 只导出编辑器的 DOCX，不导出批注信息。

当前 renderStructuredTable() 和 renderEditorCell() 主要负责展示和编辑，没有输出稳定的 annotation anchor 属性。

### 2.3 当前最适合复用的基础

msds-handoff.js 已经具备 source fact 和 mapping plan 概念，可以直接作为批注锚点的事实定位基础，但不能直接把 rowIndex 当作唯一定位。

原因是：

- Section 2、9、10、11、12、15 可能发生整行剪枝；
- Section 3 和 Section 8 可能插入完整样式行；
- Section 15 可能有法规行容量变化；
- Section 11 有多列、合并单元格和子标签；
- renumberRecord 会改变可见序号；
- 编辑器追加行和删除行会改变物理 rowIndex。

因此必须同时保存：

- 语义锚点；
- 模板结构锚点；
- 当前物理定位；
- 内容快照；
- 源文件定位；
- 导出版本信息。

---

## 3. 批注系统的核心设计原则

### 3.1 批注不是普通备注，而是可回放的审阅事实

一条批注必须能回答：

1. 批注针对哪个产品；
2. 针对哪个源文件；
3. 针对哪个模板；
4. 针对哪个匹配运行；
5. 针对哪个 Section；
6. 针对哪一行；
7. 针对哪一个标签、值或位置；
8. 批注当时看到的实际文本是什么；
9. Agent 或用户认为正确文本是什么；
10. 证据来自源文件哪个位置；
11. 当前状态是待处理、已接受、已修改、已关闭还是锚点失效；
12. 修改后是否需要重新匹配或重新导出。

### 3.2 稳定锚点优先，像素坐标辅助

批注不能只依赖 x、y 坐标。窗口大小、浏览器缩放、标签列宽和 DOCX 页面缩放都会改变像素坐标。

定位优先级必须是：

1. semantic slot；
2. recordId；
3. row fingerprint；
4. cell role 和 cell index；
5. paragraph/run/range；
6. visual geometry。

像素位置只用于辅助回到页面，不作为唯一身份。

### 3.3 官方 MSDS 与批注文件分离

正式 MSDS DOCX 必须保持：

- 原模板标签；
- 产品值；
- 结构、字体和格式；
- 不插入批注文字；
- 不出现审阅人、问题描述、Agent 指令或调试信息。

批注应写入单独审阅包。这样既能导出正式产品文档，也能完整保留问题证据。

---

## 4. 批注对象模型

建议版本化为 msds-review-bundle/v1。

### 4.1 审阅会话

一个导入文件到匹配、批注、编辑、导出的完整过程对应一个 reviewSession：

    reviewSessionId
    productModel
    sourceFileName
    sourceHash
    templateName
    templateHash
    matchingRunId
    editorRevision
    createdAt
    updatedAt
    language
    companyVariant

reviewSessionId 不得依赖文件名。建议使用 sourceHash、templateHash、matchingRunId 和 createdAt 的组合哈希。

### 4.2 批注主记录

每条批注至少包含：

    annotationId
    reviewSessionId
    status
    severity
    category
    title
    comment
    expected
    actual
    suggestedAction
    author
    createdAt
    updatedAt
    resolvedAt
    anchor
    sourceEvidence
    matchEvidence
    templateEvidence
    snapshot

### 4.3 批注状态

| 状态 | 含义 |
|---|---|
| open | 新建、尚未处理 |
| acknowledged | 已确认，等待修改 |
| in_progress | 正在修复 |
| resolved | 已修复并重新验证 |
| accepted | 用户确认可接受 |
| rejected | 批注结论不成立 |
| stale | 原文、模板或结果已变化，原锚点需要重新确认 |
| orphaned | 原目标行被剪枝或结构变化，无法自动定位 |

### 4.4 批注严重程度

| 等级 | 用途 |
|---|---|
| blocker | 阻止导出正式 MSDS，例如标签/值错位、源值丢失、模板结构污染 |
| error | 必须修复，例如值写入错误行、换行语义错误、法规缺失 |
| warning | 需要人工确认，例如源文案与标准化文案存在差异 |
| info | 记录性说明，不阻止导出 |

### 4.5 批注类别

建议固定枚举：

    wrong_label
    wrong_value
    missing_value
    extra_value
    template_residual
    wrong_slot
    wrong_row
    wrong_cell
    wrong_section
    wrong_line_break
    missing_line_break
    extra_line_break
    wrong_sequence
    wrong_font
    wrong_bold
    wrong_alignment
    wrong_merge
    wrong_column
    source_conflict
    source_unreadable
    unmatched_fact
    ambiguous_mapping
    export_mismatch
    needs_manual_review

---

## 5. 统一锚点设计

### 5.1 Section 锚点

用于批注整个章节：

    anchor.kind = section
    anchor.sectionNumber
    anchor.sectionTitle
    anchor.recordId
    anchor.recordFingerprint

### 5.2 行锚点

行锚点不能只保存 rowIndex，必须保存 rowFingerprint：

    anchor.kind = row
    anchor.sectionNumber
    anchor.recordId
    anchor.rowIndex
    anchor.rowFingerprint
    anchor.sequence
    anchor.labelText
    anchor.labelKey
    anchor.slotId
    anchor.rowRole
    anchor.cellCount
    anchor.mergeSignature

rowFingerprint 建议由以下内容生成：

    sectionNumber
    template record id
    sequence text
    normalized label text
    cell roles
    colspan / rowspan
    ordered cell semantic keys

即使行号因剪枝或重编号变化，也可以用 fingerprint 重新定位。

### 5.3 单元格锚点

用于批注某个标签格、值格或结构格：

    anchor.kind = cell
    anchor.sectionNumber
    anchor.recordId
    anchor.rowIndex
    anchor.cellIndex
    anchor.cellRole
    anchor.labelText
    anchor.valueText
    anchor.slotId
    anchor.cellFingerprint
    anchor.colspan
    anchor.rowspan

cellRole 至少包括：

    label
    value
    table_header
    sublabel
    note
    structure
    source_note
    component_name
    component_cas
    component_concentration

### 5.4 标签锚点

标签批注必须指向标签对象，而不是只指向整行：

    anchor.kind = label
    anchor.sectionNumber
    anchor.recordId
    anchor.rowIndex
    anchor.cellIndex
    anchor.labelText
    anchor.labelKey
    anchor.sequence
    anchor.slotId
    anchor.paragraphIndex
    anchor.runIndex
    anchor.charStart
    anchor.charEnd
    anchor.labelFormatSnapshot

标签格式快照至少包含：

    bold
    font
    sizeHalfPoints
    underline
    alignment
    paragraphIndent
    lineSpacing

### 5.5 值锚点

值批注必须指向实际可写值格或值尾：

    anchor.kind = value
    anchor.sectionNumber
    anchor.recordId
    anchor.rowIndex
    anchor.cellIndex
    anchor.valueCellIndex
    anchor.slotId
    anchor.labelText
    anchor.valueText
    anchor.valueHash
    anchor.paragraphIndex
    anchor.runIndex
    anchor.charStart
    anchor.charEnd
    anchor.lineCount
    anchor.valueFormatSnapshot

值格式快照至少包含：

    font
    sizeHalfPoints
    bold
    alignment
    verticalAlignment
    lineSpacing
    cellWidth

### 5.6 位置锚点

位置批注支持两层：

第一层是逻辑位置：

    anchor.kind = position
    anchor.sectionNumber
    anchor.recordId
    anchor.rowIndex
    anchor.cellIndex
    anchor.paragraphIndex
    anchor.runIndex
    anchor.charStart
    anchor.charEnd

第二层是视觉位置：

    visual.pageIndex
    visual.x
    visual.y
    visual.width
    visual.height
    visual.coordinateSpace
    visual.viewportWidth
    visual.viewportHeight
    visual.zoom

逻辑位置是主锚点，视觉坐标是辅助定位。页面缩放变化时，Agent 仍能通过逻辑路径定位。

---

## 6. 批注内容结构

一条批注必须同时保存机器字段和人类文字：

    annotationId: ANN-000001
    status: open
    severity: error
    category: wrong_value
    title: Section 5.1 值与源文件不一致
    comment: 当前结果仍保留模板示例灭火剂文本
    expected: 源文件中的完整灭火剂表达
    actual: 当前匹配结果中的实际值
    suggestedAction: 重新路由到 s5:extinguishing_media 并按源文案写入

机器字段解决 Agent 判断问题，人类 comment 用于解释上下文。不能只保存 comment。

### 6.1 Source evidence

    sourceEvidence.factIds
    sourceEvidence.sourceFile
    sourceEvidence.sourceHash
    sourceEvidence.sourceLocator
    sourceEvidence.sourceText
    sourceEvidence.sourceSection
    sourceEvidence.sourceRow
    sourceEvidence.sourceCell
    sourceEvidence.evidenceType

### 6.2 Match evidence

    matchEvidence.matchingRunId
    matchEvidence.matchKey
    matchEvidence.slotId
    matchEvidence.standardLabel
    matchEvidence.status
    matchEvidence.reason
    matchEvidence.rawSnippet
    matchEvidence.confidence

### 6.3 Template evidence

    templateEvidence.templateName
    templateEvidence.templateHash
    templateEvidence.recordId
    templateEvidence.rowIndex
    templateEvidence.cellIndex
    templateEvidence.templateLabel
    templateEvidence.templateValueBefore
    templateEvidence.templateRole
    templateEvidence.editable
    templateEvidence.mergeSignature

### 6.4 Snapshot

    snapshot.sourceHash
    snapshot.templateHash
    snapshot.matchingResultHash
    snapshot.editorRevision
    snapshot.labelHash
    snapshot.valueHash
    snapshot.rowFingerprint
    snapshot.createdAt

如果值被编辑，系统比较新的 valueHash：

- 相同：批注仍然有效；
- 不同：批注变为 stale，要求用户重新确认；
- 行被删除：批注变为 orphaned；
- 标签或槽位变化：批注标记 anchor_mismatch。

---

## 7. UI 设计方案

### 7.1 匹配页

原始识别表和标准匹配表的每个标签、值、行、单元格都显示批注入口。

建议交互：

1. 点击标签或值；
2. 出现“添加批注”按钮；
3. 选择目标类型：标签、值、整行、单元格、位置或 Section；
4. 选择类别和严重程度；
5. 填写 comment；
6. 系统自动填充 source、match、template 快照；
7. 保存后在目标旁显示批注徽标；
8. 右侧显示当前 Section 的批注列表；
9. 点击批注列表可跳回目标；
10. 支持 open、resolved、stale 过滤。

### 7.2 原始表与标准表的对照批注

匹配页面存在三类对象：

- 原始识别表；
- 标准匹配表；
- 源文件原版式预览。

批注必须区分 panel：

    source_table
    matched_table
    source_preview

例如：

- 原始识别本身已把标签和值读错，批注指向 source_table；
- 原始识别正确但标准表错误，批注指向 matched_table；
- DOCX 原版式的位置或换行有问题，批注指向 source_preview。

不能只保存一个 rowIndex，否则 Agent 无法知道问题发生在源结果还是匹配结果。

### 7.3 编辑模块

批注导入编辑器后必须继续存在：

- 编辑器标签批注；
- 编辑器值批注；
- 模板结构批注；
- 导出前待处理批注；
- 已编辑后 stale 批注。

编辑器修改值时：

1. 更新 editorRevision；
2. 更新 valueHash；
3. 相关批注自动重新计算；
4. 不自动把批注标记为 resolved；
5. 只有重新审计通过后才允许用户标记 resolved。

### 7.4 完整表格覆盖

批注入口必须覆盖：

- 16 个 Section；
- 章节标题；
- 编号标签；
- 子级标签；
- 标签值格；
- 表头；
- Section 3 的名称、CAS、含量三列；
- Section 8.2 的四个控制参数值；
- Section 11 的多列标签和值；
- Section 15 的法规行；
- 空值或被剪枝行的原始来源位置。

已经被剪枝的行，也要允许通过审阅列表批注 source-only 或 omitted 事实。

---

## 8. Agent 最容易读取的固定导出格式

### 8.1 主格式结论

主格式固定为 JSONL/NDJSON，辅以一个 manifest.json。

不建议把 Excel 作为唯一主格式，因为：

- 合并单元格不利于 Agent 解析；
- 批注和多层 evidence 需要嵌套结构；
- 行号和视觉位置容易被 Excel 排版改变；
- 源、匹配、模板三方证据不适合平面表格；
- Agent 需要逐条流式读取和逐条定位。

Excel 可以作为人类审阅副本，但不能作为唯一事实文件。

### 8.2 固定审阅包

统一导出为：

    MODEL_MSDS_REVIEW_BUNDLE/
      manifest.json
      source-facts.ndjson
      matching-slots.ndjson
      annotations.ndjson
      section-summary.json
      review-summary.md
      MODEL_MSDS_CN_冠志.docx
      MODEL_MSDS_CN_冠志.pdf
      optional-review.xlsx

其中：

- MODEL_MSDS_CN_冠志.docx 是调用编辑模块导出的正式 MSDS；
- annotations.ndjson 是批注主文件；
- source-facts.ndjson 是 Agent 追溯源事实的文件；
- matching-slots.ndjson 是匹配槽和模板槽的对照；
- review-summary.md 是人类快速阅读的摘要；
- optional-review.xlsx 是可选的人类批量筛选表。

### 8.3 manifest.json

manifest 记录：

    schemaVersion
    reviewSessionId
    productModel
    sourceFileName
    sourceHash
    templateName
    templateHash
    matchingRunId
    editorRevision
    annotationCount
    openCount
    blockerCount
    errorCount
    warningCount
    staleCount
    orphanedCount
    finalMsdsFile
    generatedAt
    exportStatus

Agent 先读 manifest，再按需要读取 NDJSON。

### 8.4 annotations.ndjson

每一行是一条独立批注，保证：

- 一行一个批注；
- 不依赖行顺序；
- 可以增量处理；
- 可以根据 annotationId 去重；
- 可以根据 Section、slotId、target.kind 过滤。

建议字段：

    annotationId
    reviewSessionId
    status
    severity
    category
    title
    comment
    expected
    actual
    suggestedAction
    anchor
    sourceEvidence
    matchEvidence
    templateEvidence
    snapshot
    author
    createdAt
    updatedAt

字段名、枚举值和层级必须固定并版本化，不能每次导出临时变化。

---

## 9. Agent 读取顺序

Agent 处理审阅包时固定按照以下顺序：

1. 读取 manifest.json；
2. 检查 sourceHash、templateHash 和 matchingRunId；
3. 读取 annotations.ndjson；
4. 按 severity 和 status 筛选 blocker、error、stale、orphaned；
5. 用 anchor.slotId 和 rowFingerprint 定位；
6. 读取 source-facts.ndjson 验证源事实；
7. 读取 matching-slots.ndjson 验证匹配过程；
8. 判断 expected 和 actual；
9. 生成修复计划；
10. 只有修复并重新审计后才将 status 改成 resolved 或 accepted。

Agent 不应依赖：

- UI 当前滚动位置；
- 浏览器坐标；
- Excel 行号；
- Word 页码；
- 用户截图中的红框；
- 自由文本 comment 单独判断问题。

---

## 10. 正式 MSDS 导出流程

### 10.1 批注保存

用户在匹配页保存批注后：

1. 生成或更新 reviewSession；
2. 保存 annotation；
3. 保存当前匹配结果快照；
4. 保存 source value、matched value 和 template value；
5. 保存 editorRevision。

### 10.2 调用编辑模块

点击“导入编辑模块并导出审阅包”后：

1. 将 matching.templateEngine 写入 editor.engine；
2. 保留所有 annotations；
3. 在编辑器中继续允许人工编辑值；
4. 修改值后更新 editorRevision；
5. 重新运行 auditEngine；
6. 如果存在 blocker，阻止正式 MSDS 导出；
7. 如果只有 warning，允许导出但在 manifest 中记录；
8. 调用现有 exportArrayBuffer 导出正式 MSDS DOCX；
9. 生成 annotations.ndjson、manifest.json 和 review-summary.md；
10. 打包为固定审阅包。

### 10.3 正式文档和审阅文档分离

正式 MSDS DOCX：

- 不写入批注文字；
- 不插入红框、颜色、批注标记或 Agent 指令；
- 只包含产品 MSDS 内容。

审阅包：

- 保存所有批注；
- 保存源、匹配、模板三方快照；
- 保存目标位置；
- 保存导出的正式 DOCX；
- 保存最终审计状态。

如果以后需要 Word 内嵌评论，可以作为后续扩展，但不能替代 JSONL 主证据。

---

## 11. 批注状态和导出门禁

正式 MSDS 导出前必须检查：

| 条件 | 结果 |
|---|---|
| blocker 批注存在 | 阻止导出 |
| error 批注存在且未解决 | 阻止导出 |
| stale 批注存在 | 需要重新确认 |
| orphaned 批注存在 | 需要重新定位 |
| warning 批注存在 | 可导出，但 manifest 标记 warning |
| 只有 info | 可导出 |
| 没有批注 | 正常导出 |

导出状态写入 manifest：

    exportStatus:
      allowed
      blocked
      allowed_with_warnings

---

## 12. 实施拆分

### P0：数据和锚点

1. 新增 reviewSession；
2. 新增 annotation 数据结构；
3. 为 Section、行、标签、值、单元格和位置生成稳定 anchor；
4. 复用 msds-handoff.js 的 source fact 和 mapping plan；
5. 保存 sourceHash、templateHash、matchingRunId 和 editorRevision。

### P1：匹配页批注 UI

1. 匹配表标签和值增加批注入口；
2. 支持行、单元格、Section 和位置批注；
3. 显示批注徽标；
4. 显示当前目标的 source/match/template 三方快照；
5. 支持批注状态和严重程度；
6. 支持筛选和跳转；
7. 支持原始表、标准表和原版式预览三种 panel。

### P2：编辑器联动

1. commit-to-editor 保留批注；
2. 编辑值时更新 valueHash；
3. 值变化后标记 stale；
4. 删除行后标记 orphaned；
5. 重新审计后允许 resolved。

### P3：导出

1. 导出正式 MSDS DOCX；
2. 导出 manifest.json；
3. 导出 annotations.ndjson；
4. 导出 source-facts.ndjson；
5. 导出 matching-slots.ndjson；
6. 导出 section-summary.json；
7. 导出 review-summary.md；
8. 可选导出 review.xlsx；
9. 打包成固定审阅包。

### P4：验证

1. 每个标签锚点可回到原目标；
2. 每个值锚点可回到值格；
3. 每个位置锚点有逻辑路径；
4. 导出后重新读取 DOCX，锚点仍然可定位；
5. 行剪枝、重编号和新增行后，批注状态正确变成 stale 或 orphaned；
6. Agent 只读取 JSONL 即可确定问题；
7. 正式 MSDS 文档不含内部批注。

---

## 13. 验收标准

### 功能验收

- 16 个 Section 都可以添加批注；
- 每个标签可批注；
- 每个值可批注；
- 每个行、单元格和 Section 可批注；
- 位置批注同时有逻辑定位和视觉辅助定位；
- 原始识别表和标准匹配表可以分别批注；
- 源文件原版式预览可以保存位置批注；
- 批注可以被编辑、关闭、重新打开和标记 stale。

### Agent 定位验收

- 只读取 annotations.ndjson 就能知道问题目标；
- 只读取 anchor 就能定位 Section、record、row、cell 和 slot；
- 只读取 sourceEvidence 就能回到源文件事实；
- 只读取 matchEvidence 就能知道当前匹配理由；
- 只读取 templateEvidence 就能知道模板目标；
- 不依赖页面截图和浏览器滚动状态。

### 导出验收

- 正式 MSDS DOCX 可由编辑模块正常导出；
- 批注不会污染正式 MSDS；
- 审阅包中包含正式 DOCX；
- manifest 能反映批注数量和导出门禁；
- annotations.ndjson 可逐行读取；
- 导出后重新加载 DOCX 后 anchor 能复核；
- Excel 只是可选的人类审阅副本，不是唯一证据。

---

## 14. 最终建议

固定采用以下导出策略：

    主输出：正式 MSDS DOCX
    主审阅证据：annotations.ndjson
    审阅元数据：manifest.json
    源事实：source-facts.ndjson
    匹配槽位：matching-slots.ndjson
    人类摘要：review-summary.md
    可选人类表格：review.xlsx

其中 annotations.ndjson 是 Agent 最应该读取的固定格式，因为它能够：

- 逐条处理；
- 稳定定位；
- 记录源、匹配、模板三方证据；
- 保存 expected、actual 和 suggestedAction；
- 支持状态流转；
- 支持导出后复核；
- 不受 Word 页码和 Excel 排版影响。

正式 MSDS 和批注证据必须分离。这样既能得到可交付的产品文档，也能保留完整的批注、审阅、问题定位和 Agent 修复依据。

