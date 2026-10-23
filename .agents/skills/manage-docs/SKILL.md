---
name: manage-docs
description: 基于客观事实与严格的 Schema 契约，规范化编排、编写与校验仓库的 4 个核心受管文档 (AGENTS.md, ARCHITECTURE.md, docs/FRONTEND.md, docs/BACKEND.md) 或执行全仓文档引导（全程贯彻正向行动化表述准则）。
---
# 管理 Harness 核心受管文档 (Manage Harness Documents)

## 目标与定位

基于代码库中已验证的客观事实与严格的 Schema 契约，权威创建、更新与校验当前仓库的 4 个核心受管文档，或执行全仓文档基座引导。全流程严格遵循“正向行动化表述准则”，杜绝负向注意力陷阱。

---

## 运作模式

### 模式 1：单文档维护工作流 (Single Document Workflow)

当收到创建或更新某个具体文档的任务时（`AGENTS.md`、`ARCHITECTURE.md`、`docs/FRONTEND.md` 或 `docs/BACKEND.md`）：

1. **探查客观事实 (Inspect Evidence)**：
   - 运行 `AIharness inspect` 和 `AIharness status`。
   - 运行对应领域的上下文提取命令：
     - 若为 `ARCHITECTURE.md`：执行 `AIharness context architecture`
     - 若为 `docs/FRONTEND.md`：执行 `AIharness context frontend`
     - 若为 `docs/BACKEND.md`：执行 `AIharness context backend`
     - 若为 `AGENTS.md`：查阅工程清单文件 (package.json / pom.xml)、lockfile、`.agents/skills/` 与项目启动脚本。
2. **对齐领域矩阵与编写公理 (Consult Domain Matrix & Invariants)**：
   - 根据代码库中已验证的事实填充对应 Schema 的各个章节。
   - 所有服务、依赖包、目录与 API 接口必须严格源自已验证的仓库代码与清单文件。
   - 严格贯彻**“编写公理：正向行动化表述准则”**（使用正向行动与封闭作用域，杜绝“粉色大象”式负向禁令）。
3. **校验与修复循环 (Validate & Repair Loop)**：
   - 运行 `AIharness validate <file> --json`。
   - 修复所有报告的问题（缺失章节、标题层级错误、残留占位符、未验证路径等）。
   - 持续循环修复，直至文档状态完全变为 `valid`。

---

### 模式 2：全仓文档引导与审计工作流 (Full-Repo Bootstrap & Audit Workflow)

当收到全仓文档初始化引导或全量健康审计任务时：

1. **评估就绪状态 (Check Status)**：
   - 运行 `AIharness inspect` 并解析 `AIharness status --json`。
   - 识别所有 `applicability` 为 `required` 或 `recommended`、且 `readiness` 为 `pending` 或 `invalid` 的目标文档。
2. **拓扑顺序编写 (Sequential Authoring)**：
   - 严格按照系统拓扑顺序依次编写：
     1. `AGENTS.md`（仓库基线、操作纪律、高频指令、任务路由）
     2. `ARCHITECTURE.md`（系统拓扑、仓库边界、单向依赖流向）
     3. `docs/FRONTEND.md`（若检测到前端工程能力）
     4. `docs/BACKEND.md`（若检测到服务端/后台Worker/队列能力）
   - 对每一个适用的文档，均执行“模式 1：单文档维护工作流”，全程贯彻正向表述准则。
3. **最终校验门禁 (Final Gate)**：
   - 运行 `AIharness status`。
   - 确认所有适用的必需文档其状态均为 `readiness: valid`。

---

## 编写公理：正向行动化表述准则 (Affirmative & Actionable Directives)

在为任何受管文档起草、更新或提炼规则、红线、边界与不变量时：

### 核心机制：警惕“不要想粉色大象”的注意力陷阱
Transformer 自注意力机制（Self-Attention）是通过 Token 间的点积进行正向语义激活的，**没有原生的逻辑“非（NOT）”逻辑门**。
当文档中出现大量防御性否定词（`禁止 / 严禁 / 不得 / 绝不 / 不要`）时，反而会在模型的注意力矩阵中给这些被禁止的概念（如 `mock`、`过度审计`、`顺手清理`）注入高额权重；同时只定义了黑名单，留下了未定义的模糊动作空间。

### 四大正向重构原则
1. **以正向执行动作替代负向禁令 (Positive Prescriptions over Prohibitions)**：
   直接定义明确允许的标准动作与已验证的契约，而非罗列禁止行为。
2. **以封闭作用域代替发散式警告 (Explicit Closed Scopes)**：
   明确划定操作的合法边界与上限（如“差分作用域原则”、“保留现状 Leave-as-is”），自然排除界外行为。
3. **以确定性状态流转代替道德说教 (Deterministic State Transitions)**：
   遇到周边报错、未知依赖或受阻状态时，给出清晰的 `if-then` 下一步动作（Next Step），避免模型悬空。
4. **以客观充要凭证代替禁止虚假宣称 (Objective Completion Triad)**：
   明确宣称完成的客观凭证（状态干净 + 退出码为 0 + 日志凭证），让 Agent 可机械化对齐自检。

### 对照参考矩阵 (Reference Comparison Matrix)
| 避免使用的负向禁令 (Negative Prohibition) | 推荐的正向行动表述 (Affirmative & Actionable) |
| :--- | :--- |
| ❌ 严禁发起全仓扫描，禁止过度审计 | 💡 **差分作用域原则**：验证行为严格局限于 `git diff` 变动文件及其直接引用链路。 |
| ❌ 检测到历史遗留警告，严禁顺手修复 | 💡 **最小因果集与保留现状**：代码变动限定于目标所需最小因果集；既有警告**保留现状（Leave as-is）**。 |
| ❌ 严禁使用 mock 兜底或启发式绕道 | 💡 **根因溯源与真实契约**：指明确切异常抛出点并修复；依赖真实环境与既有契约全绿通过。 |
| ❌ 严禁跨模块私自穿透数据库 Mapper | 💡 **垂直能力自治**：模块间通信统一通过公开 Service 接口或领域事件交互。 |
| ❌ 严禁在存在报错时假装完成 | 💡 **交付充要凭证**：差分构建通过 + 针对性单测全绿 + 交付说明附带执行命令与日志证据。 |

---

## 领域路由与编写矩阵 (Domain Routing & Authoring Matrix)

### 1. AGENTS.md
- **核心定位**：交互式编码的唯一入口、执行纪律、高频指令、任务路由与人工介入条件。
- **必需章节**：
  1. `Project` (项目概述与技术基线)
  2. `Operating Invariants` (工程不变量与操作准则)
  3. `Task Routing` (任务路由与事实来源)
  4. `Commands` (高频指令集)
  5. `Completion Criteria` (任务准出与交付标准)
  6. `Ask for Human Judgment When` (人工介入条件，必须提供三段式提问标准模板)
- **核心不变量**：差分作用域验证、最小因果集与保留现状、事实符号锚定、客观交付三要素、结构化人工介入提问。

### 2. ARCHITECTURE.md
- **核心定位**：系统级全局拓扑骨架、仓库边界、依赖流向与通信契约。
- **必需章节**：
  1. `System Topology & Overview` (系统全局拓扑与职责边界)
  2. `Repository Boundaries` (顶层资产与仓库边界)
  3. `Dependency Flow & Architecture Invariants` (单向依赖流向与架构铁律)
  4. `Cross-Boundary Contracts` (跨端通信契约与协议规范)
  5. `Shared Data Architecture` (全局数据模型与多租户隔离原则)
  6. `Architectural Decisions & Evolution` (核心架构决策与演进指引)
- **条件性子章节**：当检测到后端能力（`server_api`, `background_jobs`, `queue`）时，在第 2 节 `Repository Boundaries` 下必须包含：
  - `### Backend Structure`（格式为 `- path/ — 职责说明` 的已验证目录列表）
  - `#### Dependency Boundaries`（明确允许的单向依赖流动方向）

### 3. docs/FRONTEND.md
- **核心定位**：前端实现规范、样式系统所有权分工、状态分类与交互反馈。
- **必需章节**：
  1. `Baseline & Tech Stack` (技术栈基线与严格模式)
  2. `Source Structure & Ownership` (源码分层与所有权边界)
  3. `UI System & Styling Ownership` (组件库与样式所有权分工)
  4. `State Classification & Data Fetching` (5类状态划分与远端缓存)
  5. `Routing & Data Lifecycle` (路由架构与数据生命周期)
  6. `Interactive States & Feedback` (异步状态与统一交互反馈)
  7. `Frontend Invariants & Verification` (前端架构不变量与验证准出)

### 4. docs/BACKEND.md
- **核心定位**：后端垂直能力分包、环境配置隔离、持久化多租户、并发可靠性。
- **必需章节**：
  1. `Baseline & Runtime` (运行时基线与工程管理)
  2. `Package & Layering Boundaries` (包结构垂直分层与边界)
  3. `Configuration & Security Operations` (配置隔离、安全与数据脱敏)
  4. `Persistence & Data Isolation` (数据持久化与多租户隔离)
  5. `Concurrency, Queue & Reliability` (并发流控、队列与可靠性)
  6. `Backend Invariants & Verification` (后端架构不变量与验证准出)

---

## 证据与准出不变量 (Evidence & Completion Invariants)

1. **事实符号锚定 (Evidence-Grounded Referencing)**：文档中引用的每一个路径、命令、包名与框架版本，必须直接映射到代码库中已验证的真实证据。
2. **清除所有占位符 (Replace All Placeholders)**：模板中包含 `harness:placeholder` 的初始注释块必须被完全替换为已核验的正式内容。
3. **确定性校验门禁 (Deterministic Verification Gate)**：当且仅当运行 `AIharness validate <file> --json` 报告 0 错误且所有占位符已清除时，方可标记文档为已完成（valid）。
