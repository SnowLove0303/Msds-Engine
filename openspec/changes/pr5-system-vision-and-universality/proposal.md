# Proposal: PR-5 系统构建愿景显式注入与工作流去预设硬编码

## 背景与问题
1. 系统核心愿景（“不论源 MSDS 原来长什么样，通过手脚层的搭建让 Agent 将其内容结构化、标准化”）与通用性准则（防止硬编码、防止情景化）尚未作为工具运行时的一等公民在每次 Agent 调用时显式透传。
2. `标准化流程/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs` 中硬编码了 `targets = [CN_Guanzhi, CN_Guocai, EN_Guanzhi, EN_Guocai]`，违背了“企业预设与交付矩阵动态解耦”的通用性原则。

## 目标
1. 新增 `web/src/system-vision.js`，固化系统构建愿景与通用性反硬编码准则。
2. 在 `run_standard_production.mjs` 启动与 `--help` 时强制输出愿景与准则横幅；在 `web/src/mcp-server.js` 的 `initialize` `instructions` 及核心工具返回中注入 `_systemVision`。
3. 在 `run_standard_production.mjs` 中废除硬编码 `targets`，改为从 `presets/company_presets.json` 动态解析并支持 `--presets`、`--languages`、`--formats`、`--noPreset` 参数。
4. 在 `AGENTS.md`、`SKILL.md`、`README_FOR_AGENT.md` 顶部写入愿景与通用性准则，并在 `lint_code_invariants.mjs` 中增加防预设硬编码门禁。
