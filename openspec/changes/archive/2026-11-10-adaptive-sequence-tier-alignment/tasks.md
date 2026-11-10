# 实施任务清单：基于章节最大序号位数自适应分层对齐引擎与 4 位数长序号舒适间距规范

> **单任务专注锁机制 (Single-Focus Lock)**：同一时刻严格只能有 1 个任务处于 `[-]` 进行中状态，前置任务验证完全通过（真实退出码 0）后方可解锁并推进下一项。严禁并行涂鸦！

## 实施阶段任务分解

- [x] **Task 1: 全局编辑器底层自适应序号长度层级探查器构建 (REQ-TIER-DISCOVERY & REQ-TIER-3DIGIT-PRESERVATION)**
  - **因果目标**：在 `universal-editor-primitives.js` 中建立章节序号位数扫描探查器，精准将章节区分为 Tier A (3 位数 / 420 dxa) 与 Tier B (4 位数 / 560 dxa)
  - **操作要点**：
    1. 在 `applyGlobalTypographyProjection` 表格遍历循环首部，增加整表 Column 0 序号长度探查；
    2. 最大序号长度 $\ge 5$（如 `11.10`~`11.16`）判定为 Tier B（`targetIndent = '560'`），其余判定为 Tier A（`targetIndent = '420'`）；
    3. 父级带序号标签与子级无序号标签统一应用 `targetIndent`，确保 Tier A（Sec 8, 9, 10, 14）100% 保持现状不变；
    4. 验证命令：检查 Section 9 XML 依然为 420 dxa，Section 11 XML 为 560 dxa。
  - **验收门禁**：Tier A 与 Tier B 缩进区分生效，Tier A 绝对零漂移。

- [x] **Task 2: Section 11 毒理学格式化底层专属 560 dxa 舒适间距升级 (REQ-TIER-4DIGIT-SPACING-ALIGN)**
  - **因果目标**：重构 `docx-engine.js:formatSection11LabelCell`，采用 560 dxa 专属悬挂缩进与制表位，为 `11.15` 注入 200 dxa 舒适呼吸留白
  - **操作要点**：
    1. 在 `formatSection11LabelCell` 中，将 `applyStandardHangingIndent(cell, '420', '420')` 升级为 `applyStandardHangingIndent(cell, '560', '560')`；
    2. 标签与序号之间制表位自动跳至 560 dxa，折行次行继承 560 dxa 悬挂；
    3. 验证命令：检查生成的 DOCX XML，确认 Table 11 标签单元格悬挂缩进为 560 dxa。
  - **验收门禁**：Section 11 序号与标签之间存在充裕舒适间距，无拥挤感。

- [x] **Task 3: 中央主审计套件 Item 154 对齐断言分层升级与 170 项全绿回归 (REQ-TIER-AUDIT-VERIFICATION)**
  - **因果目标**：同步更新主审计套件中对 Tier A（80.28 pt）与 Tier B（87.28 pt）的独立坐标核销断言，重新编译 8 份标准交付物并实现 100% 满分通过（退出码 0）
  - **操作要点**：
    1. 在 `run_master_msds_audit.mjs` 中更新 Item 154 物理断言，严谨分层核销：
       - Section 8、9、14 标签首字坐标 80.28 pt [PASS]；
       - Section 11 标签首字坐标 87.28 pt，折行次行（“性：”）坐标 87.28 pt [PASS]；
    2. 重新编译 PU-2346A 8 份标准交付物并同步到 `E:\冠志\TDS MSDS (2)\待处理文件\PU-2346A\`；
       3. 运行中央主审计套件 170 项验证；
    4. 记录根因与解法至 `CHANGELOG.md`。
  - **验收门禁**：Master MSDS Audit 170/170 项全绿，真实退出码 0。
