# 实施任务清单：底层通用多段对齐解析与 Section 14.6 主子标签分离拓扑

> **单任务专注锁机制 (Single-Focus Lock)**：同一时刻严格只能有 1 个任务处于 `[-]` 进行中状态，前置任务验证完全通过（真实退出码 0）后方可解锁并推进下一项。严禁并行涂鸦！

## 实施阶段任务分解

- [x] **Task 1: 识别模块底层通用多段对齐原语构建与 Section 14 结构化提取 (REQ-S14-03 & REQ-S14-04)**
  - **因果目标**：在 `recognition-engine.js` 中构建通用多段对齐算法，将源文件 Section 14 压缩单元格精准还原为多属性结构化事实对象
  - **操作要点**：
    1. 实现 `extractMultiParagraphCellPairs(row)`，对齐 Col 0 与 Col 1 段落流；
    2. 识别主标签、子标签（`附加信息：`）及空行延续值；
    3. 重构 `parseSection14(record, facts)`，输出包含 14.1~14.7、14.6 主值 `参见6-8节` 与附加信息 2 行温控隔离事实；
    4. 验证命令：编写脚本提取源文件事实，确认 `facts.transport` 中 `specialPrecautions.primaryCn === '参见6-8节'` 且 `additionalInfo.itemsCn.length === 2`。
  - **验收门禁**：识别事实结构化提取 100% 精确，单元测试退出码 0。

- [x] **Task 2: 构建管道 Section 14.6 主值与附加信息子行动态装配 (REQ-S14-01 & REQ-S14-02)**
  - **因果目标**：在 `pipeline-engine.js:buildDynamicSection14Table` 中消费结构化事实，生成 14.6 主行与附加信息子行
  - **操作要点**：
    1. `buildDynamicSection14Table` 接入 `facts.transport`；
    2. Row 6 渲染 `14.6 用户特殊防范措施：`，值为 `参见6-8节`（英文：`See sections 6-8.`）；
    3. Row 7 渲染 `附加信息：`（英文：`Additional information:`），左缩进 420 dxa，值为 2 行温控与隔离事实；
    4. 14.3 运输危险类别严格确立为源文件事实 `3`；
    5. 验证命令：检查中英文 DOCX 生成的 Section 14 行数与段落文本。
  - **验收门禁**：中英文 Section 14 结构 1:1 对称，14.6 主值与附加信息完整清晰。

- [x] **Task 3: 中央主审计套件 Item 151 升级与 PU-2346A 8 份标准交付物重新编译全绿核销 (REQ-01 ~ REQ-04)**
  - **因果目标**：升级审计套件 Item 151，重新编译并实现 170 项中央主审计 100% 满分通过（退出码 0）
  - **操作要点**：
    1. 更新 `run_master_msds_audit.mjs` Item 151：断言 14.6 包含“参见6-8节”，容纳 8/9 行结构；
    2. 重新编译 PU-2346A 8 份交付物并同步到 `E:\冠志\TDS MSDS (2)\待处理文件\PU-2346A\`；
    3. 运行中央主审计套件 170 项验证；
    4. 记录根因与解法至 `CHANGELOG.md`。
  - **验收门禁**：Master MSDS Audit 170/170 项全绿，真实退出码 0。
