# Tasks: 拓扑结构模板页眉页脚原生继承与全16章节统一排版执行计划

- [x] 1. 拓扑层重构：解除外部破坏性覆写，默认继承模板原生页眉页脚样式 (REQ-TOPO-HF-INHERIT-01)
  - [x] 1.1 从 `web/src/universal-editor-primitives.js` 的 `applyGlobalTypographyProjection` 中彻底移除对 `word/header*.xml` 与 `word/footer*.xml` 的字号清洗和粗体剥离循环
  - [x] 1.2 在 `web/src/docx-engine.js` 的 `updateHeaderFooterData` 中，确保仅在占位节点上更新纯文本，完整保留模板原生的字体、字号、加粗、底纹与段落对齐
  - [x] 1.3 编写测试用例 `web/tests/test_header_footer_template_inheritance.mjs`，验证不同模板加载后，页眉大标题（22pt加粗居中）、型号框（18pt灰底加粗居中）、版本号（9pt右对齐）、页脚公司型号（10.5pt）、修订日期（10pt灰）与动态页码域完整保真
  - *验证命令*: `node web/tests/test_header_footer_template_inheritance.mjs` (退出码 0)

- [x] 2. 全 16 章节大/小标题、序号、标签、说明行、值文本格式统一重构与 Design Tokens 解耦 (REQ-TYPO-UNIFIED-TOKENS-02)
  - [x] 2.1 在 `web/src/universal-editor-primitives.js` 中梳理并完备 `MSDS_DESIGN_TOKENS`（中英文双轨：大标题、小标题、序号、标签、说明行、值）
  - [x] 2.2 重构 `applyGlobalTypographyProjection` 中的章节遍历引擎，严格按五大语义分类对 16 个章节的所有单元格实施标准化投影，彻底覆写模板历史残留格式
  - [x] 2.3 编写测试用例 `web/tests/test_unified_section_typography.mjs`，验证全 16 章节所有单元格 100% 命中 Design Tokens，零未定义非标字体与字号方差
  - *验证命令*: `node web/tests/test_unified_section_typography.mjs` (退出码 0)

- [x] 3. 既有全局与局部规范及 Pipeline 核心细节设计全量继承加固 (REQ-PIPELINE-INVARIANTS-PRESERVE-03)
  - [x] 3.1 在 `web/src/editor-writer.js` 中确保 `enforceStructuralTypographyInvariants` 与 `applyGlobalTypographyProjection` 无缝咬合
  - [x] 3.2 针对 Section 2 两行通栏、Section 3 表头加粗与行克隆、Section 8 暴露限值与手部防护、Section 9 激光垂线对齐、Section 13 英文左对齐、Section 14 合规文本、420/560 dxa 悬挂缩进及标点清洗进行全链路回归验证
  - [x] 3.3 重新生成 HPU-7651 的 8 格式交付物（4 DOCX + 4 PDF），并运行全维度深度审计套件
  - *验证命令*: `node web/scripts/export_hpu7651_deliverables.mjs && node web/scripts/run_exhaustive_msds_audit.mjs --targetDir="算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7651"` (退出码 0)

- [x] 4. 1:1 双向物理核销与 OpenSpec 合流归档 (REQ-TOPO-HF-INHERIT-01 ~ REQ-PIPELINE-INVARIANTS-PRESERVE-03)
  - [x] 4.1 汇总结算实测证据与事实指纹
  - [x] 4.2 运行 `openspec validate 2026-11-13-topology-template-inheritance-and-unified-section-typography --strict` 确保零错误零警告
  - [x] 4.3 呈现 VS Code 原生两栏 Diff 检阅通道，呈报最终交付报告
