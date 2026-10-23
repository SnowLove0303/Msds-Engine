# Tasks

## 1. 底层核心算法与引擎升级

- [x] 1.1 在 `docx-engine.js` 中实现 `harmonizeTableLabels(engine)`，自动合并标签单元格内的多段 `<w:p>` 与 `<w:br>`，消除英文断词断句换行，并注入标准悬挂缩进与制表位
- [x] 1.2 在 `docx-engine.js` 中实现 `extractAdaptiveRevisionDate(sourceEngine)`，从源文件页脚及正文中智能提取真实修订日期，彻底消除写死默认日期
- [x] 1.3 在 `docx-engine.js` 中重构 `updateHeaderFooterData` 为自适应多模态页脚更新引擎，兼容表格型、段落型与缺失型页脚结构

## 2. 流水线管道解耦与接入

- [x] 2.1 在 `pipeline-engine.js` 中全面接入自适应日期提取与 `harmonizeTableLabels`，贯穿 Base-CN、Base-EN 与实体派生阶段

## 3. 技能规范文档同步

- [x] 3.1 在 `msds-studio/SKILL.md`（项目级与全局）中沉淀《模板自适应规范与页尾时间注入准则》，确立新模板导入的标准治理规范

## 4. 验证与交付物重构

- [x] 4.1 编写验证脚本，测试标签平整化、悬挂缩进统一性与多模态页尾时间注入准确性
- [x] 4.2 重新执行 EP-1702 端到端流水线，生成标准 8 格式文档并核验英文换行与页尾时间
- [x] 4.3 运行 OpenSpec strict 校验并通过变更归档
