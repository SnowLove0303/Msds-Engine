# Tasks: MSDS-Engine 全景接管加固与 Section 9 源实证门控规约

## 1. 容器与工程底座紧急止血 (P0)

- [ ] **1.1 升级 Dockerfile 运行时镜像** <!-- id: 1.1 -->
  - 将 `Dockerfile` 中的基础镜像从 `node:20-alpine` 升级为 `node:22-alpine`，确保原生内置支持 `node:sqlite`（Node >= 22.5.0）。
- [ ] **1.2 修复生产依赖分类 (jsdom)** <!-- id: 1.2 -->
  - 在 `web/package.json` 中将 `"jsdom"` 移入 `"dependencies"`，确保 `--omit=dev` 生产构建后服务端不缺失核心模块；
  - 移除冗余未使用的 `@xmldom/xmldom`。
- [ ] **1.3 补充容器数据持久化卷** <!-- id: 1.3 -->
  - 在 `docker-compose.yml` 中为服务添加 `./web/data:/app/web/data` 挂载卷，确保 SQLite 数据库与缓存文档持久化。

---

## 2. Agent API 控制器契约与接口测试修复 (P1)

- [ ] **2.1 补齐 `POST /api/msds/import` 响应契约** <!-- id: 2.1 -->
  - 修改 `web/src/msds-api-controller.js`，在导入成功返回体中注入 `data: { sectionCount, sections, fileName, templateVariant }`；
  - 与 `.agents/skills/msds-agent-api/SKILL.md` 的规范定义保持 100% 同步。
- [ ] **2.2 验证 Agent API 自动化测试** <!-- id: 2.2 -->
  - 执行 `node web/tests/test_agent_api.mjs`，消除 `AssertionError: 400 !== 200`，确保端到端测试全绿。

---

## 3. Section 9 源实证存在性门控规约落地 (P0)

- [ ] **3.1 梳理 Section 9 提取层源实证提及集合** <!-- id: 3.1 -->
  - 在 `web/src/smart-matching.js` 中建立 `source_mentioned_slots` 集合，精确收敛源文档中实际列出或陈述的所有理化特性条目。
- [ ] **3.2 重构 Section 9 行动作决策矩阵** <!-- id: 3.2 -->
  - 对源文档明确提及但值为未测/无数据的条目：判定为 `KEEP`，并在模板中规范填充 `无数据资料。`；
  - 对模板预设但源文档完全未提及的孤儿条目：判定为 `PRUNE`，执行自底向上物理安全删行（`deleteRow`）。
- [ ] **3.3 验证 Section 9 删行后自增连续重排** <!-- id: 3.3 -->
  - 确保模板注入完成后调用 `renumberRecord`，使存活行保持 `9.1, 9.2...` 连续编号，无重号与断号。
- [ ] **3.4 编写 Section 9 源实证门控专项单元测试** <!-- id: 3.4 -->
  - 编写并执行针对 Section 9 源提及项保留（含未测定）与无源项整行删除的自动化测试用例。

---

## 4. 架构异味治理与解耦 (P1)

- [ ] **4.1 拔除 `PU-1002` 硬编码补丁** <!-- id: 4.1 -->
  - 将 `smart-matching.js` 第 2994 行针对特定型号 `PU-1002` 组分名称的特殊改写逻辑剥离，迁移至通用成分别名映射表。
- [ ] **4.2 补充根目录无头 API 启动快捷指令** <!-- id: 4.2 -->
  - 在根目录 `package.json` 的 `scripts` 中增加 `"api": "npm run api --prefix web"`，统一开发运维入口。
