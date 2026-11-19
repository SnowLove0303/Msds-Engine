# Tasks: 识别与审计模块底层通用性优化与源文件强制对账审计施工任务清单

> **单焦点执行锁声明**：同一时刻严格只能有 1 个任务标记为 `[-]`（进行中）。完成单步任务并通过对应测试命令后，方可推进下一项。所有源码改动必须触发 `review_diff_in_vscode` 供用户把关。

---

## 施工任务推进计划

- [x] **Task 1: Section 2 GHS 否定词过滤、警告词兼容与散文防范后备解析 (`web/src/recognition-engine.js`)**
  - [x] 1.1 增加否定词过滤正则，确保 `无/不适用/not classified` 时 `isHazardous = false`，提取无危害说明文本
  - [x] 1.2 正则扩充支持“警告词：警告/危险”，标准化提取 `signalWord`
  - [x] 1.3 构建散文防范说明纯文本后备解析器，按预防/响应/存储/处置切分中文句子存入四大组，消除空数组
  - [x] 1.4 运行单测验证：`node web/scripts/run_recog_pa4902.mjs`，确保 GHS 提取事实完整
  - [x] 1.5 通过 `review_diff_in_vscode` 提交源码 Diff 检阅

- [x] **Task 2: 全章节顶层业务字段补齐与成盐附注挂载 (`web/src/recognition-engine.js`)**
  - [x] 2.1 Section 4 补全 `skin`、`eyes`、`general` 顶层槽位提取
  - [x] 2.2 Section 5 提取合适/不合适灭火剂、特殊危害与防护装备，消除 `{}` 空对象
  - [x] 2.3 Section 7 提取 `handling`（安全操作防范）槽位
  - [x] 2.4 Section 10 提取 `decomposition`（危险分解产物）与 `hazardousReactions`（危害反应）
  - [x] 2.5 Section 3 提取成分表下方成盐中和剂说明并挂载至 `componentsNotes`
  - [x] 2.6 运行架构 Lint 检查：`npm run lint:code`（确保 0 违规）
  - [x] 2.7 通过 `review_diff_in_vscode` 提交源码 Diff 检阅

- [x] **Task 3: 审计模块强化源文件强制对账机制 (`web/scripts/lint_source_grounding.mjs` & `run_master_msds_audit.mjs`)**
  - [x] 3.1 优化 `lint_source_grounding.mjs`：增加理化参数 19 项数值对账、Section 14 运输温控对账与 CAS 组分全量对账
  - [x] 3.2 在 `run_master_msds_audit.mjs` 中将源事实对账作为核心审计环强制调用，若违背客观事实坚决阻断
  - [x] 3.3 运行源事实对账验证：`node web/scripts/lint_source_grounding.mjs --source "算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx" ...`
  - [x] 3.4 通过 `review_diff_in_vscode` 提交源码 Diff 检阅

- [x] **Task 4: 全品类回归验证与 1:1 双向物理核销**
  - [x] 4.1 运行全量代码架构 Lint：`npm run lint`（零警告、零错误）
  - [x] 4.2 运行回归测试覆盖 PA-4902、PA-3654、PA-4914、EP-1501，确保 19+7 项缺陷 100% 消除且零回归
  - [x] 4.3 提交最终验收总结与 CHANGELOG 知识沉淀
