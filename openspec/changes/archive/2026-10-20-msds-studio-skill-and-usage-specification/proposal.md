# Proposal: MSDS Studio 技能开发与功能调用/使用规范

## Why

随着 MSDS Studio 演进至涵盖四阶流水线架构（Base 中文装配 -> Base 英文专业化翻译与占位符剪枝 -> 实体多预设派生 -> 8格式 DOCX/PDF 批量导出）、模板清空防污染（清空模板、恢复模板、特殊清空）以及源文件全量核对等深度功能，系统已具备高度成熟的自动化与人机协同能力。然而，现有 Agent 技能体系缺少统一、结构化且严格契约化的 MSDS Studio 专用 Skill，导致 Agent 在执行任务时对端点调用时序、模板清空防残留策略、专业化英译边界和差异总账核对缺乏法定准则。为此，亟需正式开发 `msds-studio` 技能并确立功能调用与使用规范。

## What Changes

- **新增规范化 Agent 技能 (`msds-studio`)**：编写完备的 `SKILL.md`，提供系统双模（Web UI 与 Headless REST API）接口映射、四阶流水线自动化调度 SOP、模板清空防污染操作机制及专业化翻译约定。
- **确立模板清空与防污染使用规范**：明确“常规清空”、“特殊清空（支持标签修改）”与“恢复模板”的适用场景与安全边界，杜绝底模示例文字污染正式交付物。
- **确立源文件 vs 产出物全量差异核对 SOP**：规范 1~16 章节的逐项对比原则，将“规范增强”、“结构重构”、“规整对齐”、“完全吻合”、“精简优化”、“笔误修正”、“底模防污染”等审查类型标准化。
- **双端同步部署**：同时在 MSDS-Engine 项目受管目录（`.agents/skills/msds-studio/`）与全局技能体系（`C:\Users\Administrator\.gemini\config\skills\msds-studio/`）发布。

## Capabilities

### New Capabilities
- `msds-studio-skill-and-usage-specification`: MSDS Studio 专属技能定义、API/UI 双模调用契约、四阶流水线标准 SOP、模板清空防污染机制与交付质检规范。

### Modified Capabilities
<!-- None -->

## Impact

- 受管文档与技能目录：`.agents/skills/msds-studio/SKILL.md`、`C:\Users\Administrator\.gemini\config\skills\msds-studio/SKILL.md`。
- API 交互规范：锁定 `/api/msds/*` 与 `/api/msds/pipeline/*` 的标准入参、响应解析及异常重试逻辑。
- 交付矩阵准则：锁定 4 DOCX + 4 PDF（中/英 × 冠志/国彩）的 8 格式闭环要求。
