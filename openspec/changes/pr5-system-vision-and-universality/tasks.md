# Tasks: PR-5 系统构建愿景显式注入与工作流去预设硬编码

- [x] 1. 新增 `web/src/system-vision.js` 固化系统愿景与通用性准则
- [x] 2. 重构 `run_standard_production.mjs`：输出愿景横幅并废除硬编码 `targets`，支持 `--presets`/`--languages`/`--formats`/`--noPreset`
- [x] 3. 在 `web/src/mcp-server.js` 中注入系统愿景到 `instructions` 与核心探查工具返回值
- [x] 4. 更新 `AGENTS.md`、`SKILL.md`、`README_FOR_AGENT.md` 与 `lint_code_invariants.mjs`
- [x] 5. 新增 `web/tests/test_system_vision_and_targets.mjs` 并运行全套验证
