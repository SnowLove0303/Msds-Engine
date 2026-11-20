# Proposal: 拓扑结构 + Context 2 + 编辑器输入规范与剪枝全链路优化

## 1. 背景与动机
基于用户执行记录数据库暴露出的 `PA-4840` 22 项 FAIL 与 106 项 WARNING，本变更围绕“**拓扑结构确定基准、Preset 全拓扑占位、Context 2 输入规范、编辑器智能剪枝与几何硬锁、审计去硬编码**”五大方向实施系统性架构优化。

## 2. 1:1 需求物理对账矩阵 (RTM)
- **RTM-01**: 预设 (Preset) 支持对全 16 章节拓扑结构下的任意占位内容进行配置与覆盖，且受 Preset 占位的槽位在拓扑匹配阶段具有最高锁定权，彻底杜绝源文档信息覆盖预设（根治 `#109` 国彩串流冠志）。
- **RTM-02**: Context 2 治理与输入规范强化：英文标点半角化（消除全角冒号 `#108`）、比较符号规范化（`≧` -> `≥` `#116`）、数值与单位空格隔离（`0.4 mm` `#117`）、参数末尾多余句点清洗（`min.` `#118`）。
- **RTM-03**: 编辑器智能安全剪枝：将剪枝逻辑沉淀强化为编辑器原生能力，保护父级分类题头（如 `Hand protection:` `#112`）在存在有效子项时不被孤立删行。
- **RTM-04**: 拓扑识别驱动的编辑器排版几何硬锁：在 `inspectTemplateSchema` 中从当前目标模板提取 `typographyProfile`（字体、字阶、加粗、标尺缩进、单 `<w:tab/>` 规范），由编辑器在写入与保存阶段依据该拓扑对象强制锁定（消除 `#111, #113~#115, #119~#121, #123~#126, #128` 及 `104` 条 `SEQ_NO_TAB`）。
- **RTM-05**: 审计模块去硬编码与真值校准：清理 `run_master_msds_audit.mjs` 与 `lint_source_grounding.mjs` 中与“纯源继承”冲突的过时硬编码断言（`#110, #122, #127, #129`）。

## 3. 法定双清单
### 拟变范围清单
1. `[Context 2]` `web/src/context-governor.js`：增加文本归一化管道（英文全角冒号转半角、`≧/≦` 转 `≥/≤`、数值单位空格隔离、结尾多余句点清洗）。
2. `[Topology & Preset]` `web/src/topology-matcher.js`：支持从 `templateSchema.typographyProfile` 传递拓扑样式契约；支持 Preset 全拓扑占位槽位锁定（跳过源文档对 Preset 占位槽位的覆写，并在最后或锁定阶段保障 Preset 优先级）。
3. `[Editor & Schema]` `web/src/template-editor.js`、`web/src/docx-engine.js`、`web/src/universal-editor-primitives.js`：
   - `inspectTemplateSchema` 自动提取模板 `typographyProfile`（CN/EN 字体字阶、加粗特征、Tier A/B 标尺）；
   - `applyCompanyPreset` 支持 `sectionSlots` 全拓扑占位注入（向后兼容现有 `company` 字段）；
   - 新增/强化编辑器安全剪枝原语 `pruneRowsSafely`（保护父级题头不被误删）；
   - 强化编辑器排版几何硬锁（依据 `typographyProfile` 全篇统一字号、保留/重塑结构性子题头加粗、全章节编号标签单 `<w:tab/>` + 420/560 dxa 标尺对齐、`Recommendation:` 420 缩进）。
4. `[Audit Calibration]` `web/scripts/run_master_msds_audit.mjs`、`web/scripts/lint_source_grounding.mjs`：移除硬编码行数（S1 9行 / S13 4行 / S14 8-9行）与反源文 ADG 禁令，校准非危英文判定正则。

### 保持现状承诺清单
1. 绝对不修改 `web/src/user-exec-db.js` 与 `web/scripts/query_exec_logs.mjs` 数据库底座与安全隔离规则；
2. 绝对不修改 `web/data/msds_repo.db` 既有翻译记忆库与模板文件；
3. 绝对不绕过或降低 `npm run lint` 十大硬门禁与 `audit_bipolar_bilayer.mjs`（165 项）校验标准。
