# Tasks: PR-3 Context 2 通用分类与可插拔 Rule Pack

- [x] 1. 新增 `web/src/rule-pack-registry.js` 定义 `PURE_SOURCE_PRESERVATION` / `CN_GB_MSDS_DEFAULT` 与 `classifyLineByGenericFeatures`
- [x] 2. 在 `web/src/context-governor.js` 中接入 `options.rulePack`、`options.roleOverrides` 与动态章节遍历
- [x] 3. 新增 `web/tests/test_context2_rule_pack.mjs` 验证保真模式、国标默认模式与 `roleOverrides`
- [x] 4. 运行测试、`npm run lint --prefix web` 与 `openspec validate --strict`
