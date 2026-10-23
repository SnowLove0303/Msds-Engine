# Design Document: table-geometry-and-vmerge-normalization

## Overview
本方案在 `web/src/docx-engine.js` 中设计并实现通用的 `normalizeRowGeometry` 工具，彻底解决表格删列、收敛或复合行合并后引发的几何失衡（宽度缺失、跨列丢失、悬空合并）问题。

## Core Components

### 1. `normalizeRowGeometry(row, options)`
```javascript
export function normalizeRowGeometry(row, options = {}) {
  // 1. 清除单行上的孤立 vMerge 标记（restart / continue）
  // 2. 若目标为标准 2 列行（如 Section 11），将末尾 Value 单元格宽度补全为 6262 dxa，并设置 gridSpan="3"
  // 3. 校验并确保全行单元格宽度之和等于基线总宽度 9781 dxa
}
```

### 2. 流水线自动化嵌入
在 `smart-matching.js`（处理 Section 11 生殖毒性与附加信息收敛处）和 `pipeline-engine.js`（英文版第 11 章节处理处）统一挂载 `normalizeRowGeometry`，实现“操作即自愈”。

### 3. Skill 与质检门禁
将表格几何守恒与纵向合并闭环作为标准八格式交付质量检查项。
