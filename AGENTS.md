# AGENTS.md

## Project (项目概述与技术基线)

- 项目定位: MSDS-Engine (化学品安全技术说明书智能处理引擎)，专为化学品安全技术说明书（MSDS / SDS）打造的高保真纯本地结构化识别、智能语义匹配规约、模板安全覆写工作台与 AI Agent REST API 驱动中枢；统一管理 8 格式交付物矩阵（4 DOCX + 4 PDF：冠志/国彩 × 中/英）。
- 开发语言与运行时: Node.js (>=18/20 LTS, 原生 ES Modules, `"type": "module"`), Python 3 辅助测试与比对。
- 前端技术栈: 原生 ES Modules, HTML5, CSS3, Vite 7, `docx-preview`。
- 后端与引擎技术栈: Node.js 原生 HTTP / Vite 中间件，`jszip` (3.10.1), `@xmldom/xmldom` (0.8.10), `jsdom` (26.0.0)。
- 数据与模板资产: 官方基准母版 Word DOCX（`web/public/templates/` 冠志/国彩 中/英，SHA-256 锁定防篡改），SQLite 缓存数据库（`web/data/msds_repo.db`）。

## Operating Invariants (工程不变量与操作准则)

- 源文件绝对无损保护: 任何导出或生成任务严禁直接原地覆盖同名物理源文件。执行前强制调用 `preserveOriginalFileBackup` 将输入源文件克隆为 `<原文件名>_源文件留存.docx/pdf` 并单向只读封存，永久保护源数据母本。
- MSDS Studio 唯一法定通道与直改 DOCX 禁令: 所有 MSDS 生产、装配、英译、预设派生与 8 格式导出任务，必须且仅能通过 MSDS Studio（REST API `/api/msds/*` 或工作台底座流水线 `web/run_pipeline.mjs` / `pipeline-engine.js`）执行；严格禁止任何 Agent 绕开 Studio 直接编写 ad-hoc 脚本（如使用 python-docx、原生 XML 修改或文件写入）直接操作 DOCX 文件。任何脱离 Studio 管道的直改行为一律视为非法并直接阻断。
- 规格落点先行: 任何写入型任务（新增或修改代码、文档、配置、脚本、数据产出）先确认规格落点；`openspec/specs/` 已有对应条目则以其为准，没有则先建 change 提案，规格未落地前不开始实现。
- 规格高于代码: 代码与 `openspec/specs/` 冲突时修代码而不改规格；确需改变行为时先在规格层发起变更，再调整实现。
- VS Code 协同检阅: 无论何时修改或创建代码文件，必须优先调用 `vscode-review` MCP 工具中的 `review_diff_in_vscode`，拉起原生 Diff 视图等待人工审核确认。
- 差分作用域验证: 验证行为严格局限于本次 `git diff` 变动的目标文件及其直接依赖链路。
- 最小因果集与保留现状: 改动严格限定于实现当前目标所需的最小因果集合；周边检测到的既有告警、代码坏味道保持原样，交由独立专项任务统一处理。
- 根因闭环与真实契约验证: 必须查明异常引发的核心代码行并做正向修复；修复必须让目标契约与主链路测试在真实环境中完整通过，严禁以绕过、屏蔽或降级告警收尾。
- 符号事实锚定: 所有调用的 API、依赖包、目录路径与架构事实，必须以仓库现存源码树或清单文件中的声明为唯一依据。
- 问题与解法沉淀: 每次任务闭环在交付总结中明确单列“遇到问题与解法”，并同步更新 `CHANGELOG.md`。
- 人工验收归口: 功能验收与 UI 界面调整以人工操作为准。AI 负责准备复现步骤、改动前后对照材料与验证命令并如实记录人工结论；人工确认之前对应任务保持未勾选。

## Task Routing (任务路由与事实来源)

- 前端工作台与交互视图
  - 权威来源: `docs/FRONTEND.md`
  - 核心模块: `web/src/main.js`, `web/src/render-utils.js`, `web/src/styles.css`
- 核心引擎、OOXML 解析与 REST API
  - 权威来源: `docs/BACKEND.md`
  - 核心模块: `web/src/docx-engine.js`, `web/src/smart-matching.js`, `web/src/pipeline-engine.js`, `web/src/msds-api-controller.js`, `web/src/api-server.mjs`
- 系统架构、顶层拓扑与跨端契约
  - 权威来源: `ARCHITECTURE.md`
- 行为规格与业务流转 (OpenSpec)
  - 权威来源: `openspec/specs/` 与 `openspec/changes/`
- MSDS 业务单品生产与八格式导出 SOP
  - 权威来源: `.agents/skills/msds-studio/SKILL.md` 与 `.agents/skills/msds-agent-api/SKILL.md`

## Commands (高频指令集)

- 启动前端可视化工作台: `npm run dev --prefix web`（默认端口 5173，包含界面与内置 API 中间件）
- 启动独立无头 Agent API 服务: `npm run api --prefix web`（默认端口 5174）
- 运行冒烟与核心契约测试: `npm run test:smoke --prefix web`
- 运行 20 维智能匹配批注测试: `npm run test:annotations --prefix web`
- 校验 OpenSpec 规格合规性: `openspec validate --all`
- 校验 AI-Harness 受管基座文档: `ai-harness validate`

## Completion Criteria (任务准出与交付标准)

- 差分测试通过: 变动影响范围内的自动化测试、端到端生成脚本全部以退出码 0 真实通过。
- 规范有效性通过: `ai-harness validate` 返回 0 errors；`openspec validate --all` 返回 0 failed。
- 英文交付物门禁: 英文版交付物必须通过 `assertZeroChinese` 门禁（中文字符数严格为 0）。
- 排版与字体合规: 遵循 G-11 字体分立契约（标签加粗，数值常规体；西文字体显式注入 Times New Roman / Arial）。
- 源文件安全封存: 输入文件必须已生成对应的 `*_源文件留存.docx/pdf` 物理副本。
- 人工验收归口: 涉及 UI 界面调整与功能验收的变更，交付时附复现步骤与改动前后对照材料；人工确认前保留未勾选状态。

## Ask for Human Judgment When (人工介入条件)

- 产品配方或 GHS 危险性分类源数据存在矛盾、歧义或多解，无法从已有规格推导唯一合理的分类结论。
- 官方基准母版（`web/public/templates/`）需要更新、替换或解除 SHA-256 保护锁。
- 涉及客户特殊字段定制、免责声明法律文本变更或公司法定信息更新。
- 遇到上述情形时，主动暂停自发推演，按“现状阻碍/歧义根因”、“备选方案权衡”、“推荐路径与求证”三段式模板提请用户裁决。

## 核心业务与排版不可变量 (Core Overwrite & Typography Invariants)

在对 MSDS-Engine 进行重构、修改或新增功能时，以下规范享有系统最高法律效力，严禁违背或弱化：
1. **规格高于代码**：系统以《MSDS 中英文覆写排版与数据装配全景统一工业级规范 (v5.0.0)》为唯一法定真理源（SOT）；
2. **源码级防篡改封印 (@ANTIGRAVITY_INVARIANT_LOCK)**：凡标注有封印标记的代码块，享有最高只读豁免权，严禁擅自删改；
3. **值格纯左对齐铁律**：所有数据值格强制 `w:jc val="left"`，缩进清零，严禁出现两端对齐/分散对齐/居中；
4. **第一列文字垂线对齐**：常规章节 420 dxa，Section 11 565 dxa（11.10 防弹飞），无序号标签右缩进对齐，Section 8 Recommendation 顶格取消缩进；
5. **Section 13 4 行拓扑**：必须保留 2 行独立通栏说明行与 Disposal methods 双居中加粗；
6. **Section 2 分类保护**：规整双列行严禁误触发复合块解耦，禁止将核心 GHS 分类行作为无值行物理删除；
7. **全量 Gate 1~8 自动化质检门禁**：任务打勾必须以测试命令真实退出码 0 与质量断言全绿为充要依据（覆盖 Gate 8 数值常规体与 Calibri 字体纯净度断言）。
