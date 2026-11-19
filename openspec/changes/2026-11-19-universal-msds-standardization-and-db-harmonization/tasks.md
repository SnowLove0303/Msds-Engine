# 施工任务清单: 全局通用 MSDS 标准化重构与同品类基准数据库补充体系
## Implementation Tasks (Single-Focus Lock & VS Code Review)

> **Change ID**: `2026-11-19-universal-msds-standardization-and-db-harmonization`  
> **Status**: Pending Approval (等待门禁 2 批准动工)  

---

- [x] **Task 1: 构建通用基准产出物数据库表与 MySQL 集中式部署脚本 (SPEC-DB-01)**
  - **Single-Focus Lock**: `[x]`
  - **受控动作**:
    1. 在便携式主库 `web/data/msds_repo.db` (SQLite) 中建立 `benchmark_category_specs` 基准规格表，录入各类通用化工大类标准安全防护参数；
    2. 生成对应的 `web/data/mysql_schema.sql` 供集中式 MySQL 部署使用。
  - **验收命令**: `node web/scripts/test_db_query.mjs` (Exit Code 0)

- [x] **Task 2: 智能匹配引擎同品类基准智能补充通用模块开发 (SPEC-SMART-01)**
  - **Single-Focus Lock**: `[x]`
  - **受控动作**:
    1. 在 `web/src/smart-matching.js` 中新增通用 `harmonizeWithBenchmarkDatabase(facts, category)` 函数；
    2. 当任何型号源文档缺失细分技术参数时，自动从基准库补充标准值，全局消灭空值行与短命剪枝。
  - **验收命令**: `node web/scripts/test_task2_smart_matching.mjs` (Exit Code 0)

- [x] **Task 3: 核心章节槽位硬规制与 S11 状态机重构 (SPEC-SLOT-01)**
  - **Single-Focus Lock**: `[x]`
  - **受控动作**:
    1. **Section 1**: 全局锁定 Row 1 填型号，Row 2 `中文名称：` 必填 `品名 + 型号`；
    2. **Section 8**: 结合源文要求与基准库，补全手部防护 6 行参数及英文版工程控制；
    3. **Section 11**: 修复无条件调用 `buildThreeTierSection11` 的历史 Bug，纯产品单体毒理指标强制走 `PARADIGM_2_TWO_COLUMN_GRID`（双栏表格），彻底删除捏造免责行；
    4. **Section 13**: 通用分流 Row 1 法规总则与 Row 2 处理方法，消灭空行；
    5. **Section 14**: 100% 完整保留源文公路、IMDG、IATA 及温控要求；
    6. **Section 15**: 规整法规清单排版去重。
  - **验收命令**: `node web/scripts/test_task3_pipeline_verification.mjs` (Exit Code 0, review_diff_in_vscode completed)

- [x] **Task 4: 更新 MSDS_Studio_Agent_Test_Kit 白皮书与外部 Agent 规范 (SPEC-KIT-01)**
  - **Single-Focus Lock**: `[x]`
  - **受控动作**:
    1. 在 `体系交接文档/MSDS_Studio_Agent_Test_Kit/README_FOR_AGENT.md` 中固化 S1 槽位规范、S11 纯产品双栏规范及非标文档语义匹配指南。
  - **验收命令**: `git diff 体系交接文档/MSDS_Studio_Agent_Test_Kit/README_FOR_AGENT.md` (Exit Code 0, review_diff_in_vscode completed)

- [x] **Task 5: PA-3654 全套 8 格式标准交付物重新生成与全景法医审计 (SPEC-PROD-01)**
  - **Single-Focus Lock**: `[x]`
  - **受控动作**:
    1. 执行重构后的流水线，重新覆写生成 PA-3654 的 4 份 Word 与 4 份 PDF；
    2. 运行双极双层审计脚本，逐单元格验证 0 空值行、0 捏造文字、100% 源文还原；
    3. 出具终审核销报告，交付验证成果。
  - **验收命令**: `node web/scripts/inspect_pa3654_gap.mjs` (0 blank rows, Exit Code 0, Bipolar Bilayer Audit 100% PASS)
