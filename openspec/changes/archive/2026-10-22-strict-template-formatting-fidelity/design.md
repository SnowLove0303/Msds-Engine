# Design Document: strict-template-formatting-fidelity

## Overview
本设计旨在根除 MSDS 格式生成与编辑器中的样式碎片化问题。通过构建统一的语义格式化中枢（Semantic Formatting Hub），强制所有覆写动作遵循“模板事实基准”。

## Core Architecture Changes

### 1. Unified Semantic Cell Formatter (`applySemanticCellFormat`)
在 `web/src/docx-engine.js` 中设立统一格式化入口：
```javascript
export function applySemanticCellFormat(cellNode, semanticType, content, options = {}) {
  // semanticType: 'section9-label' | 'table-label' | 'table-value' | 'custom'
  // 严格根据模板事实构造 XML，拒绝随意修改
}
```

### 2. Section 9 Label Formatting Standardization
- 段落 `<w:pPr>`：
  - `<w:spacing w:line="300" w:lineRule="auto"/>`
  - `<w:ind w:left="420" w:hanging="420"/>`
  - 彻底移除 `<w:tabs>` 节点。
- 序号 Run：Times New Roman（中文）/ Arial（英文），10.5pt Bold (`sz="21"`) + 尾随空格。
- 标签 Run：Arial 12pt Bold (`sz="24"`)，严禁使用黑体。

### 3. English Pipeline Label-Value Protection
在 `web/src/pipeline-engine.js` 中，确保英文模板覆写时，保留并继承原模板各章节的加粗属性与文本层级，严禁直接 `replaceCellValue` 冲掉加粗与字体样式。

### 4. Skill Policy Synchronization
同步更新本地与全局 `msds-studio/SKILL.md`，注入“格式基于模板，仅允许分类，严禁篡改”的黄金法则。
