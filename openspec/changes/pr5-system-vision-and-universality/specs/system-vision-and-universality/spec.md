# Spec: System Vision and Universality Principles

## ADDED Requirements

### Requirement: Runtime System Vision Delivery
Every invocation of `run_standard_production.mjs` and MCP `initialize` / discovery tools SHALL expose the core MSDS-Engine vision and anti-hardcoding universality principles from `web/src/system-vision.js`.

#### Scenario: CLI and MCP expose system vision
- **WHEN** an Agent runs `run_standard_production.mjs --help` or initializes `mcp-server.js`
- **THEN** the output includes the system vision ("不论源 MSDS 原来长什么样，通过手脚层让 Agent 将其内容结构化、标准化") and anti-hardcoding rules.

### Requirement: Dynamic Preset and Delivery Matrix Resolution
`run_standard_production.mjs` SHALL NOT hardcode specific company presets (e.g., `CN_Guanzhi`, `CN_Guocai`) in source code; instead, it SHALL dynamically resolve targets from `company_presets.json` and CLI flags (`--presets`, `--languages`, `--formats`, `--noPreset`).

#### Scenario: Custom preset selection without code changes
- **WHEN** `resolveDynamicTargets` is called with `--presets=CUSTOM_A --languages=en --formats=docx`
- **THEN** only `CUSTOM_A` English DOCX target is produced without requiring `CN_Guanzhi` or `CN_Guocai`.
