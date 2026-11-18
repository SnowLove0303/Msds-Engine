# Tasks: HPU-7660 工业级标准生产与全量法医审计

- [x] **Task 1: 补充化学词典与英译规则 (DMEA & 理化特性)**
  - 描述: 在 `web/src/context-governor.js` 中扩充 `CHEMICAL_TRANSLATION_DICT`，加入 `N,N-二甲基乙醇胺` (`2-Dimethylaminoethanol`)、`透明至半透明液体`、`初沸点以下无闪点` 等常用化学与物性专业英译。
  - 依赖: 无
  - 验证命令: `node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\recognize_hpu7660.mjs"`
  - 验收标准: 组分与理化指标英译无中文字符残留，退出码为 0。

- [x] **Task 2: 编写并执行 HPU-7660 八格式成果生产脚本**
  - 描述: 编写 `web/scripts/produce_hpu7660_deliverables.mjs`，调用通用编辑器写入并导出 4 份 DOCX，转换为 4 份原生 PDF，存入 `算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7660/`。
  - 依赖: Task 1
  - 验证命令: `node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\produce_hpu7660_deliverables.mjs"`
  - 验收标准: 8 份交付物全部生成，大小 > 20KB，退出码为 0。

- [x] **Task 3: 执行排版几何不变量测试套件审计**
  - 描述: 运行 `web/tests/test_editor_indent_and_alignment_invariants.mjs`，验证产出物的序号间距、标签对齐和多列顶格。
  - 依赖: Task 2
  - 验证命令: `node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\tests/test_editor_indent_and_alignment_invariants.mjs" --suite=all`
  - 验收标准: spacing, label-alignment, value-alignment 三大子套件全部 100% 通过，退出码为 0。

- [x] **Task 4: 执行历史 Pipeline 159 项要素探针与双极双层法医级审计**
  - 描述: 运行 `run_master_msds_audit.mjs` 和 `audit_bipolar_bilayer.mjs`，针对 HPU-7660 产出物执行全景要素审计。
  - 依赖: Task 3
  - 验证命令: `node "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\run_master_msds_audit.mjs" --model=HPU-7660`
  - 验收标准: Failures 为 0，退出码为 0。

- [x] **Task 5: 智能体语义规范对抗式审计与 1:1 双向物理核销交付**
  - 描述: 逐项核对源文件事实与交付物内容，出具 1:1 双向物理核销清算表，通过 VS Code 检阅通道提请用户终审并更新 CHANGELOG。
  - 依赖: Task 4
  - 验证命令: `git -C "F:\App Location\Guanzhi Tong\Skill\MSDS-Engine" status`
  - 验收标准: 核销清算表事实指纹 100% 闭环，CHANGELOG 记录完整。
