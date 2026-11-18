# Tasks: PA-3653 与 PA-3654 双轨生产与混合排版解析任务执行清单

## 任务执行清单 (落实 [-] 单焦点执行锁)

- [x] **Task 1: 升级 `recognition-engine.js` 混合排版解析状态机并验证 [Root Source]**
  - **因果角色**: [Root Source]
  - **拟变文件**: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\recognition-engine.js`
  - **实现要点**:
    1. 在 `recognizeSourceDocx` 循环中引入跨记录状态机持久追踪 `currentSecNum` 与 `currentSecTitle`。
    2. 支持从 `kind: 'text'` 段落中提取 `1~16` 章节大标题。
    3. 支持将属于激活章节的非标题段落转化为规范数据行。
    4. 支持 `kind: 'table'` 继承上文段落激活的章节编号。
  - **验证命令**:
    `node web/scripts/run_source_recognition.mjs --source="算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 MSDS（冠志）.docx"`
  - **打勾充要条件**:
    1. `PA-3653` 成功抽取 Section 3 组分 $\ge 3$（`丙烯酸共聚物`、`去离子水`、`氨水`）。 [PASS - 实测3组分]
    2. `PA-3653` 成功抽取 Section 9 理化指标 $\ge 10$ 项。 [PASS - 实测11项]
    3. 进程真实退出码为 0。 [PASS - exit 0]

- [-] **Task 2: 执行 PA-3653 MSDS 全自动流水线与三阶法医审计**
  - **因果角色**: [State Transition]
  - **执行主体**: Main Agent
  - **输出路径**: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-1 单组份水性丙烯酸乳液 PA\PA-3653\`
  - **执行命令**:
    `node web/scripts/run_universal_msds_pipeline.mjs --source="算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 MSDS（冠志）.docx"`
  - **打勾充要条件**:
    1. 目标目录产出 4 DOCX + 4 PDF = 8 份 MSDS 交付物。
    2. 165 项双极双层审计 PASS (FAIL = 0)。
    3. 167 项主审计 PASS (FAIL = 0)。
    4. 翻译双显行级审计 100% MATCH。
    5. 真实退出码为 0。

- [ ] **Task 3: 执行 PA-3654 MSDS 全自动流水线与三阶法医审计**
  - **因果角色**: [State Transition]
  - **执行主体**: Main Agent
  - **输出路径**: `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-1 单组份水性丙烯酸乳液 PA\PA-3654\`
  - **执行命令**:
    `node web/scripts/run_universal_msds_pipeline.mjs --source="算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）.docx"`
  - **打勾充要条件**:
    1. 目标目录产出 4 DOCX + 4 PDF = 8 份 MSDS 交付物。
    2. 165 项双极双层审计 PASS (FAIL = 0)。
    3. 167 项主审计 PASS (FAIL = 0)。
    4. 翻译双显行级审计 100% MATCH。
    5. 真实退出码为 0。

- [ ] **Task 4: 派发 SubAgent `tds-manager` 复核并验证 PA-3653 与 PA-3654 TDS 交付矩阵**
  - **因果角色**: [State Transition]
  - **执行主体**: SubAgent `tds-manager`
  - **执行动作**:
    1. 校验/执行 `PA-3653` 与 `PA-3654` TDS 生产管线 (`python tds_pipeline.py run`)。
    2. 执行 `audit_tds_eight.py` 严格核验两型号共 16 份 TDS 交付物单页合规性 (`all_single_page=True`)。
  - **打勾充要条件**:
    1. SubAgent 回传成功胶囊，发布状态为 `RELEASE_PASS`。
    2. `PA-3653` 包含 4 DOCX + 4 PDF TDS 交付物。
    3. `PA-3654` 包含 4 DOCX + 4 PDF TDS 交付物。

- [ ] **Task 5: 全量 32 份最终交付成果核验与 VS Code 检阅通道拉起**
  - **因果角色**: [Verification Gate]
  - **执行主体**: Main Agent
  - **打勾充要条件**:
    1. 物理检查 `PA-3653` (8 MSDS + 8 TDS) 与 `PA-3654` (8 MSDS + 8 TDS) 共 32 份文件全部就绪且字节数正常。
    2. 调用 `vscode-review` / `open_in_vscode` 拉起检阅。

- [ ] **Task 6: CHANGELOG 知识沉淀与 Git 原子存档**
  - **因果角色**: [Knowledge & Archive]
  - **执行主体**: Main Agent
  - **实现要点**:
    1. 在 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\CHANGELOG.md` 记录本次混合排版解析增强与双轨生产。
    2. 清理临时测试脚本 (`scratch/inspect_pa3653_engine.mjs`, `web/scripts/test_pa3653_debug.mjs`)。
    3. 执行 Git Commit 存档。
