# Specification: PA-3653 与 PA-3654 双轨生产与混合排版解析行为契约

## 1. 混合排版识别引擎规范 (Hybrid Document Parsing Specification)

### 1.1 章节持久状态机维护 (State Machine Continuity)
- **SHALL**: 识别引擎 `recognizeSourceDocx` 必须在遍历 `engine.records` 的整个生命周期内维护跨记录的持久章节状态 `currentSecNum` 与 `currentSecTitle`。
- **WHEN**: 遇到 `kind: 'text'` 记录且内容匹配 `1~16` 章节大标题时：
  - **THEN**: 引擎 SHALL 将 `currentSecNum` 更新为对应的章节数字，并将 `currentSecTitle` 更新为标准化标题。
- **WHEN**: 遇到 `kind: 'text'` 记录且内容非章节大标题，但此时 `currentSecNum` 处于 1~16 激活状态时：
  - **THEN**: 引擎 SHALL 提取段落内容，将其按换行或冒号键值对映射为规范数据行，注入至 `facts.sections[currentSecNum]`。
- **WHEN**: 遇到 `kind: 'table'` 记录且自身 `record.sectionNumber` 为 `null` 时：
  - **THEN**: 引擎 SHALL 优先判定 Row 0 是否内嵌章节标题；若无内嵌标题，SHALL 继承由前序段落激活的 `currentSecNum`。

### 1.2 组分与理化指标无损提取 (Fact Extraction Guarantee)
- **SHALL**: 针对 `PA-3653 MSDS（冠志）.docx`：
  - **THEN**: Section 3 SHALL 成功提取至少 3 项组分（`丙烯酸共聚物`、`去离子水`、`氨水`），且浓度值与 CAS 号完整。
  - **THEN**: Section 9 SHALL 成功提取至少 10 项原始理化参数（外观、pH值、沸点等）。
- **SHALL**: 针对 `PA-3654 MSDS（冠志）.docx`：
  - **THEN**: Section 3 SHALL 成功提取至少 3 项组分，Section 9 SHALL 成功提取至少 10 项原始理化参数。

---

## 2. MSDS 交付物产出与法医级审计规范 (MSDS Deliverables & Forensic Audits)

### 2.1 交付矩阵规格 (Delivery Matrix)
- **SHALL**: 针对 `PA-3653`，必须在目标目录 `02-1 单组份水性丙烯酸乳液 PA/PA-3653` 产出严格 8 份 MSDS 交付物：
  - `PA-3653 msds_CN 冠志.docx` & `.pdf`
  - `PA-3653 msds_CN 国彩.docx` & `.pdf`
  - `PA-3653 msds_EN Guanzhi.docx` & `.pdf`
  - `PA-3653 msds_EN Guocai.docx` & `.pdf`
- **SHALL**: 针对 `PA-3654`，必须在目标目录 `02-1 单组份水性丙烯酸乳液 PA/PA-3654` 产出严格 8 份 MSDS 交付物，命名规则与上述一致。

### 2.2 三阶法医级审计门禁 (Triple Forensic Audit Gates)
- **SHALL**: 所有产出的 MSDS DOCX 必须通过三大法医审计套件，退出码必须为 0：
  1. `audit_bipolar_bilayer.mjs`: 双极双层审计 165 项必须全部 PASS，FAIL 必须为 0。
  2. `run_master_msds_audit.mjs`: 主法医审计 167 项必须全部 PASS，FAIL 必须为 0。
  3. `audit_translation_dual_display.mjs`: 翻译行双显审计与原源文件 100% 映射一致。

---

## 3. TDS 交付物产出与发布规范 (TDS Deliverables via SubAgent)

### 3.1 TDS 生产与单页约束 (Single-Page Layout Contract)
- **SHALL**: SubAgent `tds-manager` 必须验证并确保 `PA-3653` 与 `PA-3654` 各自产出严格 8 份 TDS 交付物（4 DOCX + 4 PDF）。
- **SHALL**: 所有 TDS 交付物必须满足单页硬约束（`all_single_page=True`），严格杜绝溢出产生第 2 页空白或残行。
- **SHALL**: 运行 `audit_tds_eight.py`，发布状态必须为 `RELEASE_PASS`。
