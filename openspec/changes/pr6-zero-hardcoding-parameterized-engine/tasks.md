# Tasks: PR-6 全模块“零硬规定、全参数化”系统重构

- [x] 1. 外置示例配置 `profiles/guanzhi-guocai-8x/profile.json`、新增 `web/src/system-vision.js`、更新 `AGENTS.md` / `SKILL.md` / `lint_code_invariants.mjs`
- [x] 2. 升级 `web/src/template-topology-recognizer.js` 提取完整 `typographyProfile` 与动态 Section 能力
- [x] 3. 改造 `web/src/template-editor.js` 与 `web/src/universal-editor-primitives.js` 移除本机路径/企业名/标尺硬编码
- [x] 4. 改造 `web/src/staged-mechanical-audit.js` 与 `web/src/mcp-server.js` 支持参数化 `templateProfile` 与 `expectedDeliverables`
- [x] 5. 编写并运行 `web/tests/test_zero_hardcoding_e2e.mjs`、`npm run lint --prefix web`、`openspec validate --strict` 与 `walkthrough.md`
