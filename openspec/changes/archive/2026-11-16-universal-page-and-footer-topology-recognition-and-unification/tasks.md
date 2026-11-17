# Tasks: 通用页面格式与页脚拓扑强化识别及产出物页脚统一治理

> **执行纪律**：落实单焦点执行锁（`[-] lock`），同一时刻仅允许 1 个任务处于进行中，测通后方可推进下一项；源码修改必须触发 `vscode-review:review_diff_in_vscode`；任务打勾充要条件为测试套件退出码 0 与零错误零警告。

---

## 任务执行清单 (Atomic Tasks Ledger)

- [x] **Task 1: 强化通用模板拓扑识别层 (REQ-TOPO-01 & REQ-GEN-03)**
  - **因果角色**: `[Root Source]`
  - **当前状态**: `[COMPLETED]`
  - **实现目标**:
    1. 在 `web/src/template-topology-recognizer.js` 中新增 `recognizePageFormatting(doc)`，提取 `w:sectPr` 纸张宽高、边距标尺（top/bottom/left/right/header/footer）、行网格；
    2. 新增 `recognizeFooterTopology(zip, doc)`，自动解析 `document.xml.rels` 与 `w:footerReference`，动态扫描正文生效页脚；
    3. 自适应探测 `slots.revisionDate`、`slots.entityModel`、`slots.pageNumber` 的容器类型、相对坐标与原生样式参数；
    4. 扩充 `recognizeTemplateTopology` 返回值，挂载 `pageFormat` 与 `footerTopology`，保证零硬编码与多模板兼容性。
  - **实测验证命令**:
    `node -e "import('./web/src/template-topology-recognizer.js').then(async m => { const t = await m.recognizeTemplateTopology('覆写模块/内嵌模板/正式模板_MSDS_CN_冠志(1).docx'); console.log(JSON.stringify({ page: t.pageFormat, footer: t.footerTopology }, null, 2)); })"`

- [x] **Task 2: 覆写引擎页脚治理与插槽动态注入解耦 (REQ-FOOTER-02 & REQ-FLEX-04)**
  - **因果角色**: `[State Transition]`
  - **当前状态**: `[COMPLETED]`
  - **实现目标**:
    1. 在 `web/src/docx-engine.js` 中重构 `extractHeaderFooterData` 与 `updateHeaderFooterData`；
    2. 页脚数据提取与更新优先基于 `footerTopology` 插槽蓝图进行寻址与注入，替代死硬编码的 `rows[0].cells[1]`；
    3. 彻底清洗日期字符串：剔除前缀残留 `P` 字符及非标空格（如 `\u2005`），规范化为中英文标准格式；
    4. 企业主体名称严格读取当前生效的主体预设（Preset），型号读取源文件事实，剥离冠志/国彩名称硬编码；
    5. 严格继承母版插槽原生字号（9pt）、颜色（#7F7F7F）与对齐方式。
  - **实测验证命令**:
    `node web/tests/test_universal_page_and_footer_topology.mjs`

- [x] **Task 3: 全局回归测试与真实交付物页脚法医全检 (REQ-GEN-03 & REQ-FOOTER-02)**
  - **因果角色**: `[Verification Witness]`
  - **当前状态**: `[COMPLETED]`
  - **实现目标**:
    1. 编写专用回归测试 `web/tests/test_universal_page_and_footer_topology.mjs`；
    2. 针对中文模板、英文模板及自定义母版进行拓扑识别断言验证；
    3. 验证生成样本文档页脚：断言无 "P" 前缀残留、无异形空格、主体与预设一致、日期格式严谨对账；
    4. 确保全工程无退化，运行全量主回归测试。
  - **实测验证命令**:
    `node web/tests/test_universal_page_and_footer_topology.mjs`
