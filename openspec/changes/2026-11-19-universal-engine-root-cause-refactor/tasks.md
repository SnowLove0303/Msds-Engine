# Tasks: MSDS 引擎底层通用性根治施工任务清单

> **单焦点执行锁声明**：同一时刻严格只能有 1 个任务标记为 `[-]`（进行中）。完成单步任务并通过对应测试命令后，方可推进下一项。所有源码改动必须触发 `review_diff_in_vscode` 供用户把关。

---

## 施工任务推进计划

- [x] **Task 1: 底座 DOCX 引擎嵌套表格通用递归抽取 (`web/src/docx-engine.js`)**
  - [x] 1.1 在 `parseCell` 中增加对直接子节点 `directChildren(tc, 'tbl')` 的遍历与 `buildTableRecord` 递归解析
  - [x] 1.2 将嵌套表格模型挂载至 `cell.nestedTables`，并将嵌套表格的所有单元格文本合并进 `cell.text`
  - [x] 1.3 运行单元验证脚本确保无破坏性回归：`node -e "import('./web/src/docx-engine.js')"`
  - [x] 1.4 通过 `review_diff_in_vscode` 提交源码 Diff 检阅

- [x] **Task 2: 全景识别引擎跨行状态机与通用容差重构 (`web/src/recognition-engine.js`)**
  - [x] 2.1 Section 1 增设 `facts.chemicalClassification` 通用提取槽位与特征正则
  - [x] 2.2 Section 2 危险性分类升级为跨行扫描状态机，支持“警示词”同义词与复合 P 码空格容差，实现四大防范组精准路由
  - [x] 2.3 Section 8 支持从 `cell.nestedTables` 动态提取职业接触限值条目，实现手部防护多行规格聚合
  - [x] 2.4 Section 11 支持多端点独立刺激性识别，保护“主要皮肤刺激性”与“主要粘膜刺激性”
  - [x] 2.5 Section 14 建立非危险品运输语义先行判定，阻断非危品标题抢占 UN 字段，保留 ADG 完整从句
  - [x] 2.6 Section 15 法规信息条目化切分为 `catalogs` 数组
  - [x] 2.7 运行全景识别自检测试：`npm run lint:code` 确保零违规零告警
  - [x] 2.8 通过 `review_diff_in_vscode` 提交源码 Diff 检阅

- [x] **Task 3: 事实治理与智能匹配中枢透传与不可否定保护 (`web/src/context-governor.js` & `web/src/smart-matching.js`)**
  - [x] 3.1 `context-governor.js` 建立 `chemicalClassification` 双语对齐与透传管道
  - [x] 3.2 `smart-matching.js` 设立既有事实不可否定门禁：杜绝单方面抹除吸入急性毒性
  - [x] 3.3 规范 UN 1866 对应的英文法定正式运输名称映射（`RESIN SOLUTION, flammable`）
  - [x] 3.4 运行智能匹配 20 项审阅批注回归验证：`npm run test:annotations`（必须退出码 0）
  - [x] 3.5 通过 `review_diff_in_vscode` 提交源码 Diff 检阅

- [x] **Task 4: 流水线组装引擎非空门禁、动态限值渲染与文本去重 (`web/src/pipeline-engine.js`)**
  - [x] 4.1 Section 1.1 中文化学品分类绑定并建立“零关键空白单元格”质量门禁
  - [x] 4.2 Section 8.2 工程控制单元格非空保护，纠正限值说明错位塞入工程控制单元格
  - [x] 4.3 Section 8 职业接触限值表格支持依据 `facts.exposureControls.limits` 动态插入数据行，杜绝断头空表
  - [x] 4.4 Section 14.4 英文温控特殊防范说明实施句子级去重，消除机械重复两遍瑕疵
  - [x] 4.5 Section 15 法规信息建立源文件历史法令（如 344 号令、GB 20576）反覆盖保护
  - [x] 4.6 运行全量代码架构 Lint：`npm run lint`（必须零违规通过）
  - [x] 4.7 通过 `review_diff_in_vscode` 提交源码 Diff 检阅

- [x] **Task 5: 全系统双轨集成验证与 1:1 双向物理核销**
  - [x] 5.1 运行 master MSDS 审计与架构门禁：`npm run lint` & `npm run test:annotations`
  - [x] 5.2 运行回归测试脚本检验 PA-3654、PA-4914、EP-1501 识别事实与映射完整度，19 项缺陷 100% 消除
  - [x] 5.3 提交最终验收总结与 CHANGELOG 知识沉淀
