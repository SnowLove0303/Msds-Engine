# Tasks: PR-2 模板动态认知与能力驱动匹配

- [x] 1. 重构 `web/src/template-topology-recognizer.js` 实现动态 Section 发现、能力分类与 `buildTemplateProfile`
- [x] 2. 重构 `web/src/topology-matcher.js` 移除 `1..16` 硬编码循环并支持能力驱动通栏编译
- [x] 3. 新增 `web/tests/test_dynamic_template_topology.mjs` 覆盖 5 章节自定义模板与 16 章节官方母版回归
- [x] 4. 运行测试、`npm run lint --prefix web` 与 `openspec validate --strict`
