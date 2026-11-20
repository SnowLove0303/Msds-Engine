# Tasks: Context 1 -> Context 2 多样本检验与工作流统一提速

- [x] **Task 1: 补强 `context-governor.js:buildStructuredContext2` 机械分类与规范化加工（REQ-02, REQ-03）**
  - 落实 Section 1.1 CN 版产品中文名称标准写法（`<中文品名> <modelCode>`）；
  - 补全 Section 4~16 英文专业映射接入，消除英文映射列中文残屑；
  - 强化 Section 8 多列 OEL 表头与数据行、Section 11 双范式、Section 13/14/15 角色机械重分类与自检统计；
  - 验证命令：`npm run lint`（退出码 0，0 警告 0 错误）。

- [x] **Task 2: 统一优化 MCP 网关单链调用并更新工作流规范（REQ-04）**
  - 优化 `web/scripts/msds_mcp_gateway.mjs` 与 `web/src/mcp-server.js`，支持 `--tool=msds_govern_context2` 一键直出标准化 Context 2（含自检摘要），并更新 `msds-studio/SKILL.md` 为零源码阅读极速调用链；
  - 验证命令：`node web/scripts/msds_mcp_gateway.mjs --tool=msds_govern_context2 ...`（退出码 0，直出纯净 UTF-8 Markdown）。

- [x] **Task 3: 开展 >= 8 个跨品类多样本 Context 1 -> Context 2 实测与逐节核查（REQ-01, REQ-02, REQ-03）**
  - 编写并运行 `web/scripts/test_context1_to_context2_multisample.mjs`，覆盖 `PA-4840`, `PA-4902`, `PU-202A`, `PU-2346A`, `EP-8801`, `OS-79A`, `PU-1035`, `RU-10130` 等真实源文件；
  - 逐样本校验 16 章节结构角色分类准确率、源内容 100% 继承率、Section 1.1 中文名称标准写法及英文映射完整度；
  - 验证命令：`node web/scripts/test_context1_to_context2_multisample.mjs`（退出码 0，全样本 100% 通过）。

- [x] **Task 4: 终审、Lint 全绿与仓库同步归档**
  - 运行 `npm run lint` 与 `openspec` 验证，呈报 1:1 双向物理核销表与遇到问题与解法，并将代码（不含产出物）推送至 `origin/main`。
