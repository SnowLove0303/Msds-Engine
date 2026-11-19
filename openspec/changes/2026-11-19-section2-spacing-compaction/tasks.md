# Tasks: Section 2 排版间距紧实化执行清单

- [x] 1. **单焦点执行锁：在流水线中注入 Section 2 间距紧实化算法** <!-- id: 1 -->
  - [x] 1.1 在 `generate_ep1501_standard_deliverables.mjs` 中对中文与英文 DOCX 注入 Section 2 间距压缩（tcMar top/bottom=60 dxa, p before=100 dxa）
- [x] 2. **八格式标准交付物重新受控生成与原生 COM PDF 转译** <!-- id: 2 -->
  - [x] 2.1 导出 4 份 DOCX 并覆盖目标目录
  - [x] 2.2 调用 Windows COM WPS/Word 转译 4 份原生 PDF
- [x] 3. **两阶双轨全景机械终审与归档** <!-- id: 3 -->
  - [x] 3.1 运行双极双层法医审计套件 (`audit_bipolar_bilayer.mjs`) 验证 0 违章
  - [x] 3.2 运行集中式中央主审计套件 (`run_master_msds_audit.mjs`) 验证 167 项全绿通过
  - [x] 3.3 提交 Git 原子变更并出具 1:1 双向物理核销清算表
