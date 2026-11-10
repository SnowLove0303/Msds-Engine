# 实施任务清单：全 16 章节多列表格值单元格纯净左对齐、通栏层级缩进与 Section 14 源文件主权动态重构

> **单任务专注锁机制 (Single-Focus Lock)**：同一时刻严格只能有 1 个任务处于 `[-]` 进行中状态，前置任务验证完全通过（真实退出码 0）后方可解锁并推进下一项。严禁并行涂鸦！

## 实施阶段任务分解

- [x] **Task 1: 多列表格第 1 列值单元格缩进清零与纯净左对齐底层重构 (REQ-TOPOLOGY-B)**
  - **因果目标**：彻底从 `universal-editor-primitives.js` 中清除多列表格值单元格的 `w:left="240"` 缩进，确立纯净左对齐
  - **操作要点**：
    1. 在 `universal-editor-primitives.js:applyGlobalTypographyProjection` 中，彻底移除 `isSubLabelRow && cIdx === 1` 注入 `w:left="240"` 的逻辑；
    2. 对多列表格（`cells.length > 1`）中所有的值单元格（`cIdx >= 1`），段落统一清理残留的 `w:left` 与 `w:leftChars`，实现纯净左对齐；
    3. 验证命令：检查生成的 DOCX XML，确认 Section 1 及其他多列表格 Column 1 段落无 `w:left="240"`。
  - **验收门禁**：多列表格第 1 列段落 `w:left` 缩进数 = 0。[PASS]

- [x] **Task 2: Section 2 通栏值段落层级缩进保全与不变性封印 (REQ-TOPOLOGY-A)**
  - **因果目标**：确保 Section 2 内部“预防措施/事故响应/安全储存/废弃处置”等值段落继续完美保持阶梯缩进，不受多列表格左对齐改造的任何干扰
  - **操作要点**：
    1. 核查 `docx-engine.js:renderFullWidthRow` 中 Section 2 通栏行渲染逻辑，确保 `s2BaseIndent` 与 `s2SubValueIndent` 完整生效；
    2. 验证命令：检查生成的 DOCX XML，确认 Table 2（Section 2）值段落保持阶梯缩进。
  - **验收门禁**：Section 2 通栏值段落缩进 100% 保持，层级结构分明。[PASS]

- [x] **Task 3: Section 14 源文件主权动态重构引擎升级与参考模板写法重组 (REQ-S14-SOVEREIGNTY)**
  - **因果目标**：彻底告别将危化品要素塞入底模“公路和铁路运输”的做法，实现以模板写法构建源文件 7 大危化品运输要素的标准表格
  - **操作要点**：
    1. 在 `pipeline-engine.js:buildDynamicSection14Table` 中，重构表格组装逻辑：
       - 当源文件为 UN GHS 要素模式时，动态生成 7 行（14.1 联合国编号、14.2 联合国运输名称、14.3 运输危险类别、14.4 包装组、14.5 环境危害、14.6 用户特殊防范措施、14.7 按MARPOL73/78公约附则II和IBC规则）；
       - 英文版同步镜像生成 7 行（14.1 UN number、14.2 UN proper shipping name、14.3 Transport hazard class、14.4 Packing group、14.5 Environmental hazards、14.6 Special precautions for user、14.7 MARPOL 73/78 Annex II and IBC Code）；
       - 规范每一行的格式：2800 dxa / 6981 dxa，420 dxa 悬挂缩进 + `<w:tab/>` 黄金锚点，值单元格纯净左对齐；
    2. 验证命令：检查重构后 Section 14 表格结构与文本，确保 7 行独立规范呈现。
  - **验收门禁**：Section 14 具备 7 行完整危化品运输事实，杜绝生搬硬套。[PASS]

- [x] **Task 4: 中央主审计套件同步调整与 170 项全绿通过回归 (REQ-TOPOLOGY-GLOBAL)**
  - **因果目标**：调整主审计套件中对值单元格对齐与 Section 14 的断言定义，重新编译 8 份标准交付物并实现 100% 满分通过（退出码 0）
  - **操作要点**：
    1. 在 `run_master_msds_audit.mjs` 中更新 Item 151 / 155 物理断言，严谨核销多列表格纯净左对齐、Section 2 通栏缩进与 Section 14 动态行；
    2. 执行底层流水线重新编译 8 份交付物并同步到 `E:\冠志\TDS MSDS (2)\待处理文件\PU-2346A\`；
    3. 运行中央主审计套件验证；
    4. 记录根因与解法至 `CHANGELOG.md`。
  - **验收门禁**：Master MSDS Audit 170/170 项全绿，真实退出码 0。[PASS]
