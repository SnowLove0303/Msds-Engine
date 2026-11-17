# 任务清单: 场景B - 22款产品 176份全量交付物标准化刷新

- [x] 1. 编写批量刷新主控驱动与法医全检核销脚本 <!-- id: task-01 -->
  - [x] 1.1 编写 `web/tests/batch_refresh_scenario_b.mjs`，顺序编排 22 款产品的通用生产流水线调用
  - [x] 1.2 编写 `web/tests/audit_batch_refresh_scenario_b.mjs`，包含 PyMuPDF 坐标差实测（$\Delta Y \le 1.5\text{ pt}$）、页码高度实测（$H_{\text{box}} \le 13.5\text{ pt}$）及“国彩新材料”/“P修订日期”全文 0 容忍检索

- [x] 2. 依次推进 22 款产品交付物全量生产刷新 (单焦点执行锁 [-] lock) <!-- id: task-02 -->
  - [x] 2.1 执行品类 1 (PU, 1款产品): `PU-6013Bio` 刷新 4 DOCX + 4 PDF
  - [x] 2.2 执行品类 2 (HPU, 2款产品): `HPU-7660`, `HPU-7700` 刷新 8 DOCX + 8 PDF
  - [x] 2.3 执行品类 3 (PA单组份, 6款产品): `PA-3612`, `PA-3615`, `PA-3617`, `PA-3655`, `PA-3656`, `PA-3663` 刷新 24 DOCX + 24 PDF
  - [x] 2.4 执行品类 4 (PA羟基, 13款产品): `PA-4000`, `PA-4006`, `PA-4771`, `PA-4778`, `PA-4800`, `PA-4804T`, `PA-4807`, `PA-4808`, `PA-4812`, `PA-4816`, `PA-4817`, `PA-4819`, `PA-4835` 刷新 52 DOCX + 52 PDF

- [x] 3. 运行 176 份全量终验交付物法医级全检与物理核销 <!-- id: task-03 -->
  - [x] 3.1 运行 `audit_batch_refresh_scenario_b.mjs` 物理实测 176 份文件（退出码 0，实测 176/176 100% 通过）
  - [x] 3.2 验证国彩名称 100% 为 `英德市国彩精细化工有限公司` / `Yingde Guocai Fine Chemical Co., Ltd.`（废弃旧称 0 出现）
  - [x] 3.3 验证所有页脚修订日期与实体名称 Y 轴高差 $\Delta Y \le 1.5\text{ pt}$（实测全部满足）
  - [x] 3.4 验证所有页脚页码字号 100% 为 9pt（$H_{\text{box}} \le 13.5\text{ pt}$，0 处 12pt 放大）
  - [x] 3.5 验证所有页脚 0 处 "P" 伪字符残留与 0 处 `\u2005` 窄空格残留

- [-] 4. 知识沉淀与变更归档 <!-- id: task-04 -->
  - [ ] 4.1 更新 `CHANGELOG.md` 沉淀批处理刷新演进与避坑记录
  - [ ] 4.2 运行 `openspec validate 2026-11-17-scenario-b-batch-deliverables-refresh-22-models` 验证通过
  - [ ] 4.3 归档变更并向用户出具 1:1 双向物理核销交付报告
