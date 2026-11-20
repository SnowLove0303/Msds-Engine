# Spec: 纯源内容继承与匹配引擎双功能解耦契约

## REQ-01: 匹配引擎双功能解耦（默认纯拓扑，内容映射+数据库补齐默认关闭）
- `compileTopologyOps(context2, templateSchema, options)` SHALL 默认设置 `enableContentMapping: false`。
- 当 `enableContentMapping === false` 时，严禁对 Context 2 的任何文本执行 `A→B` 替换，也严禁调用 `msds-db.js` 补齐原文未载明的端点/参数。
- 仅当调用方显式传入 `enableContentMapping: true`（或 CLI `--enableContentMapping`）时，匹配引擎才在拓扑匹配基础上执行统一的内容映射与基准数据库补齐。

## REQ-02: 七流程 Phase 4~6 切换为 Context 2 + 拓扑匹配直驱编辑器
- `run_standard_production.mjs` SHALL 在 Phase 4~5 分别加载 `CN_Guanzhi`、`CN_Guocai`、`EN_Guanzhi`、`EN_Guocai` 模板 Schema，调用 `compileTopologyOps` 编译操作序列并写入 4 份标准 DOCX；在 Phase 6 调用 Windows WPS COM 将 4 份 DOCX 转为 4 份矢量 PDF。
- 仅在用户显式开启 `--enableContentMapping` 时启用映射/数据库补齐，否则 100% 继承 Context 2（源文件事实）。

## REQ-03: `PA-4840` 端到端重跑与双轨终审
- 重跑 `PA-4840` 后，`audit_topology_roles.mjs`、`audit_bipolar_bilayer.mjs`、`run_master_msds_audit.mjs` 与 Agent 介入审计 SHALL 全部通过且 S2/S13/S14 忠实继承源文件。
