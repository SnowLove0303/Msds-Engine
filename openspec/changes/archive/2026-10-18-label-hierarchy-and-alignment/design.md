# Design

## Context

在目前 `web/src/docx-engine.js` 与 `web/src/main.js` 的实现中：
1. `deriveRoleStyles` 遍历所有文档记录获取首个粗体格式，由于页眉页脚表格被 `unshift` 到记录前端，导致提取到了页眉的小号字体或标题的大号字体（如 36 halfPoints / 18pt），使所有标签字号失真；
2. `normalizedSequence` 正则仅匹配双数字（`\d+\.\d+`），且依赖脆弱的 `stripLength` 字符串截断，造成多种格式的直接编号与自动编号遗漏；
3. 第一列标签渲染仅使用单一的 `label-prefix-spacer`（固定 5ch），无法区分真正的父级标签与子级标签，未能实现“父级与父级垂直对齐、子级与子级垂直对齐”，且缺乏对 Section 8“建议”无序号但归属父级的特殊处理。

## Goals / Non-Goals

**Goals:**
- 将标签字号精确纠正为标准小四（12pt / 24 halfPoints）加粗，且隔离页眉页脚与封面大标题的影响；
- 健全序号识别引擎，覆盖自动列表编号、单级与多级文本编号，做到序号零丢失；
- 建立明确的父子标签层级判定模型，精准识别普通父级、特殊父级（Section 8 建议）与子级标签；
- 落地两套独立的垂直对齐垂线：父级标签顶格垂直对齐，子级标签统一内缩并在缩进线垂直对齐。

**Non-Goals:**
- 不修改 `覆写模块/` 与 `识别模块/` 的 Python 原生代码；
- 不修改只读 DOCX 模板文件及源文件字节；
- 不改变右侧源文档 DOCX 原版预览的原始渲染。

## Decisions

### 1. 角色样式提取隔离与小四字号保底
- **决策**：`deriveRoleStyles` 只检索正文主体表格（`part === 'word/document.xml'`）中第 1 行及之后的数据行；
- **保底策略**：无论源文档是否存在极端字号，正文标签统一规范化为 12pt（`sizeHalfPoints: '24'`）、字体优先采用宋体（中文）或 Times New Roman（英文），加粗展示。

### 2. 序号提取与零丢失渲染
- **决策**：将序号匹配逻辑扩充为支持：
  - 多级数字：`1.1`、`1.1.1`、`2.10`；
  - 单级数字：`1.`、`2.`、`1、`；
  - Word 自动编号：从 `numbering.xml` 与 `w:numPr` 映射的层级文本。
- **渲染保护**：序号作为独立的 `.sequence-run` 节点输出，若未匹配到合法序号，绝不盲目截断后续正文内容，确保字符零丢失。

### 3. 父子标签判定模型与 Section 8 特例
- **决策**：实现判定函数 `classifyLabelTier(cell, paragraph, record)`：
  ```javascript
  // 1. Section 8 特殊规则：建议 / Recommendation 归属父级
  if (record?.sectionNumber === 8 && /^(?:建议|Recommendation)[：:]?$/i.test(cellText)) {
    return 'parent';
  }
  // 2. 带有有效章节序号的字段标签 -> 父级
  if (hasSequence) {
    return 'parent';
  }
  // 3. 无序号的第一列字段标签 -> 子级
  if (cell.col === 0 && (cell.labelText || isLabelCell)) {
    return 'child';
  }
  return 'default';
  ```

### 4. 双垂线排版与 CSS 样式系统
- **决策**：
  - 父级标签容器添加 `.label-parent-row`：`padding-left: 0`，序号与标签文本从单元格最左基准线开始排列，不同行的父级标签左边缘严格垂直对齐；
  - 子级标签容器添加 `.label-child-row`：设置固定的统一左内缩进（如 `padding-left: 2rem` 或 `1.8rem`），所有子级标签文本在此垂线上严格垂直对齐；
  - Section 8 的 `建议：` 应用 `.label-parent-row`，与 `8.1`、`8.2` 严格在同一条左基准线上对齐。

## Risks / Trade-offs

- **[Risk]** 部分非标准 DOCX 的 Section 8 “建议”可能带有前后空格或中英文冒号。
  → **Mitigation**：采用正则 `^\s*(?:建议|Recommendation)\s*[：:]?\s*$` 进行归一化匹配。
- **[Risk]** 现有单测对 DOM 结构有依赖。
  → **Mitigation**：确保 `web/tests/smoke.mjs` 中的元素选择器与往返导出断言同步覆盖新类名。
