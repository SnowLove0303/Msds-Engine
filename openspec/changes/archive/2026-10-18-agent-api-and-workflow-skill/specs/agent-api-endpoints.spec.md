# 规范契约：MSDS Agent 专用 API 端点规约 (Agent API Endpoints Specification)

## 1. 通用 HTTP 交互契约
- **SHALL**: API 服务根路径必须挂载于 `/api/msds`；
- **SHALL**: 所有 API 响应必须采用标准 JSON Envelope 结构，必须包含布尔值 `success`；成功时包含 `data`，失败时必须包含 `error.message` 与 `error.code`；
- **SHALL**: 服务支持本地跨域（CORS 标头设为 `*`，允许 `GET, POST, OPTIONS`，允许 `Content-Type`）。

## 2. 核心端点契约 (Endpoints Contract)

### 2.1 导入端点 (`POST /api/msds/import`)
- **SHALL**: 支持接收 JSON Body `{ filePath: string, sessionId?: string }`；
- **SHALL**: 能够校验传入文件是否存在，自动调用 `loadDocx` 并抽取 16 个章节；
- **SHALL**: 将解析会话存储在内存会话管理池中，供后续识别与匹配步骤使用。

### 2.2 识别结果端点 (`GET /api/msds/recognition`)
- **SHALL**: 接收可选查询参数 `sessionId`，未传时默认为 `'default'`；
- **SHALL**: 结构化返回该会话文档中识别到的所有 Section 列表、候选键值对（`candidates: [{ label, value }]`）以及第 3 章节的成分数组（`components: [{ name, cas, concentration }]`）。

### 2.3 智能匹配发起端点 (`POST /api/msds/match`)
- **SHALL**: 支持参数 `{ sessionId?: string, templateVariant?: string }`；
- **SHALL**: 支持模板枚举：`CN_GUANZHI`（默认）、`EN_GUANZHI`、`CN_GUOCAI`、`EN_GUOCAI`；
- **SHALL**: 执行完整的零幽灵残留清零、无值项物理删行、加粗结构只读保护与精准槽位写入闭环；
- **SHALL**: 返回匹配统计信息（`injectedCount`, `prunedCount`, `matchedFields` 等）。

### 2.4 智能匹配结果获取端点 (`GET /api/msds/match-result`)
- **SHALL**: 支持 `format` 查询参数（`summary`、`markdown`、`detailed`）；
- **SHALL**: 当 `format=summary` 时，返回结构化的 16 个 Section 标签与值列表（`{ sectionNumber, title, rows: [{ label, value, status }] }`）；
- **SHALL**: 当 `format=markdown` 时，直接返回整理好的全套 Markdown 表格文本，方便 Agent 一键向用户汇报；
- **SHALL**: 准确反映无值删行后的连贯排号与真实填入数据。

## 3. Agent 技能契约 (Skill Contract)
- **SHALL**: 在 `.agents/skills/msds-agent-api/SKILL.md` 中提供标准的 Antigravity 技能定义；
- **SHALL**: 包含完整的 4 步调用流程指南、入参/出参 Schema、以及 PowerShell 和 Node.js 调用脚本范例。
