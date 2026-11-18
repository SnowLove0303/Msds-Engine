# pu608-canonical-deliverables Specification

## Purpose
TBD - created by archiving change pu608-canonical-deliverables. Update Purpose after archive.

## Requirements

### Requirement: 事实保全与无损继承规范
系统 SHALL 无损识别并提取 `PU-608` 源文件的全部 16 章节化学事实。GHS 生殖毒性 1B（H360）与信号词“危险”必须 100% 继承。Section 3 的 3 项核心组分（聚氨酯分散体、去离子水、NMP）及浓度范围必须完整保全，源文件修订日期 `2023/09/27` SHALL 完整映射到产出物表头元数据中。

#### Scenario: 源文件事实全量保全
- **GIVEN** 源文件 `PU-608 msds_CN 冠志.docx`
- **WHEN** 调用 MSDS-Engine 识别与装配流水线
- **THEN** 产出物的 16 章节化学事实、GHS 分类与 CAS 组分数据必须与源文件 1:1 吻合，无任何信息阉割。

---

### Requirement: 英文合规与零汉字断言规范
系统导出的英文版本（包括冠志英文与国彩英文）SHALL 遵循国际化学品专业术语规范。英文版本中严禁残留任何中文字符，`assertZeroChinese` 机械断言必须以 0 违规项通过。

#### Scenario: 英文母版与派生版零汉字检验
- **GIVEN** 已生成的 `PU-608 msds_EN 冠志.docx` 与 `PU-608 msds_EN 国彩.docx`
- **WHEN** 运行底座 `assertZeroChinese` 质量门禁检测
- **THEN** 检测结果必须为 0 处汉字残留，通过断言。

---

### Requirement: 交付目录纯净度与标准 8 格式交付规范
系统输出目标目录 `算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608` SHALL 严格且仅包含 8 个法定交付物（4 份 DOCX + 4 份高保真 PDF），目录纯净度检查必须 100% 通过。

#### Scenario: 8 格式文件完备性与目录纯净度检查
- **GIVEN** 完成全流程导出的目标目录
- **WHEN** 执行目录文件扫描
- **THEN** 目录内必须严格包含 8 个指定命名规则的交付文件，且不得包含任何临时文件、日志或多余产物。
