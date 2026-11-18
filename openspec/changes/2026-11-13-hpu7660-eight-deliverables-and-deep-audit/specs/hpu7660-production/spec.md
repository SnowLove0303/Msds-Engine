# Spec: HPU-7660 标准交付物生成与两阶双轨全要素深度审计

## 1. 源事实解析与治理契约 (Source Recognition & Governance)

### REQ-SPEC-HPU7660-01: 原始输入事实保真与零虚增
- **SHALL**: 系统 SHALL 从 `算法训练材料/源文件材料/1-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_CN 冠志.docx` 提取 16 章节全部原始事实，生成结构化 Context 1。
- **WHEN**: 当化学品未被分类为 GHS 危险品时 (`ghs.isHazardous === false`)：
  - **THEN**: 系统 SHALL 强制设置 `pictogramCount: 0`, `hasPictograms: false`, `signalWord: null`，严禁输出外生虚增的“象形图: 无”或“信号词: 无”。
- **SHALL**: 系统 SHALL 将全部 3 项化学组分（聚氨酯聚合物、水、N,N-二甲基乙醇胺）及其 CAS、浓度区间完整传递，严禁丢失或篡改。

### REQ-SPEC-HPU7660-02: 专业化学翻译与术语一致性
- **SHALL**: 系统 SHALL 在英文治理模型中使用国际通用的化学名称：
  - `聚氨酯聚合物` SHALL 翻译为 `Polyurethane polymer`；
  - `水` SHALL 翻译为 `Water`；
  - `N,N-二甲基乙醇胺` SHALL 翻译为 `2-Dimethylaminoethanol` (CAS: 108-01-0)；
  - `商业机密` SHALL 翻译为 `Trade secret`。

## 2. 交付物矩阵与排版几何契约 (Deliverables & Typography Invariants)

### REQ-SPEC-HPU7660-03: 标准 8 格式全矩阵交付
- **SHALL**: 系统 SHALL 在目标目录 `算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7660/` 生成 8 份标准文件：
  1. `HPU-7660 msds_CN 冠志.docx`
  2. `HPU-7660 msds_CN 国彩.docx`
  3. `HPU-7660 msds_EN Guanzhi.docx`
  4. `HPU-7660 msds_EN Guocai.docx`
  5. `HPU-7660 msds_CN 冠志.pdf`
  6. `HPU-7660 msds_CN 国彩.pdf`
  7. `HPU-7660 msds_EN Guanzhi.pdf`
  8. `HPU-7660 msds_EN Guocai.pdf`
- **THEN**: 每份文件的物理大小 SHALL 均大于 20,000 字节，具备完整的 Word/PDF 结构。

### REQ-SPEC-HPU7660-04: 底层排版几何不变量硬锁
- **SHALL**: 所有段落中的序号与标签之间 SHALL 严格使用单个 `<w:tab/>` 连接，绝对禁止空格伪对齐；
- **SHALL**: 短序号（$\le 5$ 字符）段落制表位与悬挂缩进 SHALL 为 420 dxa (0.74cm)，长序号（$> 5$ 字符）段落 SHALL 为 560 dxa (0.99cm)；
- **SHALL**: 多列数据单元格（`cells.length > 1`）值段落 SHALL 剔除 `w:ind`，与单元格 108 dxa 内边距保持顶格对齐；单列通栏（Section 2 GHS 条目）SHALL 保留 `s2SubValueIndent` 层次缩进；
- **SHALL**: 3+ 列数据表格（Section 3 成分表）Column 0 SHALL 不施加标签悬挂缩进。

## 3. 两阶双轨深度审计契约 (Audit Invariants)

### REQ-SPEC-HPU7660-05: 机械确定性审计准入门禁
- **SHALL**: 系统 SHALL 运行中央主审计脚本 `runMasterMsdsAudit`，159 项要素探针检测结果中违规项数 SHALL 为 0；
- **SHALL**: 系统 SHALL 运行双极双层审计脚本 `runBipolarBilayerAudit`，失败项数 SHALL 为 0；
- **SHALL**: 系统 SHALL 运行排版几何测试套件 `test_editor_indent_and_alignment_invariants.mjs`，通过率 SHALL 达到 100%。

### REQ-SPEC-HPU7660-06: 智能体语义规范审计与 1:1 双向物理核销
- **SHALL**: 审计智能体 SHALL 逐条比对 16 章节源事实与交付物双语内容，确保 0 事实捏造与 0 事实丢失；
- **SHALL**: 系统交付前 SHALL 出具《HPU-7660 MSDS 1:1 双向物理核销清算表》，并绑定 `[Measured]` 实测凭据。
