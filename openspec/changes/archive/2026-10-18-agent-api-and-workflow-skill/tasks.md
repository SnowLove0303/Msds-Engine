# 任务清单：MSDS Agent 专用 API 体系与工作流技能 (Implementation Tasks)

- [x] 1. 规约与测试先行：创建 Agent API 端到端测试套件
  - [x] 1.1 编写 `web/tests/test_agent_api.mjs` 测试用例
  - [x] 1.2 覆盖 `POST /api/msds/import` 导入测试（文件路径加载、Section 列表返回）
  - [x] 1.3 覆盖 `GET /api/msds/recognition` 识别结果获取测试（结构化 16 章节、成分三列提取）
  - [x] 1.4 覆盖 `POST /api/msds/match` 智能匹配发起测试（四变体模板选择、清零与删行注入）
  - [x] 1.5 覆盖 `GET /api/msds/match-result` 结果获取测试（验证 `format=summary` 标签-值结构与 `format=markdown` 报告输出）

- [x] 2. 核心 API 控制器与会话管理实现 (`web/src/msds-api-controller.js`)
  - [x] 2.1 实现内存会话管理器 `SessionStore`（支持多会话隔离、文档引擎与匹配结果缓存）
  - [x] 2.2 实现 `handleImport`：支持本地文件路径解析并抽取 16 个章节
  - [x] 2.3 实现 `handleRecognition`：输出结构化事实清单与化学成分列表
  - [x] 2.4 实现 `handleMatch`：支持 CN/EN 冠志与国彩 4 类正式模板的匹配注入闭环
  - [x] 2.5 实现 `handleMatchResult`：提供 `summary`、`markdown`、`detailed` 三种模式的匹配结果输出

- [x] 3. 双模服务层接入：Vite 开发中间件与独立服务脚本
  - [x] 3.1 创建 `web/vite.config.js`，通过 `configureServer` 挂载 `/api/msds/*` REST 中间件，支持 5173 端口即开即用
  - [x] 3.2 创建独立 Node.js 服务脚本 `web/src/api-server.mjs`，支持无前端依赖的一键后台启动（默认端口 5174）
  - [x] 3.3 在 `web/package.json` 添加快捷启动脚本 `"api": "node src/api-server.mjs"`

- [x] 4. Agent 技能包构建 (`.agents/skills/msds-agent-api/`)
  - [x] 4.1 在工作区 `.agents/skills/msds-agent-api/SKILL.md` 中编写标准化技能说明
  - [x] 4.2 包含 API 规格契约、请求参数与响应格式说明
  - [x] 4.3 提供 Node.js、PowerShell、curl 快捷调用代码范例与 Agent 执行工作流 SOP
  - [x] 4.4 同步至全局技能目录 `C:\Users\52882\.gemini\config\skills\msds-agent-api/SKILL.md`，支持全局 Agent 无缝调用

- [x] 5. 全链路自动化验证与验收
  - [x] 5.1 运行 `web/tests/test_agent_api.mjs`，确保 API 四部曲 100% 通过
  - [x] 5.2 验证真实样本 `PU-2341E` 通过 API 导入并成功输出结构化标签-值结果
  - [x] 5.3 运行 `npm run test:smoke` 确保现有全套功能零回归
