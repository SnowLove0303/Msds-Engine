# Specification: 用户数据库与覆写审计全过程执行记录数据库

## 1. 用户数据库与物理隔离契约 (RTM-01, RTM-05)
- **REQ-DB-01**: 系统 SHALL 使用独立的 SQLite 数据库文件（`web/data/user_exec_logs.db`）存储用户档案与执行记录，严禁将其混入受版本控制的 `web/data/msds_repo.db`。
- **REQ-DB-02**: 系统 SHALL 仅将数据库底座代码（Schema 定义、建表初始化逻辑、查询工具）纳入 Git 版本追踪；`.gitignore` SHALL 明确忽略 `web/data/user_exec_logs.db*` 及用户数据目录，确保 `git status` 不追踪本地用户数据文件。
- **REQ-DB-03**: WHEN 数据库首次被调用时，底座引擎 SHALL 自动创建 `users`、`execution_runs`、`workflow_errors`、`audit_findings` 四张核心表及索引，不依赖预先存在的 `.db` 文件。

## 2. 覆写工作流报错捕获契约 (RTM-02)
- **REQ-WF-01**: WHEN 启动覆写流水线时，系统 SHALL 自动注册或关联操作用户（支持 `--user` 与 `--actorType`，默认取本地系统用户），并创建一条初始状态为 `RUNNING` 的 `execution_runs` 记录。
- **REQ-WF-02**: WHEN Phase 1~6 任一阶段发生异常中断或报错时，系统 SHALL 捕获错误码、错误消息、所属阶段（`PHASE_1` ~ `PHASE_6`）、堆栈摘要写入 `workflow_errors`，并将该批次状态更新为 `FAILED`。

## 3. 审计未通过项与缺陷明细入库契约 (RTM-03)
- **REQ-AUD-01**: WHEN Phase 7 执行角色审计（`audit_topology_roles.mjs`）、双极双层审计（`audit_bipolar_bilayer.mjs`）或中央主审计（`run_master_msds_audit.mjs`）时，系统 SHALL 同步捕获其标准输出与错误输出流。
- **REQ-AUD-02**: 系统 SHALL 解析出每一条 `CRITICAL`、`FAIL`、`WARNING` 级未通过/警告项（含审计器名称、严重级别、规则/环标识、章节定位、实测情况、预期标准），并持久化写入 `audit_findings` 表；同时支持后续对单条缺陷标记排查状态（`OPEN` / `FIXED` / `FALSE_POSITIVE`）。

## 4. 检索与追溯查询契约 (RTM-04)
- **REQ-QRY-01**: 系统 SHALL 提供查询工具（`web/scripts/query_exec_logs.mjs`），支持按用户、产品型号、运行状态、严重级别检索历史批次及对应的工作流报错与审计缺陷明细。
