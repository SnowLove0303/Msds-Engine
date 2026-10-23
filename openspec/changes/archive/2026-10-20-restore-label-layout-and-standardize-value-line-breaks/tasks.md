# Tasks

## 1. 撤销标签平整化并恢复标签视觉分行

- [x] 1.1 从 `docx-engine.js` 中移除 `harmonizeTableLabels`，避免破坏用户要求的标签多段视觉分行排版
- [x] 1.2 从 `pipeline-engine.js` 的流水线调用中移除 `harmonizeTableLabels`

## 2. 建立内容值（Value）标准化多行语义换行体系

- [x] 2.1 在 `pipeline-engine.js` 中的 `buildEnglishFacts` 里为 Section 5.3、5.4、6.1、7.1、12.1、14.4 等内容值注入精准的语义换行符（`\n`），与中文版 100% 对称
- [x] 2.2 确保 `writeCellValue` 对多行值文本的渲染符合规范，不产生多余空行

## 3. 技能规范文档同步

- [x] 3.1 更新 `msds-studio/SKILL.md`（项目级与全局），明确“保护标签视觉分行排版”与“16 章节内容值语义换行规范”

## 4. 验证与交付物全量重构

- [x] 4.1 全量重新生成 EP-1702 的标准 8 格式文档，验证标签视觉分行恢复与值换行对齐
- [x] 4.2 运行 OpenSpec strict 校验并通过归档
