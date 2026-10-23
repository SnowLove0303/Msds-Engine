# Design: MSDS Studio 技能架构与使用规范

## Context

MSDS Studio 现已具备完整的双模操作架构：前端 Vite 响应式工作台与后端 Express 无头 REST API。底层核心引擎由 `pipeline-engine.js`、`smart-matching.js`、`docx-engine.js` 及 `msds-api-controller.js` 组成，全面支持 Base CN -> Base EN -> 多预设派生 -> 8格式导出的完整生命周期。
本次设计聚焦于为 AI Agent 确立标准技能（`SKILL.md`）与操作规范，使 Agent 具备规范化的功能调度和质量把控能力。

## Goals / Non-Goals

**Goals:**
- 构建符合 Antigravity 技能标准的 `msds-studio` 技能定义，包含 YAML 元数据、触发词、能力拓扑与时序图。
- 规范化 Web UI 与 Headless REST API 的标准端点契约及参数传递规范。
- 确立“清空模板 / 恢复模板 / 特殊清空”的三阶防底模污染治理机制。
- 确立 16 章节源文件与产出物逐项比对的审查总账规范与 8 格式交付物验收指标。

**Non-Goals:**
- 不重构现有底层 JavaScript 引擎代码（现有管道 API 已经实测稳定可用）。
- 不篡改公共只读母版物理文件（保持 SHA-256 不变）。

## Decisions

1. **技能组织与双端部署架构**
   - 技能名称定为 `msds-studio`。
   - 双端部署：同时同步至项目内部受管目录 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\.agents\skills\msds-studio\SKILL.md` 以及 Antigravity 全局技能库 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`，实现跨会话随处可调。

2. **三阶防污染机制规范**
   - **常规清空 (Clear Values Only)**：清除底模预填数值，保留母版所有骨架与标签。
   - **特殊清空 (Clear with Label Modification)**：支持针对 Section 2、9、10、11、12 进行标签改动与段落重构，避免单格挤压或非标小节导致的格式扭曲。
   - **恢复模板 (Reset Template)**：快速还原到官方母版初始状态。

3. **四阶流水线与 8 格式闭环**
   - 规范规定：任何标准交付物必须生成 4 份 DOCX + 4 份对应 PDF（中文冠志、中文国彩、英文冠志、英文国彩）。
   - 规范化英译必须进行 Section 2 占位符剪枝、Section 9 理化“约”转“Approx.”、Section 13 EWC 3 行黄金结构保障。

## Risks / Trade-offs

- [底模示范文字污染正式报告] → 在流水线装配前强制前置执行“清空模板”或调用已内嵌清空逻辑的 pipeline API。
- [英文版出现中文字符破坏排版] → 在 Base English 阶段强制执行数值与状态的专业化英译字典清洗。
- [源文件与产出物产生不可追溯的出入] → 必须产出 16 章节的比对总账，对“多了/少了/对不上/修正”给出明确合规依据。
