# Capability Spec: 工程基础设施加固与契约对齐 (engine-infrastructure-hardening)

## 1. 业务定义与背景

为确保 MSDS-Engine 具备工业化可交付性，彻底解决 Docker 容器在生产环境中由于运行时版本不匹配导致崩溃、开发依赖被剔除引发缺少模块死锁、Agent API 导入响应体与 SOP 契约脱节导致自动化测试报错等核心缺陷，特建立本工程加固规范。

---

## 2. 行为要求与技术契约

### Requirement 1: Docker 生产环境运行时与依赖加固
1. **Node.js 运行时基线**：
   - 生产镜像与开发镜像必须使用 `node:22-alpine` 或更高版本（`node:24-alpine`）；
   - 确保原生 V8 运行时支持 `node:sqlite`（`DatabaseSync`），杜绝任何缺少本地 SQLite 模块导致的容器退出。
2. **生产构建依赖安全保留**：
   - 在 `web/package.json` 中，必须将 `jsdom` 列入 `dependencies`（核心生产依赖），严禁置于 `devDependencies`；
   - 确保执行 `npm install --omit=dev` 时，`jsdom` 与 `jszip`、`docx-preview` 一同被完整安装；
   - 移除无用的 `@xmldom/xmldom` 冗余依赖。
3. **数据持久化挂载声明**：
   - `docker-compose.yml` 必须显式配置数据卷映射：`- ./web/data:/app/web/data`，保障批次数据库（`msds_repo.db`）与文档快照在容器生命周期内持久安全。

### Requirement 2: Agent REST API 契约对齐
1. **`POST /api/msds/import` 响应格式**：
   - 无论在独立无头模式（`api-server.mjs`）还是 Vite 开发中间件模式下，导入接口成功后必须返回统一契约：
   ```json
   {
     "success": true,
     "sessionId": "<UUID>",
     "fileName": "<FILENAME>",
     "templateVariant": "CN_GUANZHI",
     "message": "MSDS 源文档导入并抽取成功",
     "data": {
       "sectionCount": 16,
       "sections": [
         { "sectionIndex": 1, "title": "1. 化学品及企业标识", "rowCount": 10 },
         "..."
       ],
       "fileName": "<FILENAME>",
       "templateVariant": "CN_GUANZHI"
     }
   }
   ```
2. **端到端测试断言同步**：
   - 确保 `web/tests/test_agent_api.mjs` 能够稳定提取 `importJson.data.sectionCount` 并断言为 16；
   - 接口错误响应必须返回标准 HTTP 400/500 及明确的 JSON 错误体，杜绝静默失败。

### Requirement 3: 架构异味解耦与启动指令齐备
1. **产品特定逻辑解耦**：
   - 核心匹配器 `smart-matching.js` 禁止包含任何硬编码型号特定改写代码（如 `PU-1002`）；
   - 所有特殊产品名、成分类别映射统一收敛至外部可配置的别名字典中。
2. **根目录启动脚本统一**：
   - 根目录 `package.json` 的 `scripts` 必须提供完整的快捷指令：
     - `"dev"`: 前端交互工作台开发服务
     - `"api"`: 独立无头 Agent API 服务 (`npm run api --prefix web`)
     - `"build"`: 前端生产静态构建
     - `"start"`: 生产无头全功能服务

---

## 3. 验收标准

1. **Docker 构建验收**：
   - 在支持 Docker 的环境下运行 `docker compose build`，构建成功；启动容器后通过 `curl http://127.0.0.1:5174/api/msds/health` 能够返回 `{ status: "ok" }`。
2. **API 自动化测试验收**：
   - 在本地终端执行 `node web/tests/test_agent_api.mjs`，全量测试用例（健康检查、导入、抽取结果验证、智能匹配调用）无任何抛错，测试通过。
