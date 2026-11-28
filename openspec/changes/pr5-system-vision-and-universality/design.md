# Design: PR-5 系统构建愿景显式注入与工作流去预设硬编码

## 1. 系统愿景单一真理源 (`web/src/system-vision.js`)
- 导出 `SYSTEM_VISION_CORE`、`UNIVERSALITY_PRINCIPLES`、`formatVisionBanner()`、`getMcpVisionInstructions()`。
- 确保 CLI Runner 与 MCP Server 共享同一份愿景文本，每次 Agent 调用工具或运行流水线均可直接读取。

## 2. 动态目标矩阵解析 (`resolveDynamicTargets`)
- 从 `presets/company_presets.json` 读取可用预设；
- 支持 `--presets=a,b`、`--languages=zh,en`、`--formats=docx,pdf`、`--noPreset`；
- 若未传参数，则基于当前注册表中的有效预设动态派生目标列表，不再在源码中写死任何企业名称。
