# Tasks: PU-608 标准 8 格式全量交付与验证

- [x] Task 1: 编写并验证 PU-608 执行驱动脚本 <!-- id: 1 -->
  - [x] 1.1 创建 `web/scripts/generate_pu608_canonical_deliverables.mjs`，调用 MSDS-Engine 原生流水线接口 `executeEightDeliverablesPipeline`
  - [x] 1.2 配置源文件路径 `算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-608/PU-608 msds_CN 冠志.docx`
  - [x] 1.3 配置目标产出路径 `算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608`
- [x] Task 2: 执行 12 阶状态透明播报与真实生产流水线 <!-- id: 2 -->
  - [x] 2.1 提取源文件 16 章节化学事实与透视模板
  - [x] 2.2 装配中文母版、英文母版及冠志/国彩双实体预设
  - [x] 2.3 批量持久化生成 4 份 DOCX 并启动无头引擎生成 4 份 PDF
- [x] Task 3: 严格质量终审与 1:1 事实物理对账 <!-- id: 3 -->
  - [x] 3.1 运行双极双层及四维审计脚本，确保退出码 0 [Measured]
  - [x] 3.2 验证交付目录纯净度（物理文件严格为 8 个）
  - [x] 3.3 运行 `msds_compare_source_with_output` 确认无遗漏 Gap
- [x] Task 4: 规范归档与 CHANGELOG 沉淀 <!-- id: 4 -->
  - [x] 4.1 运行 `npx openspec validate pu608-canonical-deliverables --strict`
  - [x] 4.2 更新 CHANGELOG.md 并进行 Git 提交
