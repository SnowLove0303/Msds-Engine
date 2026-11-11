# Design: 自适应动态序号对齐几何拓扑设计方案

## 一、 系统架构与数据流拓扑

对齐治理遵循“底层原语自适应投影 + 专属格式化函数参数解耦 + 流水线动态感知”三层拓扑架构：

```mermaid
flowchart TD
    A["输入数据源 (Source Records / XML)"] --> B["表格渲染与行构建"]
    
    subgraph "Layer 1: 编辑器底层原语 (universal-editor-primitives.js)"
        C["applyGlobalTypographyProjection()"]
        C1["动态扫描行第0列: 萃取全部序号"]
        C2["计算 maxSeqDigitCount"]
        C3{"maxSeqDigitCount >= 4 ?"}
        C3 -- "是 (如包含 11.10, 8.2.2.1)" --> C4["Tier B: targetIndent = '560'"]
        C3 -- "否 (如仅有 11.1~11.9)" --> C5["Tier A: targetIndent = '420'"]
        C4 --> C6["全章节单元格投影: w:left & w:hanging"]
        C5 --> C6
    end

    subgraph "Layer 2: 专属格式化原语 (docx-engine.js)"
        D["formatSection11LabelCell(cell, numberStr, labelText, isEn, customIndent)"]
        D1{"指定了 customIndent ?"}
        D1 -- "是" --> D2["使用 customIndent"]
        D1 -- "否" --> D3["根据 numberStr 自动判定: digits >= 4 ? 560 : 420"]
    end

    subgraph "Layer 3: 流水线兜底守卫 (pipeline-engine.js)"
        E["formatEnglishLabelCell(cell, W_NS, secNum, customIndent)"]
        E1["废除 if (secNum === 11) 特判"]
        E2["动态探测父表格内所有 tc0 的 maxSeqDigitCount >= 4 ? 560 : 420"]
    end

    B --> C
    B --> D
    C --> G["最终一致的自适应 DOCX / PDF"]
```

---

## 二、 核心变更点技术细节

### 1. `universal-editor-primitives.js`
- 移除 `const isTierB = (maxSeqDigitCount >= 4) || (sectionNumber === 11);` 中的硬编码部分；
- 改为纯粹的动态判定：`const isTierB = (maxSeqDigitCount >= 4);`；
- 正则优化：将 `c0Text.match(/^(\d+\.\d+(?:\.\d+)?)/)` 升级为 `c0Text.match(/^(\d+(?:\.\d+)+)/)`，全量通配多级序号（如 `8.2.2.1`、`11.10` 等）；
- 保持已统一的字号设计令牌 `tokens.LABEL_SEQ`（英文 19 即 9.5pt，中文 21 即 10.5pt）。

### 2. `docx-engine.js`
- `formatSection11LabelCell(cell, numberStr, labelText, isEnglish = false, customIndent = null)`：
  - 动态计算：`const digitsOnly = (numberStr || '').replace(/\D/g, '');`
  - `const indent = customIndent || (digitsOnly.length >= 4 ? '560' : '420');`
  - 调用 `applyStandardHangingIndent(cell, indent, indent);`，彻底摆脱 560 固化。
- `formatSection11ToxicologyRow` 中生成 11.7 生殖毒性合并单元格时，若为 8 行毒理拓扑（最大序号为 11.8），默认使用 420 dxa 标尺。

### 3. `pipeline-engine.js`
- `formatEnglishLabelCell`:
  - 移除第 5118 行 `if (sectionNumber === 11) indent = '560';`；
  - 统一由表格内部序号数字位数动态计算 `isTierB`。

---

## 三、 风险与防御策略

1. **Section 9 激光垂线对齐冲突风险**：
   - Section 9 序号为 `9.1` ~ `9.15`，其中 `9.10` ~ `9.15` 为 3 位纯数字（`910` $\to$ 3 位数字）。
   - 最大位数仍为 3 位，因此 Section 9 天然维持 420 dxa（即 80.28pt 激光垂线），与 `check_pdf_s9_alignment.py` 100% 契合。
2. **多级复杂编号防越界风险**：
   - 若某章节包含 `14.1.1` 或 `8.2.2.1`，其纯数字分别为 4 位，将精准命中 `maxSeqDigitCount >= 4`，自动启用 560 dxa 标尺，防止窄标尺文字被推至下一行。
