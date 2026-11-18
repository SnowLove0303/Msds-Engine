# Tasks: HPU-7700 工业级标准生产与全量法医审计

- [x] **Task 1: 编写并执行 HPU-7700 八格式成果生产脚本**
  - 描述: 编写 `web/scripts/produce_hpu7700_deliverables.mjs`，调用原生 `executeEightDeliverablesPipeline` 接入 HPU-7700 源事实，产出 4 DOCX + 4 PDF 交付物。
  - 依赖: 无
  - 验证命令: `node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\produce_hpu7700_deliverables.mjs"`
  - 验收标准: 8 份交付物全部生成，大小 > 20KB，时间戳在 5 分钟内，退出码为 0。

- [x] **Task 2: 执行排版几何不变量测试套件审计**
  - 描述: 运行 `web/tests/test_editor_indent_and_alignment_invariants.mjs`，验证产出物的序号间距、标签对齐和多列顶格。
  - 依赖: Task 1
  - 验证命令: `node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\tests\test_editor_indent_and_alignment_invariants.mjs" --suite=all`
  - 验收标准: spacing, label-alignment, value-alignment 三大子套件全部 100% 通过，退出码为 0。

- [x] **Task 3: 执行双极双层法医级全景深度审计**
  - 描述: 运行 `audit_bipolar_bilayer.mjs`，针对 HPU-7700 产出物执行 165 项双极双层法医级审计。
  - 依赖: Task 2
  - 验证命令: `node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\audit_bipolar_bilayer.mjs" "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-2 水性羟基聚氨酯树脂 HPU\HPU-7700" "HPU-7700"`
  - 验收标准: Failures 为 0，退出码为 0。

- [x] **Task 4: 执行集中式中央主审计套件**
  - 描述: 运行 `run_master_msds_audit.mjs`，针对 HPU-7700 产出物执行 168 项全景物理不变量与局部契约核查。
  - 依赖: Task 3
  - 验证命令: `node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\run_master_msds_audit.mjs" --model=HPU-7700 --targetDir="F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-2 水性羟基聚氨酯树脂 HPU\HPU-7700" --sourceDocx="F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\1-2 水性羟基聚氨酯树脂 HPU\HPU-7700\HPU-7700 msds_CN 冠志.docx"`
  - 验收标准: Failures 为 0，退出码为 0。

- [x] **Task 5: 智能体语义规范核销与 1:1 双向物理对账交付**
  - 描述: 逐项核对源文件事实与交付物内容，出具 1:1 双向物理核销清算表，通过 VS Code 检阅通道提请用户终审并更新 CHANGELOG。
  - 依赖: Task 4
  - 验证命令: `git -C "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine" status`
  - 验收标准: 核销清算表事实指纹 100% 闭环，CHANGELOG 记录完整。
