# AGENTS.md

## Project (项目概述与技术基线)

- 项目定位: MSDS-Engine (化学品安全技术说明书智能处理引擎)，专为化学品安全技术说明书（MSDS / SDS）打造的高保真纯本地结构化识别、智能语义匹配规约、模板安全覆写工作台与 AI Agent REST API 驱动中枢；统一管理 8 格式交付物矩阵（4 DOCX + 4 PDF：冠志/国彩 × 中/英）。
- 开发语言与运行时: Node.js (>=18/20 LTS, 原生 ES Modules, `"type": "module"`), Python 3 辅助测试与比对。
- 前端技术栈: 原生 ES Modules, HTML5, CSS3, Vite 7, `docx-preview`。
- 后端与引擎技术栈: Node.js 原生 HTTP / Vite 中间件，`jszip` (3.10.1), `@xmldom/xmldom` (0.8.10), `jsdom` (26.0.0)。
- 数据与模板资产: 官方基准母版 Word DOCX（`web/public/templates/` 冠志/国彩 中/英，SHA-256 锁定防篡改），SQLite 缓存数据库（`web/data/msds_repo.db`）。
- 最高法定工程宪章: `PROJECT_CONSTITUTION.md`（定义 4 大模块核心定位、四大维护支柱、解决的关键问题与防特判不变量）。

## Operating Invariants (工程不变量与操作准则)

- 宪法级四大法定维护支柱: 以后核心维护与开发项严格锁定为 1. 编辑器本身能力；2. MCP与API；3. 全局规范与局部规范（用于审计）；4. Skill。核心维护唯一服务于让 Agent 真正正确真实使用 MSDS Engine 本身的能力并实现稳定产出，过程采用 SOP 操作标准化，赋予 Agent 编辑器的各大编辑能力。
- 最高防私改与防特判禁令: 任何任务必须严格遵循 `PROJECT_CONSTITUTION.md`。非用户明确允许，严禁直接为了单一目的（如应对特定型号或临时字段）而改造通用底层工具！严禁针对特定型号编写特判 `if (model === 'xxx')` 伪答案；严禁脱离通用几何通道直改 DOCX；必须坚持“ADD 逆向设计前置锁定契约”与“通用编辑器多态操作”。
- 确认交互式双门禁与 12 阶实时播报范式: 凡处理 MSDS 任务，必须严格遵循 `docs/MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.md` 与 `msds-studio` Skill v4.0 规程：
  1. 动工前必须经过【门禁 1: 交付矩阵与模板确认门禁】与【门禁 2: 方案、英译与调用报文确认门禁】，严格等待用户明确指令后方可动工；
  2. 执行过程绝对严禁长时间黑盒静默，必须实时输出 Phase 1~12 标准化状态播报；
  3. 交付必须附带 1:1 事实物理对账（`actionableGaps === 0`）与【两阶双轨机械+Agent敌手自审计双重最高门禁】全绿凭据。
- 最高强制性终审双重门禁 (机械确定性审计 + Agent 敌手认知自审计双钥匙)：全系统将终审审计的强制性拉升至最高法定级别，每次产出必须经过机械确定性审计与 Agent 敌手认知自审计双重门禁，缺一不可：
  1. **第一重：机械确定性硬阻断审计 (Step 1: Mechanical Deterministic Audit - 机器底座准入钥匙 1)**：
     - 运行双极双层全景深度审计 (`audit_bipolar_bilayer.mjs`) 与 G-01~G-46 终审门禁；
     - 刚性覆盖：8 份交付物完整存在且无杂件 (G-01)、时间戳同步差 $\le 300\text{s}$ (G-36)、英文说明行字号 9.50pt (G-37)、Section 9 标签垂直对齐 80.28pt (G-38)、OPC 媒体声明 100% 完备 (G-39)、避免末页纯空包含实质内容 (G-40)、英文媒体资产纯度无中文光栅 (G-41)、页脚几何安全无越界截断 (G-42)、中英文 16 章节 1:1 双向物理对账门禁 (G-43~G-46，加载 `audit_16_sections_bilingual_fidelity.mjs`)、表格外框实线/内框统一虚线、英文版零中文强门禁；
     - 充要条件：必须通过外部见证者 (`[Measured]`) 获取真实进程退出码 0，任何单项失败直接阻断发布。
  2. **第二重：Agent 敌手认知自审计 (Step 2: Agent Adversarial Self-Audit - 语义契约证伪钥匙 2)**：
     - **自审哲学：绝不能带着“证明自己没有错”的确认偏差走过场，而是必须预设产出物中必然存在隐藏错误，以敌手身份主动挑刺、去发现错误！**
     - 执行者必须物理深入产出物底层（解压 DOCX 读取 `word/document.xml` 与 PDF 文本块）：
       ① **16 章节逐句逐槽位 1:1 绝对对账**：对账中文与英文在 16 个章节中的每一行数据，严禁出现序号错位、行序倒挂或修饰语丢失；
       ② **零外生模板虚构穿透**：严禁带入源文件未提及的温度要求（Section 14.4）、食品酸碱隔离要求或旧危害分类（Section 2）；
       ③ **节标题层级穿透**：检查 Section 2.1/2.2/2.3、Section 1.1 等节标题是否被正文规则误伤导致缩进或字重丢失，必须顶格加粗；
       ④ **表格边框穿透**：检查全部表格的 `w:tblBorders` 与每个单元格的 `w:tcBorders`，确认外边界实线、内网格统一虚线，无局部实线断层或伪通；
       ⑤ **格式服从原文与零幽灵残留**：检查源文件无独立说明行时是否已彻底剔除模板冗余前言行与英文底模硬编码中文占位行；严禁凭空捏造未提及的毒理学端点；
       ⑥ **1:1 事实绝对守恒**：对账 TDS 实测参数与源文件理化特性，确认数值、公差、单位 100% 精准覆写且中英完全对称；
     - 交付时必须在报告中明确出具【Agent 敌手自审计反向挑刺核查清单】，逐项记录反向挑刺结果，严禁消极放行与形式主义打勾。
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

- 最高架构宪章与模块开发目的:
  - 权威来源: `PROJECT_CONSTITUTION.md`
- 交互确认式工作流与 9 阶实时播报规程:
  - 权威来源: `docs/MSDS_STUDIO_INTERACTIVE_SOP_WORKFLOW.md`
- 前端工作台与交互视图
  - 权威来源: `docs/FRONTEND.md`
  - 核心模块: `web/src/main.js`, `web/src/render-utils.js`, `web/src/styles.css`
- 核心引擎、OOXML 解析与 REST API
  - 权威来源: `docs/BACKEND.md`
  - 核心模块: `web/src/docx-engine.js`, `web/src/universal-editor-primitives.js`, `web/src/template-editor.js`, `web/src/recognition-engine.js`, `web/src/audit-planner.js`, `web/src/mcp-server.js`
- 系统架构、顶层拓扑与跨端契约
  - 权威来源: `ARCHITECTURE.md`
- 行为规格与业务流转 (OpenSpec)
  - 权威来源: `openspec/specs/` 与 `openspec/changes/`
- MSDS 业务单品生产与八格式导出 SOP
  - 权威来源: `.agents/skills/msds-studio/SKILL.md` 与 `.agents/skills/msds-agent-api/SKILL.md`

## Commands (高频指令集)

- 启动前端可视化工作台: `npm run dev --prefix web`（默认端口 5173，包含界面与内置 API 中间件）
- 启动独立无头 Agent API 服务: `npm run api --prefix web`（默认端口 5174）
- 启动原生 MCP 协议服务: `node web/src/mcp-server.js`
- 运行端到端全通道 MCP 集成测试: `node web/tests/test_mcp_full_channels.mjs`
- 运行五大拼图闭环集成测试: `node web/tests/test_five_puzzles_workflow.mjs`
- 运行万能编辑器严苛测试: `node web/tests/test_universal_editor.mjs`

## Completion Criteria (任务准出与交付标准)

- 差分测试通过: 变动影响范围内的自动化测试、端到端生成脚本全部以退出码 0 真实通过。
- 规范有效性通过: `ai-harness validate` 返回 0 errors；`openspec validate --all` 返回 0 failed。
- 事实对账零差距: `msds_compare_source_with_output` 返回 `actionableGaps === 0` 且字符保全比达标。
- 英文交付物门禁: 英文版交付物必须通过 `assertZeroChinese` 门禁（中文字符数严格为 0）。
- 排版与字体合规: 遵循 G-11 字体分立契约（标签加粗，数值常规体；西文字体显式注入 Times New Roman / Arial）。
- 源文件安全封存: 输入文件必须已生成对应的 `*_源文件留存.docx/pdf` 物理副本。
- 人工验收归口: 涉及 UI 界面调整与功能验收的变更，交付时附复现步骤与改动前后对照材料；人工确认前保留未勾选状态。

## Ask for Human Judgment When (人工介入条件)

- 产品配方或 GHS 危险性分类源数据存在矛盾、歧义或多解，无法从已有规格推导唯一合理的分类结论。
