# Tasks: PU-202A 通栏标准 8 格式全量交付与验证

- [x] Task 1: 改造 `web/src/pipeline-engine.js` 支持通用危险品与单组分通栏装配 <!-- id: 1 -->
  - [x] 1.1 扩展 `buildFullWidthSection2`：支持从 `engine.records` 或事实中动态提取危险品 GHS 分类、象形图图元、信号词与 H/P 说明，在 Row 1 单单元格通栏内装配
  - [x] 1.2 扩展 `buildThreeTierSection11`：支持从源事实中动态提取单组分（如 DMAC）前言与全套毒理试验指标，装配至 Row 3 通栏内
  - [x] 1.3 在 `buildBaseChineseEngine` 与 `buildBaseEnglishEngine` 中激活 PU-202A 通栏装配调用
- [x] Task 2: 改造 `web/scripts/audit_bipolar_bilayer.mjs` 终审门禁 <!-- id: 2 -->
  - [x] 2.1 支持传入目标型号（如 `PU-202A`），动态断言 Section 2 为 2 行通栏，Section 11 为 4 行三级责任隔离通栏
  - [x] 2.2 保持 G-01 绝对纯净断言（物理文件数严格为 8）
- [x] Task 3: 编写并执行 PU-202A 全流程生产脚本 <!-- id: 3 -->
  - [x] 3.1 创建 `web/scripts/generate_pu202a_deliverables.mjs`
  - [x] 3.2 清理 `算法训练材料/PU-202A/` 历史文件，启动流水线并运行双极双层及四维审计
  - [x] 3.3 验证 Exit Code 0 与交付目录纯净度
- [x] Task 4: 经验沉淀与版本归档 <!-- id: 4 -->
  - [x] 4.1 更新 CHANGELOG.md 与 tasks.md 打勾
  - [x] 4.2 Git atomic commit 归档
