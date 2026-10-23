# Design: Section 2 对齐、Section 12 编号优先级防抢占与智能标点补全

## Context

针对 EP-1702 产出物审核中暴露的排版与内容准确性问题，本设计从算法底层和技能规范两端建立防御：
1. `smart-matching.js` 对 Section 2 复合块重构时的 OOXML 段落缩进修复；
2. Section 12 细分子项插槽路由与优先级判定；
3. 文本注入层面的智能句末标点补全引擎；
4. `msds-studio` 技能文档规范升级。

## Goals / Non-Goals

**Goals:**
- **Section 2 完美对齐**：确保 2.1、2.2、2.3、2.4 的序号（左对齐）与标签首字（在 459 制表位水平对齐）在 Word 和 PDF 中实现 100% 几何对齐。
- **Section 12 精确归位**：杜绝 12.3 夺取 12.1，使 12.1（生态研究声明）、12.2（生物降解）、12.3（鱼类水蚤无害分类）100% 忠实还原源文件。
- **智能标点补全**：对缺失末尾标点的中文叙述句自动补全 `。`，将“无数据”规范为“无数据资料。”，同时规避理化数值、范围与单位。
- **防范机制写入 Skill**：将排版不变量与审查要点写入 `msds-studio` 规范。

**Non-Goals:**
- 不改变母版物理文件（`web/public/templates/` 保持只读）。
- 不破坏现有 Section 9、Section 13 等已稳定特性的行为。

## Decisions

### 1. Section 2 段落缩进与制表位标准化
在 `smart-matching.js` 中新增/调用段落规范化逻辑：
```javascript
function applyStandardHangingIndent(cell, leftVal = "457", hangingVal = "457", tabPos = "459") {
  // 确保 pPr 拥有统一的 ind 和 tabs
  // <w:ind w:left="457" w:leftChars="0" w:hanging="457" w:hangingChars="217"/>
  // <w:tabs><w:tab w:val="left" w:pos="459"/></w:tabs>
}
```
对 `r2` (2.1), `r3` (2.2), `r4` (2.3), `r5` (2.4) 的标签单元格统一应用上述属性，清除干扰的首行缩进或 660 偏差。

### 2. Section 12 源文件小节编号优先级防抢占
修改 `smart-matching.js` 中的候选项分类器：
- 当源文本包含显式编号前缀（如 `12.1`）时，强制绑定到 `ecotoxicity`（置信度 1.0）；
- 含有 `12.3` 或以 `其他/其它` 起头的行，严禁因含有“鱼类/水蚤”等关键字被抢占至 `ecotoxicity`，必须明确绑定到 `other_adverse_effects`；
- 在写值阶段，保证 12.1、12.2、12.3 独立注入，不再互相覆盖或将 12.3 清空。

### 3. 智能句式末尾标点补全 (Intelligent Punctuation Normalization)
在值写入模板前，调用 `normalizeTerminalPunctuation(text)`：
- 分行检测：如果是叙述性句子且末尾为汉字（如“就医”、“衣物”、“无危害”等），追加 `。`；
- 过滤机制：若以英文数字、测量单位（`mPa.s`, `g/cm3`, `%`, `℃`）、代号（`EN 374-3`）或已有标点（`。`, `；`, `!`, `?`）结尾，保持原样；
- 规范短语：“无数据”统一规范为“无数据资料。”。

### 4. 技能规范防范沉淀
在 `msds-studio/SKILL.md` 的防错治理体系中，增设：
- **规则 1**：Section 2 对齐不变量（Hanging Indent 457 dxa 统一性）；
- **规则 2**：显式子项编号防抢占准则；
- **规则 3**：标点规范化判定与审查清单。

## Risks / Trade-offs

- [标点补全误伤特殊参数] → 增加严格的白名单/黑名单正则过滤，仅对中文句末补全，数值与单位坚决不动。
- [段落属性修改破坏样式继承] → 仅针对段落级别的 `<w:ind>` 与 `<w:tabs>` 进行精准修改，不破坏字体、字号与粗体设置。
