# Tasks: 模板对齐拓扑识别、执行与机械审计

- [ ] **T-01**: 更新 `web/src/template-editor.js` 的 `inspectTemplateSchema`，提取各行/单元格 `jc`、`vAlign` 及行级 `alignmentPolicy`（覆盖多列数据表、2列键值行、通栏说明行）。
  - *验证命令*: `node web/scripts/msds_mcp_gateway.mjs --tool=msds_get_template_schema --template=CN_Guanzhi`（确认输出包含 `alignmentPolicy` 与单元格 `jc`/`vAlign`）
- [ ] **T-02**: 更新 `web/src/template-editor.js` 的 `formatSection3GridCenter` 与 `applyTopologyTypographyLock`，对 Section 3 组分表与 Section 8 控制参数物质表（及所有 `jc="center"` 单元格）强制清除 `w:ind` 并锁定 `jc="center"`、`vAlign="center"`。
  - *验证命令*: `node --check "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\template-editor.js"`
- [ ] **T-03**: 更新 `web/src/staged-mechanical-audit.js`，纳入 `P5_S3_ZERO_INDENT` 与 `P5_S8_OEL_ALIGNMENT` 硬校验，对全交付矩阵（CN/EN × 冠志/国彩）执行拦截。
  - *验证命令*: `node --check "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\staged-mechanical-audit.js"`
- [ ] **T-04**: 重跑 `HPU-7651`（使用已修复的 `topology-matcher.js` + `template-editor.js` + 官方 `web/src/pdf-converter.js`），并实测验证机械审计、`audit_topology_probe.py`（`centeredCellsWithIndent = []`）及含 S8 OEL 表的回归测试。
