# Proposal: 用户数据库与覆写审计全过程执行记录数据库

## 1. 背景与动机
用户检查脚本执行记录时发现存在较多未通过项，而当前控制台日志瞬时消逝，缺乏面向用户与批次维度的持久化执行记录和问题台账。同时，用户明确要求：**该数据库为用户数据库，禁止将用户数据上传到仓库，只允许上传底座**。

## 2. 1:1 需求物理对账矩阵 (RTM)
- **RTM-01**: 建立“用户数据库”与“执行记录数据库”体系（用户档案 + 执行批次持久化）。
- **RTM-02**: 覆写工作流全过程（Phase 1~6）报错、异常堆栈与上下文路径捕获入库。
- **RTM-03**: 审计全过程（机械审计 165/170 项 + 角色审计 + Agent 审计）未通过项（`FAIL`、`CRITICAL`、`WARNING`）与实测偏差明细 1:1 结构化入库。
- **RTM-04**: 提供按用户、型号、状态、阶段或关键词检索历史执行记录与问题明细的查询/统计能力。
- **RTM-05**: 用户数据与代码仓库物理隔离：仅提交数据库底座（Schema 定义、初始化引擎、查询工具），本地数据文件（`web/data/user_exec_logs.db*`）受 `.gitignore` 严格保护，严禁上传至远程仓库。

## 3. 范围界定（双清单）
### 拟变范围清单
1. `[Schema/Base]` 新增 `web/src/user-exec-db.js`：纯底座引擎（基于 Node 原生 `node:sqlite`），包含用户表、执行批次表、工作流报错表、审计缺陷明细表的 Schema 自动初始化与 CRUD/查询 API。
2. `[Security/Isolation]` 修改 `.gitignore`：加入 `web/data/user_exec_logs.db*` 与 `user_data/` 忽略规则，物理阻断用户数据进入 Git 版本库。
3. `[Pipeline Integration]` 修改 `标准化流程/MSDS_Studio_Agent_Test_Kit/run_standard_production.mjs`：集成执行记录生命周期钩子（启动建档、Phase 1~6 异常捕获、Phase 7 审计输出流镜像捕获解析并入库）。
4. `[CLI Query Tool]` 新增 `web/scripts/query_exec_logs.mjs`：提供用户与执行记录/报错/未通过项的命令行查询、统计、问题状态流转与导出工具。
5. `[Packaging]` 更新 `web/scripts/pack_workflow_kit.mjs`：确保打包测试套件时仅打包底座代码，绝不打包本地用户 `.db` 数据文件。

### 保持现状承诺清单
1. 绝对不修改 `web/data/msds_repo.db` 及 `web/src/msds-db.js` 既有业务模板与翻译记忆库结构；
2. 绝对不修改 `web/src/topology-matcher.js`、`web/src/template-editor.js`、`web/src/docx-engine.js` 的既有核心覆写与排版逻辑；
3. 绝对不放宽或篡改现有审计脚本（`audit_bipolar_bilayer.mjs`、`run_master_msds_audit.mjs`、`audit_topology_roles.mjs`）的任何断言标准。
