# Proposal: PR-6 全模块“零硬规定、全参数化”系统重构

## 背景与问题
尽管系统提出了三层正交解耦愿景，底层源码与规范文档仍存在大量情景化硬规定（如 `template-editor.js` 写死 `F:/App Location/...` 路径、`冠志/国彩` 公司预设与 `420/560 dxa`；`staged-mechanical-audit.js` 写死 8 格式矩阵与 `80.28pt/87.28pt`；`AGENTS.md` / `SKILL.md` 将特定客户场景写为系统级铁律）。

## 目标
1. 将既有 `冠志/国彩 8 格式` 场景外置为可选示例配置包 `profiles/guanzhi-guocai-8x/profile.json`。
2. 升级 `template-topology-recognizer.js` 从任意母版 XML 自动提取完整 `typographyProfile`（字体、字号、缩进、标尺、边框、各语义角色格式）。
3. 改造 `template-editor.js` 与 `universal-editor-primitives.js` 按 `typographyProfile` 参数渲染，彻底移除写死的本机绝对路径与企业名称。
4. 改造 `staged-mechanical-audit.js` 按传入的 `templateProfile` 与 `expectedDeliverables` 参数化审计。
5. 清理 `AGENTS.md` / `SKILL.md` / `system-vision.js` 中的硬规定表述，并在 `lint_code_invariants.mjs` 中新增反硬编码守卫。
