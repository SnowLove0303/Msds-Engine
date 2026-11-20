# Tasks: Context 2 先中后英双阶流程与映射数据库沉淀

- [x] **Task 1: 创建持久化映射数据库 `web/src/translation-memory.json` 并在 `web/src/context-governor.js` 接入 TM 读写与数字守恒校验（REQ-01, REQ-02, REQ-03）**
  - 初始化 `web/src/translation-memory.json`；
  - 在 `buildStructuredContext2` 中自动加载 TM、生成去重后的 `untranslatedTemplate`、校验数字/CAS 守恒（`numericMismatches`）；
  - 导出 `saveTranslationsToMemory(entries)`，仅将不含中文且通过数字守恒的译文沉淀至 `translation-memory.json`；
  - 验证命令：`npm run lint`（退出码 0）。

- [x] **Task 2: 打通七流程 Runner、MCP 网关与 Skill 规范中的双阶导出/沉淀闭环（REQ-01, REQ-02）**
  - 更新 `run_standard_production.mjs` 与 `msds_mcp_gateway.mjs`：自动导出 `<MODEL>_untranslated.json`，并在 `--translations` 回填校验通过后自动调用 `saveTranslationsToMemory` 沉淀；
  - 更新 `标准化流程/MSDS_Studio_Agent_Test_Kit/skill/SKILL.md` 与 `C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`，明确“先中文治理、再逐句翻译回填、自动沉淀 TM”的双阶规程；
  - 验证命令：用 `PA-4840` 实测首轮导出待译模板 -> 回填 `isValid=true` -> 无 `--translations` 二次运行自动命中 TM（`untranslatedCount === 0`）。

- [x] **Task 3: 8 样本回归、重打七流程 `.zip` 包与仓库同步**
  - 运行 `test_context1_to_context2_multisample.mjs` 与 `npm run lint`；
  - 重新生成 `MSDS_Studio_7Phase_Workflow_Kit.zip`（包含 `translation-memory.json`）并推送代码与 OpenSpec 至 `origin/main`。
