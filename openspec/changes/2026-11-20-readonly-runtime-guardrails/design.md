# Design: 运行期只读防篡改与零临时脚本门禁

1. **`verifyReadonlyEngineGuard(targetDir)`**（位于 `run_standard_production.mjs`）：
   - 若 `REPO_ROOT/.git` 存在：检查 `git status --porcelain web/src web/scripts web/templates 标准化流程`，排除 `web/src/translation-memory.json`（合法自动沉淀库）与 `output/`；若有任何源码修改或未追踪 `.mjs/.js/.py` 临时脚本，立即报错 `exit(1)`（开发期调试可显式传 `--devAllowDirty`）。
   - 检查 `targetDir` 内是否存在 `.mjs/.js/.py/.ps1/.sh` 临时脚本，发现即阻断 `exit(1)`。
2. **规范文档固化**：在 `SKILL.md`（七流程包 + 全局）与 `README_FOR_AGENT.md` 显式写明 Agent 唯二职责与硬退出原则。
