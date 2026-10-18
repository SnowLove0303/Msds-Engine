# Proposal: MSDS-Engine 全景接管加固与 Section 9 源实证存在性门控规约

## Why (背景与问题定界)

依据接管指挥部与 SubAgent 专家编组（架构与工程管道审计师、合规规则与质检审计师）对 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine` 的全景代码审查与业务规则穿透，系统在具备纯本地高保真 OOXML 解析、16 章节槽位匹配与 8 格式矩阵交付优势的同时，暴露出严重的工程底座缺陷与核心业务规约冲突：

### 1. 核心业务规约终局裁决 (P0 业务规则)
- **历史冲突根源**：顶层体系报告（v3.29）要求“未测纯空项必须整行物理删除”，而最新审阅批注（2026-10-09 #10）及部分测试用例则要求“严禁删行，保留全 24 行法定槽位并统一填入‘无数据资料。’”，导致引擎内部规则分裂、测试断言反复修改；
- **用户最新核心指令（铁律裁决）**：
  > **Section 9 最新要求以源文件内容为主：对源文件有提到的，即便是无数据资料也应给予保留；而如果是模板中有但是源文件没有的，就不应该保留（必须物理删行剪枝）。**
- **业务意义**：确立**“源实证存在性门控（Source-Grounded Existence Filter）”**，既杜绝臆造未测模板孤儿行，又完整保留源作者明确陈述的“未测定/无数据资料”法定合规结论，杜绝信息丢失。

### 2. 生产镜像与工程底座致命缺陷 (P0 级工程缺陷)
- **ENG-01 (`node:sqlite` 运行时不兼容)**：`Dockerfile` 使用 `node:20-alpine`，但核心持久化模块 `web/src/msds-db.js` 深度依赖 Node.js 原生内置模块 `node:sqlite`（`DatabaseSync`）。该特性于 **Node.js v22.5.0** 引入，导致生产 Docker 镜像启动即抛出 `Cannot find package 'node:sqlite'` 崩溃；
- **ENG-02 (`jsdom` 生产依赖缺失)**：`web/package.json` 将 `jsdom` 声明在 `devDependencies`，而 `Dockerfile` 生产构建阶段执行 `npm install --omit=dev`。由于 `msds-api-controller.js` 核心逻辑直接依赖 `JSDOM`，导致生产镜像启动时抛出 `Cannot find module 'jsdom'` 致命异常。

### 3. Agent API 契约脱节与测试断言报错 (P1 级接口缺陷)
- **ENG-03 (API Import 契约不同步)**：`POST /api/msds/import` 响应体仅返回 `{ success, sessionId, fileName }`，遗漏了 `data.sectionCount` 与 `data.sections`。而 `.agents/skills/msds-agent-api/SKILL.md` 与自动化测试 `web/tests/test_agent_api.mjs` 硬性断言 `data.sectionCount === 16`，导致接口测试直接触发 `AssertionError: 400 !== 200`。

### 4. 数据卷持久化缺失与外部路径耦合 (P1 级运维缺陷)
- **ENG-04 (容器持久化丢失)**：`docker-compose.yml` 未声明挂载卷，容器重建会导致 `web/data` 下的 SQLite 库（`msds_repo.db`）与历史缓存 DOCX 全部丢失；
- **ENG-05 (测试套件强耦合外部路径)**：15 个回归测试硬编码 `F:/MSDS覆写/...` 宿主机绝对路径，脱离原机器后报 `ENOENT` 失败；
- **RULE-02 (特定产品硬编码补丁)**：`smart-matching.js` 第 2994 行存在 `if (/PU-1002/)` 改写组分名称的特殊代码，破坏了通用引擎解耦原则。

---

## What Changes (变更方案与规范)

### 1. Section 9 源实证存在性门控规约（Source-Grounded Existence Rule）
- **判定核心**：在智能匹配与模板覆写注入时，建立理化特性“源实证提及清单（Source Mention List）”：
  1. **保留条件（Mentioned in Source）**：凡源文档文本中存在对应理化参数词条（无论是明确数值、范围值，还是“无数据资料”、“未测定”、“—”、“无资料”），**100% 予以保留**；若无具体数值，规范填充为合规用语 `无数据资料。`；
  2. **删行条件（Omitted in Source）**：凡模板内存在但源文档完全未提及/未收录的理化特性槽位，判定为 `PRUNED`，**一律执行自底向上物理安全删行（`deleteRow`）**；
  3. **删行后重排**：删行定稿后，触发 `renumberRecord` 重新计算 `9.1, 9.2...` 连续编号，杜绝断号与空标签残留。

### 2. 生产 Dockerfile 与运行时环境升级 (P0)
- `Dockerfile` 基础镜像由 `node:20-alpine` 升级为 `node:22-alpine`（或 `node:24-alpine`），原生支持 `node:sqlite`；
- 在 `web/package.json` 中将 `jsdom` 移至 `dependencies`，确保 `--omit=dev` 后后端 XML 解析引擎完好可用；移除冗余 `@xmldom/xmldom`。

### 3. Agent API 控制器契约补齐 (P1)
- 修改 `msds-api-controller.js` 中的 `POST /api/msds/import`，在响应中注入标准 `data: { sectionCount, sections, fileName, templateVariant }` 结构，与 Agent API SOP 文档保持 100% 契约一致。

### 4. 数据持久化与架构解耦 (P1)
- `docker-compose.yml` 显式增加 `./web/data:/app/web/data` 挂载卷；
- 将 `smart-matching.js` 中的 `PU-1002` 组分硬编码改写解耦，迁移至标准化别名映射词典；
- 测试套件路径解耦，优先使用工程内自带的样本夹具（`web/data/docs/` / `scratch/`）。

---

## Capabilities

### New Capabilities
- `section9-source-grounded-pruning`: Section 9 理化特性源实证存在性门控机制，严格以源文件内容为主，保留源有提及项（含无数据项），安全删除模板多余无源项并自动重排。
- `engine-infrastructure-hardening`: Dockerfile Node 22+ 镜像升级、生产依赖纠偏、持久化数据卷挂载、API 导入契约对齐与架构解耦。

---

## Impact

- **受影响文件**：
  - `Dockerfile`、`docker-compose.yml`
  - `web/package.json`
  - `web/src/smart-matching.js`
  - `web/src/msds-api-controller.js`
  - `web/tests/test_agent_api.mjs`
  - `openspec/specs/`
- **业务价值**：彻底消除生产镜像崩溃隐患与 API 测试报错，使 Section 9 的理化特性处理与用户最新权威裁决 100% 吻合，达到工业化稳健交付标准。
