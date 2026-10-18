# 提案：MSDS Agent 专用 API 体系与工作流技能 (Agent API & Workflow Skill)

## 1. 变更背景 (Context)
目前 MSDS Studio 的核心解析（`docx-engine.js`）与智能匹配（`smart-matching.js`）已具备强大的识别、零幽灵残留清零、无值删行、加粗结构保护与高保真映射能力。
然而，当前的交互主要依赖于浏览器 Web 界面手动操作或直接运行本地测试脚本。外部 AI Agent（例如各类智能助手、自动化作业脚本、批处理流水线）无法通过标准化的 HTTP API  programmatic 方式直接与系统交互。
用户明确提出需求：
> “需要先开发一套API 调用体系给我以支持Agent能够通过API 发起导入msds，获取识别结果，发起智能匹配，获取智能匹配结果，并且要清晰明了以便于Agent能快速知晓结构化的匹配结果，立即着手开发，并将API 调用工作流做成技能给我”

## 2. 变更目标 (Objectives)
1. **轻量高效的 RESTful API 体系**：
   - 在本地系统（Vite 服务中间件及独立 Node 服务）上暴露标准化 API 端点，支持无跨域障碍的本地 HTTP 访问；
   - 核心端点包含：
     - `POST /api/msds/import`：导入源 MSDS 文件（支持本地文件绝对路径传参或直接内容上传），执行文档结构化抽取；
     - `GET /api/msds/recognition`：获取已导入文档的 16 个 Section 识别结果，输出结构化事实（字段列表、组分信息、原始记录）；
     - `POST /api/msds/match`：发起针对特定模板（CN冠志、EN冠志、CN国彩、EN国彩）的智能匹配，执行清零、删行、加粗保护与注入闭环；
     - `GET /api/msds/match-result`：获取结构化智能匹配结果（包含统计数据、每个 Section 的匹配字段、组件三列表格数据、以及供 Agent 快速阅读的“标签-值”精简摘要与 Markdown 表格模式）。
2. **清晰明了的结构化响应设计**：
   - JSON 响应采用统一 Envelope 规范（`success`, `data`, `meta`, `error`）；
   - 提供 Agent 友好的 `summary` 视图，以标准化的 `[{ section: 1, title: '...', items: [{ label: '...', value: '...', status: 'MATCHED' }] }]` 清晰输出 16 个 Section 的标签-值配对，让 Agent 能在 1 次调用中精准理解结果。
3. **构建可即插即用的 Agent 技能 (Workflow Skill)**：
   - 遵循 Antigravity Skill 标准体系，在工作区 `.agents/skills/msds-agent-api/` 及全局技能库中创建 `msds-agent-api` 技能；
   - 包含完整的 `SKILL.md`，提供：
     - 端点规格与入参/出参 Schema；
     - Node.js / PowerShell / curl 多语言调用脚本范例；
     - 4 步完整工作流（导入 -> 识别检查 -> 匹配发起 -> 结果分析）的 Agent 执行指引与最佳实践。
4. **自动化测试覆盖**：
   - 编写 `web/tests/test_agent_api.mjs`，端到端测试 API 导入、识别、匹配和结果获取全链路。

## 3. 影响范围 (Scope & Impact)
- **API 服务层**：新建 `web/src/api-server.mjs`，并配置 `web/vite.config.js` 挂载 Vite 开发中间件；
- **核心逻辑适配**：在 `web/src/` 中提供服务适配控制器 `web/src/msds-api-controller.js`，串联 `loadDocx`、`runSmartMatching`、`applyMatchResultToEditor`；
- **技能体系**：在 `.agents/skills/msds-agent-api/SKILL.md` 建立技能文件；
- **自动化测试**：`web/tests/test_agent_api.mjs`。
