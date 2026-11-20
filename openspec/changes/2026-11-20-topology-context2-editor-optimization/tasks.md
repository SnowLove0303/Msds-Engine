# Tasks: 拓扑结构 + Context 2 + 编辑器输入规范与剪枝全链路优化

- [x] **Task 1: Context 2 输入规范与文本归一化强化 (`web/src/context-governor.js`)（REQ-C2-01, REQ-C2-02）**
  - 实现英文标点半角化（消除英文后全角冒号 `：`）、全角符号转换（`≧`/`≦` -> `≥`/`≤`）、数值与单位空格隔离（`0.4 mm`, `480 min`）、中文参数末尾多余西文句点清洗；
  - 验证命令：`npm run lint`（退出码 0）。

- [x] **Task 2: Preset 全拓扑占位支持与父级题头匹配锁定 (`web/src/topology-matcher.js`, `web/src/template-editor.js`)（REQ-PRE-01, REQ-PRE-02）**
  - 扩展 `applyCompanyPreset` 支持 `sectionSlots` 全拓扑占位；
  - 在 `compileTopologyOps` 中保护 Preset 独占槽位（S1.3 等全拓扑占位）不被源文档覆写，彻底根治国彩版串流“广州冠志”；
  - 保护父级分类题头（如 `Hand protection:` / `手部防护：`）在匹配阶段不被误判删除；
  - 验证命令：`npm run lint`（退出码 0）。

- [x] **Task 3: 编辑器智能安全剪枝与拓扑驱动排版几何硬锁 (`web/src/template-editor.js`, `web/src/mcp-server.js`, `run_standard_production.mjs`)（REQ-EDT-PRUNE-01~02, REQ-TOPO-LOCK-01~02）**
  - `inspectTemplateSchema` 提取模板 `typographyProfile`；
  - 新增 `pruneRowsSafely` 安全剪枝原语（识别并保护父级分类题头）；
  - 新增 `applyTopologyTypographyLock` 依据 `typographyProfile` 强制锁定全篇字阶（CN `sz=24` / EN `sz=19`）、结构性子题头加粗（S8.1、手部防护、S15 子题头）、全章节编号标签单 `<w:tab/>` + Tier A(420)/Tier B(560) 标尺对齐、`Recommendation:` `420 dxa` 左缩进；
  - 验证命令：`npm run lint`（退出码 0）+ `check_pdf_golden_anchor_alignment.py` 全绿。

- [x] **Task 4: 审计模块去硬编码校准与 `PA-4840` 全流程实测入库验证（REQ-AUD-CAL-01）**
  - 清理 `run_master_msds_audit.mjs` 与 `lint_source_grounding.mjs` 中过时硬编码断言（S1 9行 / S13 4行 / S14 禁止 ADG 及 8/9 行），校准非危英文正则；
  - 完整执行 `PA-4840` 全流程生产与三套审计，验证中央主审计（170项）、双极双层（165项）、角色审计（0 CRITICAL / 0 SEQ_NO_TAB）全绿，数据库记录入库并在 `query_exec_logs.mjs` 呈现 `SUCCESS`；
  - 重打 `MSDS_Studio_7Phase_Workflow_Kit.zip` 并推送代码与 OpenSpec 至 `origin/main`。
