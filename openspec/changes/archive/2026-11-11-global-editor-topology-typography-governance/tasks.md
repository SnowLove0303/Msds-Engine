# Implementation Tasks: 全局编辑器底层拓扑字阶与排版治理任务集

> 依据 Roo-Code/Cline 启发与 OrbitStack 法则：采用 `[-]` 单任务专注锁，同一时刻严格只能有 1 个任务处于进行中，测通后方可推进下一项。源码修改必须通过 `vscode-review` MCP 呈现 Native Diff。

- [x] Task 1: 升级 `universal-editor-primitives.js` 底层设计令牌与全域排版投影中枢 <!-- id: task-01 -->
  - **因果目标**: 建立不可动摇的设计令牌真理源，彻底删除 `? '15' : '18'` 糟粕，全面覆盖页眉页脚、16章节大标题、序号、标签与值的全量投影
  - **施工动作**:
    1. 在 `MSDS_DESIGN_TOKENS` 中补齐 Header/Footer/Section Header 完备定义；
    2. 在 `applyGlobalTypographyProjection` 中增加页眉页脚 XML 节点投影；
    3. 在 `applyGlobalTypographyProjection` 中解除 `rIdx === 0` 跳过，强行同化全 16 章节大标题；
    4. 彻底删除英文序号 `(seqStr.length >= 5 ? '15' : '18')`，统一锁定为 `MSDS_DESIGN_TOKENS.EN.LABEL_SEQ.sz` (`'19'`)；
    5. 在值格与通栏复合行中内置自动解耦逻辑，确保标签加粗、值常规体；
  - **实测验证**: 运行 `node web/scripts/lint_code_invariants.mjs`，退出码必须为 0。

- [x] Task 2: 强化 `docx-engine.js` 通栏行与 Section 9 单元格的原生 XML 完备性 <!-- id: task-02 -->
  - **因果目标**: 保证底层 `renderFullWidthRow` 与 `formatSection9LabelCell` 生成的节点完整具备 `sz`, `szCs`, `rFonts`
  - **施工动作**:
    1. 完善 `renderFullWidthRow`，对所有 Run 同时注入 `w:sz` 与 `w:szCs`，并补全 `w:cs` 字体属性；
    2. 在 `renderFullWidthRow` 的 kvMatch 分支中，直接输出加粗标签 Run 与常规体值 Run；
    3. 校验 `formatSection9LabelCell`，中英文序号与标签严格应用标准字阶。
  - **实测验证**: 单元测试 `test_universal_editor.mjs` 退出码 0。

- [x] Task 3: 净化流水线与模型生成脚本，剥离脆弱 DOM 正则补丁 <!-- id: task-03 -->
  - **因果目标**: 将业务层与具体型号脚本中的重复、冲突排版代码彻底清理，实现一键极速生产
  - **施工动作**:
    1. 清理 `web/src/pipeline-engine.js` 中多余的散落字号补丁，统一交由 `applyGlobalTypographyProjection` 执行；
    2. 清理 `web/scripts/generate_os8970_deliverables.mjs` 中的 300 行手工 XML 正则，仅保留事实组装与标准流水线调用。
  - **实测验证**: 脚本单次执行时长在 45 秒内，成功生成 8 格式标准交付物。

- [x] Task 4: 加固中央主审计套件并执行全量 16 章节双向对账核销 <!-- id: task-04 -->
  - **因果目标**: 消除审计盲区，对全篇 16 章节所有英文序号执行零容忍 9.5pt (`sz="19"`) 断言，确保所有产出物 100% 合规
  - **施工动作**:
    1. 在 `run_master_msds_audit.mjs` 中增加针对英文第 0 列序号/标签字号的专项遍历断言；
    2. 执行 `runMasterMsdsAudit`，实现 158/158 全量通过（0 警告，0 错误，退出码 0）；
    3. 运行全章节微观字号扫描脚本，输出 0 违规报告。
  - **实测验证**: `node web/scripts/run_master_msds_audit.mjs --model OS-8970` 真实退出码 0。
