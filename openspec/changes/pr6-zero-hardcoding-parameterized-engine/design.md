# Design: 拓扑参数化全链路驱动

1. **拓扑识别 = 提取参数 (`recognizeTemplateTopology`)**：
   - 从 `w:sectPr`、`w:tbl`、`w:pPr/w:ind`、`w:rPr` 提取 `sections[]`（任意数量 $N$）与 `typographyProfile`（`roles` + `ruler: { tierA, tierB }`）。
2. **编辑器 = 按参数执行 (`template-editor.js` / `universal-editor-primitives.js`)**：
   - 模板与企业预设从相对路径与 `presets/company_presets.json` 动态加载；
   - `applyAdaptiveRuler` 与 `applyGlobalTypographyProjection` 优先读取 `session.typographyProfile`。
3. **机械审计 = 参数化核销 (`staged-mechanical-audit.js`)**：
   - 通用不变量（血缘链、OPC 完好、语种纯度、数字守恒）无条件执行；
   - 交付物清单、章节数与标尺坐标从 `expectedDeliverables` 与 `templateProfile` 读取。
