# Design: 底层统一语义槽位归属与全篇表格标签/值纯左对齐架构设计

## Context & Problem Analysis

### 1. 归属倒置成因（Semantic Inversion Root Cause）
在既有系统 `web/src/smart-matching.js` 中：
- `case 5`:
  ```javascript
  if (/自供气式呼吸器|...|不要吸进烟尘|.../i.test(rawText)) {
    return { slotKey: 'protective_actions', confidence: 0.95 };
  }
  ```
  该逻辑将烟尘危害判定为防护措施。同时在 3620 行：
  ```javascript
  if (matchedItem.key === 'special_hazards' && injectVal) {
    if (hasProtAction) {
      injectVal = injectVal.replace(/\s*(?:在着火或爆炸情况下[，,]?\s*不要吸进烟尘[。]?)/g, '').trim();
    }
  }
  ```
  这一段代码对 5.3 进行了破坏性清洗，强行把烟尘语句从 5.3 剥离并塞入 5.4。
  而在化工 SDS 标准（GB/T 16483 / GB/T 17519 及 UN GHS）中，5.3 是“由化学品所引起的特别危险性（如燃烧分解产物、烟尘吸入毒性）”，5.4 是“灭火注意事项及防护装备（SCBA、水流控制）”。母版本身也在 5.3 包含了烟尘警示。

### 2. 标签横向拉伸走样成因（Typography Justify Root Cause）
在 OpenXML 中：
- 当一个段落具有 `<w:jc w:val="both"/>` 时，Word 会计算行宽并强行拉开每一个词间距，使得整行文字填满列宽。
- 母版在制作过程中，部分未使用的折叠行（如 Section 11 中带 `vMerge="continue"` 的备用行）包含 `<w:jc w:val="both"/>`。
- 当 `pipeline-engine.js` 展开 Section 11 并调用 `formatSection11LabelCell` 格式化 `11.4 Respiratory or skin sensitization:` 时，由于该函数只关注了 `w:ind` 和 `r`，未显式覆盖段落的 `w:jc`，导致 `<w:jc w:val="both"/>` 依然生效。
- 此外，Section 13 中 `enforceSection13DoubleCenter` 错误地设置了 `jc='center'`，造成水平居中。
- 全篇后处理巡检（Step 12）以及 Gate 6 门禁仅遍历了 `c = 1`（数值单元格），对 `c = 0`（标签单元格）留下了完全的盲区。

---

## Architecture Solutions

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Origin Producer: 语义识别与槽位归属底层 (smart-matching.js)             │
│ • 将 /不要吸进烟尘/ 等警示词从 protective_actions 移除，归入 special_hazards  │
│ • 废除在 special_hazards 中强行正则剔除烟尘语句的清洗逻辑              │
│ • 规范未命名续行：空标签行默认合流进前序槽位事实链                    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ 事实指纹 100% 守恒传输
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Pipeline Bilingual Assembly: 双语流水线装配 (pipeline-engine.js)       │
│ • sec5.specific_hazards: 燃烧产物 + "In case of fire or explosion..."  │
│ • sec5.protective_equipment: SCBA + 灭火用水控制，不混入烟尘警示        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ 结构化注入 DOM
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Universal Typography & Styler Layer: 底层几何排版 (docx-engine.js)      │
│ • applyStandardHangingIndent: 注入 ind 的同时强制清除 both/center，    │
│   显式写入 <w:jc w:val="left"/>                                        │
│ • formatSection11LabelCell / formatSection14LabelCell: 显式保证 left   │
│ • enforceSection13DoubleCenter: 仅保留 vAlign 垂直居中，jc 严格纯左对齐 │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ 全篇文档拓扑巡检
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Global Typography Pass & Gate 6: 全局硬阻断 (pipeline-engine.js)       │
│ • Step 12 拓扑遍历：全篇所有表格所有列 (c === 0 与 c >= 1) 统一强制 left│
│ • Gate 6 出厂门禁：扫描全篇表格第 1 列标签段落，非 left 直接阻断熔断    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Blast Radius & Safety Guardrails (爆炸半径与承重墙锁定)

1. **拟变范围严格约束 (Blast Radius)**：
   - `web/src/smart-matching.js`: 仅限 Case 5 词法判断与 Section 5 注入清洗分支。
   - `web/src/docx-engine.js`: 仅限 `applyStandardHangingIndent`、`formatSection11LabelCell`、`formatSection14LabelCell`、`enforceSection13DoubleCenter`。
   - `web/src/pipeline-engine.js`: 仅限 Section 5 英文装配生成器、Step 12 全局对齐扫描循环、Gate 6 质量门禁断言。
2. **绝对承重墙锁定（保持现状承诺）**：
   - 保持 Section 11 四位数悬挂缩进（`560/560 dxa`）与制表位 `<w:tab/>` 垂直间距完全不变。
   - 保持 Section 9/14 黄金悬挂缩进（`420/420 dxa`）与既有字阶排版完全不变。
   - 保持 Table 2 成分表 CAS号/浓度列法定居中规范完全不变。
   - 保持中文版 Section 13 废弃处置尾行方法长文本两端对齐（`both`）法定豁免不变。
   - 保持既有 165 项主审计器契约与全部通过标准完全不变。
