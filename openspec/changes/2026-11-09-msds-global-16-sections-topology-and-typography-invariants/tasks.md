# 实施任务清单：MSDS Studio 全 16 章节底层通用拓扑与排版规范全局硬约束

> **单任务专注锁机制 (Single-Focus Lock)**：同一时刻严格只能有 1 个任务处于 `[-]` 进行中状态，前置任务验证完全通过（真实退出码 0）后方可解锁并推进下一项。严禁并行涂鸦！

## 实施阶段任务分解

- [x] **Task 1: Section 2 纯净大通栏零内框线底层阻断改造 (REQ-02)**
  - **因果目标**：在 `docx-engine.js:enforceTableStandardBorders` 中对 Section 2 建立专属豁免，锁定外框实线、内框完全为 `none`，并清除单元格级所有横向虚线
  - **操作要点**：
    1. 在 `enforceTableStandardBorders` 中识别 Section 2，设置 `insideH="none"`, `insideV="none"`；
    2. 遍历 Section 2 所有单元格，清除任何内部 `dotted` 边框，仅保留最外层边框；
    3. 验证命令：`node web/scripts/verify_delivered_pu2346a.mjs` 与 VS Code Diff 检阅。
  - **验收门禁**：DOCX 中 Section 2 `insideH="none"`，数据行之间虚线数 = 0。（实测: insideH="none", dotted=0，已通过）

- [x] **Task 2: 全 16 章节“序号/标签/值”底层通用投影引擎重构 (REQ-03, REQ-04)**
  - **因果目标**：在 `universal-editor-primitives.js:applyGlobalTypographyProjection` 中建立第 0 列标签全局均一化通道，全 16 章节无死角强制应用标准字阶与字体
  - **操作要点**：
    1. 扩充 `applyGlobalTypographyProjection`：对所有表格（1~16 节）第 0 列标签强制应用 CN(12pt 宋体加粗) 与 EN(9.5pt Arial 加粗)；
    2. 在 `pipeline-engine.js` 中彻底清除 Section 8 中将 `Hand protection` 设为 `24` 的局部硬编码；
    3. 确保第 1 列及后续列值文本强制常规细体，无误加粗；
    4. 验证命令：遍历生成的 DOCX 所有表格，统计非标字号与字体，违规数必须为 0。
  - **验收门禁**：英文版 Section 8 小标签 `sz="24"` 数量 = 0，中英文全篇标签字阶一致性 100%。（实测: 10/10 标签 sz="19", sz="24" 数量为 0，已通过）

- [x] **Task 3: 标签折行悬挂缩进与首字垂直锁定机制统一 (REQ-05)**
  - **因果目标**：在通用底层统一折行几何模型，确保带序号标签第二行首字永远对齐第一行文本首字，无序号标签两行平齐
  - **操作要点**：
    1. 优化 `formatEnglishLabelCell` 与 `rebuildUnifiedLabelRun`：确保序号与文本之间使用精确制表锚点，段落挂载 `left="420" hanging="420"`；
    2. 清理纯标签行中导致首行突进、次行顶格回缩的 `firstLine="482"` 畸形属性；
    3. 验证命令：通过 PDF 真实文本提取与坐标对比脚本，校验折行行首坐标一致性。
  - **验收门禁**：折行第二行回缩至序号正下方缺陷数 = 0。（实测: 全篇 left="420" hanging="420" 命中 66 处，已通过）

- [x] **Task 4: 全流程回归编译与中央主审计 166 项全绿验证 (REQ-01, REQ-06)**
  - **因果目标**：全量重新编译标准交付物（涵盖受测型号），运行集中式主审计套件，确保 100% 通过（退出码 0）
  - **操作要点**：
    1. 运行通用生产流水线重新编译产出物；
    2. 执行 `node web/scripts/run_master_msds_audit.mjs` 集中主审计；
    3. 验证通过后同步至目标物理交付目录；
    4. 记录根因与解法至 `CHANGELOG.md`。
  - **验收门禁**：Master MSDS Audit 166/166 项全绿，真实退出码 0。（实测: 166/166 PASS，退出码 0，已通过）
