# 施工任务清单: MSDS CAS 正确性全景核查纳入审计范围
## Implementation Tasks (Single-Focus Lock & VS Code Review)

> **Change ID**: `2026-11-18-integrate-cas-correctness-audit-suite`  
> **Status**: Pending Approval (等待门禁 2 批准动工)  

---

- [x] **Task 1: 编写独立纯函数模块 `web/src/cas-validator.js` (SPEC-CAS-01, SPEC-CAS-03)**
  - **Single-Focus Lock**: `[x]` (已测通并通过 VS Code Review 应用：加权模 10 算法、商业机密豁免、实体对账字典与跨章节穿透核验)
  - **受控文件**: `web/src/cas-validator.js`

- [x] **Task 2: 在集中式中央主审计套件注入 4 项 CAS 专属硬门禁 (SPEC-CAS-01, SPEC-CAS-02, SPEC-CAS-04, SPEC-CAS-05)**
  - **Single-Focus Lock**: `[x]` (已通过 VS Code Review 应用：在环 3 注入 INV-CAS-CHECKSUM, INV-CAS-SOURCE-FIDELITY, INV-CAS-NAME-COHERENCE, INV-CAS-S2-CROSS-CHECK)
  - **受控文件**: `web/scripts/run_master_msds_audit.mjs`

- [x] **Task 3: 在双极双层全景深度审计套件注入 CAS 判定 (SPEC-CAS-05)**
  - **Single-Focus Lock**: `[x]` (已通过 VS Code Review 应用：在 Layer 2 Section 3 注入组分 CAS 格式与加权模 10 校验和断言)
  - **受控文件**: `web/scripts/audit_bipolar_bilayer.mjs`

- [x] **Task 4: 端到端变异元反欺诈与全自动流水线验证 (SPEC-CAS-05)**
  - **Single-Focus Lock**: `[x]` (已测通：`test_cas_validator.mjs` 117 项正反例与变异元全绿，`run_master_msds_audit.mjs` 174 项全量通过，Exit Code 0)
  - **核心动作**:
    1. 正常运行 EC-1848 端到端流水线，验证退出码 0，清算表中展现 CAS 专属通过行；
    2. 注入变异反例（如故意测试非法校验码 `107-98-3`），验证审计套件 100% 阻断并报错退出码 1；
    3. 恢复纯净状态。
  - **验收命令**:
    - `node web/tests/test_cas_validator.mjs` (117/117 PASS, Exit Code 0)
    - `node web/scripts/run_master_msds_audit.mjs --targetDir="算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848" --source="算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx"` (174/174 PASS, Exit Code 0)

- [x] **Task 5: Git 原子存档与 OpenSpec 规格合流归档**
  - **Single-Focus Lock**: `[x]` (已完成：Git Commit 42c2989 沉淀，openspec validate 100% PASS，出具终审 1:1 核销报告)
  - **核心动作**:
    1. Git status 与 diff 审计；
    2. Git commit 沉淀；
    3. 运行 `openspec archive 2026-11-18-integrate-cas-correctness-audit-suite`；
    4. 出具终审核销报告。
