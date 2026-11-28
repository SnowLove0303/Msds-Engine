# Tasks: PR-4 参数化机械审计与词库外置

- [x] 1. 将 `CHEMICAL_TRANSLATION_DICT` 外置至 `web/src/base-translation-dict.json` 并在 `web/src/context-governor.js` 中加载
- [x] 2. 在 `web/src/staged-mechanical-audit.js` 中为 `auditPhase1Context1` 与 `auditPhase2Context2` 增加 `templateProfile` 参数化支持
- [x] 3. 新增 `web/tests/test_parameterized_audit.mjs` 验证 5 章节模板审计与外置词库加载
- [x] 4. 运行测试、`npm run lint --prefix web` 与 `openspec validate --strict`
