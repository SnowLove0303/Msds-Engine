# Tasks: EP-1501 六大双语细节瑕疵治理执行清单

- [x] 1. **单焦点执行锁：在流水线中实现双语瑕疵精准纠偏** <!-- id: 1 -->
  - [x] 1.1 在 `generate_ep1501_standard_deliverables.mjs` 中构建 `refineEp1501BilingualTexts` 解决 6 大问题并通过 VS Code Diff 检阅
- [x] 2. **八格式标准交付物重新受控生成与原生 COM PDF 转译** <!-- id: 2 -->
  - [x] 2.1 重新导出 4 份 DOCX 并使用 Windows COM WPS/Word 转译 4 份原生 PDF
- [x] 3. **两阶双轨全景机械终审与归档** <!-- id: 3 -->
  - [x] 3.1 运行双极双层法医审计套件 (`audit_bipolar_bilayer.mjs`) 验证 0 违章
  - [x] 3.2 运行集中式中央主审计套件 (`run_master_msds_audit.mjs`) 验证 167 项全绿通过
  - [x] 3.3 提交 Git 原子变更并出具 1:1 双向物理核销清算表
