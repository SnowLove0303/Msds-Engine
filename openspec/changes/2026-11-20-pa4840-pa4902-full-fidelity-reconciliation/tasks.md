# 任务清单：PA-4840 与 PA-4902 产出物全景重对照与拓扑重构实施任务

> **任务规范**: `tasks.md`  
> **机制约束**: Roo-Code / Cline 单任务专注锁 (`[-] lock`)，同一时刻仅允许 1 个任务处于执行态

---

- [x] **Task 1: Section 1 中文化学品分类自动穿透与回填 (`T1-S1-BIND`)**
  - 在 `web/src/pipeline-engine.js` 的 `buildBaseChineseEngine` 中，增加穿透 `srcEngine` 检索化学品分类的逻辑，彻底解决 PA-4840 与 PA-4902 中文交付物 Section 1 行 3 单元格空白问题；
  - 验证命令: `node web/scripts/test_s1_build.mjs`，确保单元格非空且内容 100% 吻合源文件 (PA-4840: `丙烯酸聚合物分散体`, PA-4902: `水溶性丙烯酸聚合物树脂`)。

- [x] **Task 2: PA-4840 Section 2 多项危险性分类与说明全量捕获 (`T2-4840-S2-PARSE`)**
  - 在 `web/src/pipeline-engine.js` 中优化 `parseSection2FromSource`，兼容 `CHS危险性类别` 并捕获急性毒性（经口/经皮/吸入）、眼睛刺激、皮肤刺激等全部 6 项危害语句；
  - 在 `buildFullWidthSection2` 中全量呈现并完成标准中英双语对齐；
  - 验证命令: `node web/scripts/test_parse_4840.mjs`，确保 6 项危害语句全部捕获且无重复。

- [x] **Task 3: PA-4902 Section 2 拓扑重构与成盐中和剂迁移 (`T3-4902-S2-MIGRATE`)**
  - 严格参照 PA-3223 标杆架构，在 `pipeline-engine.js` 中将聚合物分类与成盐中和剂附注迁移至 Section 2 标签要素作用域；
  - 规范呈现“危险象形标记：无”与“警告词：警告”，并同步完成英文版 Section 2 专业英译映射；
  - 清理 Section 3 组分表格，恢复为纯净 4 行化学品表格，移除中英文 Section 3 底部附注行；
  - 验证命令: `node web/scripts/test_full_build_check.mjs`，确保 Section 3 为纯净 8 行，Section 2 完整呈现成盐附注。

- [x] **Task 4: PA-4902 Section 11 升级为 4 行通栏范式 1 (`T4-4902-S11-PARADIGM1`)**
  - 按照 PA-3223 标杆结构，为 PA-4902 构建包含水溶性羟基聚丙烯酸酯与乙二醇丁醚实测 LD50 数据的 4 行通栏表格；
  - 同步生成 1:1 对称的英文 4 行表格；
  - 验证命令: `node web/scripts/test_full_build_check.mjs`，确保 S11 行数为 4，且完整保留动物 LD50 数据。

- [x] **Task 5: 重新生成 16 份最终交付物 (`T5-REGEN-16-DELIVERABLES`)**
  - 运行 `node web/scripts/run_generate_4840_4902.mjs` 重新生成 PA-4840 (8 份) 与 PA-4902 (8 份) 交付物；
  - 确保文件物理生成且修改时间最新。

- [x] **Task 6: 建立并运行全景重对照法医硬审计套件 (`T6-AUDIT-HARD-GATE`)**
  - 编写并运行 `web/scripts/audit_full_fidelity_reconciliation.mjs`，执行 1:1 源文件 vs 产出物全字段物理比对；
  - 运行 `node web/scripts/run_master_msds_audit.mjs` 对 PA-4840 与 PA-4902 进行 171 项全量主审计；
  - 运行 `npm run lint`，确保 0 警告、0 错误、退出码 0。

- [x] **Task 7: 审计总结与 Git 仓库同步 (`T7-GIT-SYNC`)**
  - 执行 `git add`（严格排除交付物目录 `产出别推`），提交并推送至 `origin main`；
  - 调用 `open_in_vscode` 呈报关键修改文件；
  - 输出终审核销报告。
