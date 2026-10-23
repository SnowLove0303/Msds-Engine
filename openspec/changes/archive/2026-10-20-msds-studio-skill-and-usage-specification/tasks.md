# Tasks

## 1. Skill 核心文档与规范编写

- [x] 1.1 编写 `msds-studio` 技能文档（`.agents/skills/msds-studio/SKILL.md`），包含 YAML 元数据、四阶流水线接口调用、模板清空防污染机制、16章节差异核对规范及8格式交付矩阵，并通过 VS Code 检阅确认
- [x] 1.2 将 `SKILL.md` 同步发布至 Antigravity 全局技能目录 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`，并通过 VS Code 检阅确认

## 2. 规范与流程落地验证

- [x] 2.1 运行 OpenSpec 校验 `openspec validate msds-studio-skill-and-usage-specification --strict` 确保规格全量校验通过
- [x] 2.2 验证技能文档结构与端点契约的完备性与可调用性
