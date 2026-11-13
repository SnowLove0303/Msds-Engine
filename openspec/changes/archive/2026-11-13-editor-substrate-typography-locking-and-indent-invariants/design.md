# Design: 编辑器底层排版几何固化与多列顶格/通栏层级缩进架构设计

## 1. 架构总览 (Architecture Overview)

本设计的核心目标在于：**将 Pipeline 时期沉淀的高质量排版规则，直接内化为编辑器底层原语（Substrate Primitives）的通用执行公理**。
拒绝打补丁或针对特定型号/特定章节的碎片化修复，从底层彻底解决：
1. **序号与标签间隔**：制表锚点单一真理源 + 动态最大位数自适应标尺（Tier A 420 dxa / Tier B 560 dxa）；
2. **标签多行折行与未编号对齐**：悬挂缩进锁死垂直基准线（垂直偏差 $\le 1\text{px}$） + 未编号标签基线同步 + Office 历史属性物理级剥离；
3. **值的缩进二分机制**：多列表格纯净顶格左对齐（Flush Left） vs 通栏单列表格树状大纲层级缩进（Hierarchical Indent）。

```mermaid
flowchart TD
    subgraph Cell Analysis Substrate
        ROW[表格当前行] --> DETECT{检测行物理列数}
        DETECT -->|cells.length > 1| MULTI[多列表格模式]
        DETECT -->|cells.length === 1| FULL[通栏单列模式]
    end

    subgraph Column 0: Label & Sequence Substrate
        MULTI --> C0[第 0 列: 标签与序号]
        C0 --> TIER{动态扫描章节最大序号位数}
        TIER -->|D_max <= 3| TIER_A[Tier A: 420 dxa 标尺]
        TIER -->|D_max >= 4| TIER_B[Tier B: 560 dxa 标尺]
        
        TIER_A --> INJECT_A[注入 left=420 hanging=420 + 单个 tab]
        TIER_B --> INJECT_B[注入 left=560 hanging=560 + 单个 tab]
        
        C0 --> UNNUM{是否为未编号标签}
        UNNUM -->|是| INJECT_UNNUM[注入 left=420 无 hanging]
        
        CLEAN[物理剥离 w:firstLine / leftChars / numPr] --> C0
    end

    subgraph Column 1+: Value Substrate (Axiom 1)
        MULTI --> C1[第 1+ 列: 值单元格]
        C1 --> FLUSH_LEFT[强制段落 w:left=0 或清除 w:ind]
        FLUSH_LEFT --> SNAP_MARGIN[顶格紧贴单元格左内边距 108 dxa]
    end

    subgraph Full-Width Narrative Substrate (Axiom 2)
        FULL --> S2_NARRATIVE[Section 2 等通栏单列容器]
        S2_NARRATIVE --> CLASSIFY{段落语义判定}
        CLASSIFY -->|父级分类标签| BASE_INDENT[基础顶格对齐]
        CLASSIFY -->|子级防范措施条款| HIER_INDENT[强制向右层级缩进 240 / 420 dxa]
    end
```

---

## 2. 编辑器底层固化机制设计

### 2.1 序号与标签间隔底层固化 (`REQ-SEQ-LABEL-SPACING-02`)
- **原语级重构**：在 `web/src/universal-editor-primitives.js` 的 `applyGlobalTypographyProjection` 以及 `web/src/editor-writer.js` 的标签格式化函数中：
  - 构造段落时，序号后直接追加 `<w:tab/>`，禁止拼接空格；
  - 动态计算当前章节所有行中最大序号数字位数（`maxSeqDigitCount`）：
    ```javascript
    const isTierB = (maxSeqDigitCount >= 4);
    const targetIndent = isTierB ? '560' : '420';
    ```
  - 序号与标签文本之间拥有标准的制表停止位 `<w:tab w:val="left" w:pos="420"/>`（或 `560`），确保 Word 渲染时 100% 停留在预设基线上，绝无跳步。

### 2.2 标签对齐与折行底层固化 (`REQ-LABEL-CONTINUATION-ALIGN-03`)
- **悬挂缩进锁死**：
  - 带序号段落：`<w:ind w:left="420" w:hanging="420" w:leftChars="0"/>`；
  - 折行文字首字被强制对齐在 `420 dxa` 处，垂直方向与第一行标签文字首字完全重合；
- **未编号标签基线同步**：
  - 无序号段落：`<w:ind w:left="420" w:leftChars="0"/>`，消除上下标签左边缘锯齿；
- **历史属性彻底剔除**：
  - 遍历所有段落 `pPr`，物理移除 `w:firstLine`、`w:firstLineChars`、`w:hangingChars`、`w:leftChars` 以及 `w:numPr`。

### 2.3 值的缩进与多列/通栏对齐二分机制底层固化 (`REQ-VALUE-INDENT-ALIGN-04`)
- **多列表格（`cells.length > 1`）**：
  - 对 Column 1..n 单元格遍历段落，强制清空 `pPr` 中的 `w:ind`，或者将其重置为 `w:left="0"`；
  - 彻底杜绝注入 `w:left="240"`，保证值段落文字纯净顶格贴齐单元格内左边距（108 dxa）；
- **通栏单列表格（`cells.length === 1` 或 `gridSpan > 1`）**：
  - 在 `renderFullWidthRow` 或通用通栏原语中：
    - 父级标签（如“预防措施：”、“事故响应：”）应用基础缩进；
    - 子级防范说明条款（如 P-code 措施行）应用向右层级缩进（`s2SubValueIndent`，240 dxa 或 420 dxa），维持清晰的树状大纲层级结构。

---

## 3. 依赖权衡与安全隔离

1. **模板物理文件绝对只读**：`web/public/templates/` 目录中的 DOCX 母版作为只读基座，严禁修改；
2. **算法识别引擎隔离**：`web/src/recognition-engine.js` 享有 `@ANTIGRAVITY_INVARIANT_LOCK` 保护，保持现状；
3. **变更收敛范围**：
   - `web/src/universal-editor-primitives.js`: 强化底层排版投影原语（制表符纯净装配、折行悬挂锁死、未编号基线对齐、多列值顶格左对齐）；
   - `web/src/editor-writer.js`: 强化写入时的多列与通栏二分处理逻辑；
   - `web/tests/test_editor_indent_and_alignment_invariants.mjs`: 新增全量对齐与缩进自动化测试套件。
