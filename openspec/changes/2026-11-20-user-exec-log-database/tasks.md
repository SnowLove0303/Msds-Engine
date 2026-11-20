# Tasks: 用户数据库与覆写审计全过程执行记录数据库

- [x] **Task 1: 配置仓库防上传安全忽略规则与构建数据库底座引擎 (`web/src/user-exec-db.js`)（REQ-DB-01~03）**
  - 在 `.gitignore` 增加 `web/data/user_exec_logs.db*` 与 `user_data/`；
  - 编写 `web/src/user-exec-db.js`：实现 Schema 自动初始化（`users`, `execution_runs`, `workflow_errors`, `audit_findings`）及用户管理、批次创建、工作流报错记录、审计缺陷批量入库、状态流转与多维查询 API；
  - 验证命令：运行 `npm run lint`（退出码 0）+ 独立写入/查询自测脚本验证建表与 `git status` 未追踪隔离。

- [x] **Task 2: 在 `run_standard_production.mjs` 集成全过程报错与审计明细捕获入库（REQ-WF-01~02, REQ-AUD-01~02）**
  - 支持 `--user=<userId>`、`--actorType=human|agent` 参数；
  - Phase 1~6 捕获异常堆栈、阶段和上下文路径写入数据库；
  - Phase 7 使用 `spawnSync` 镜像捕获 `audit_topology_roles.mjs`、`audit_bipolar_bilayer.mjs`、`run_master_msds_audit.mjs` 的全部 `CRITICAL`/`FAIL`/`WARNING` 明细并持久化入库；
  - 验证命令：运行 `PA-4840` 流水线（含审计与模拟报错测试），确认所有环节异常及未通过项均准确入库。

- [x] **Task 3: 编写 CLI 查询检索工具 (`web/scripts/query_exec_logs.mjs`) 与打包排除校验（REQ-QRY-01, RTM-05）**
  - 实现 CLI 查询工具（支持按用户、型号、状态、严重级别检索、展示最近失败明细及标记 `resolution_status`）；
  - 更新 `pack_workflow_kit.mjs` 确保打包 ZIP 不包含本地用户 `.db` 数据文件；
  - 验证命令：`node web/scripts/query_exec_logs.mjs --model=PA-4840` 真实输出全量执行记录与审计未通过明细；`git status` 确认零用户数据泄露；`npm run lint` 退出码 0，并推送底座代码至 `origin/main`。
