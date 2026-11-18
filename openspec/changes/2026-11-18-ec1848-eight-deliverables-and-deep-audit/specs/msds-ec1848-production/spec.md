# Spec: EC-1848 标准 8 格式覆写产出与全要素深度审计

## ADDED Requirements

### Requirement: 流水线工作流资产绑定与底模前置清零 (REQ-01)
系统 SHALL 绑定 `MSDS_Studio_Agent_Test_Kit` 的标准底模与企业预设，并在写入前执行底模历史示范数据 100% 清零。

#### Scenario: 底模资产与双主体预设绑定
- **WHEN** 启动生产流水线
- **THEN** 系统 SHALL 加载 `正式模板_MSDS_CN_冠志(1).docx`、`正式模板_MSDS_EN_冠志(1).docx` 及 `company_presets.json`（冠志与国彩企业元数据）。

#### Scenario: 历史示范数据前置清零
- **WHEN** 进入编辑器装配阶段
- **THEN** 系统 SHALL 对 16 章节历史残留示范数据执行 100% 前置清零，使插槽处于纯净状态。

### Requirement: 源文件物理化学事实零损耗提取 (REQ-02)
系统 SHALL 零损耗摄入 `算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx`，提取 16 章节物理化学事实并生成 Context 1。

#### Scenario: Context 1 事实提取与机械反向证伪审计
- **WHEN** 运行受控识别流水线 `run_source_recognition.mjs`
- **THEN** 系统 SHALL 锁定型号为 `EC-1848`，品名为 `水性环氧固化剂`，GHS 判定为危险化学品（H412 警告），并由 `audit_context1_mechanical.mjs` 验证通过（退出码 0，CRITICAL: 0, WARNING: 0）。

### Requirement: 双主体双语 8 格式覆写与排版几何硬锁 (REQ-03)
系统 SHALL 落实危化品排版几何硬指标（H412 危害分类保全、INV-S2-TYPOGRAPHY-HIERARCHY、INV-SEQ-TAB-ALIGN 等），生成 4 DOCX + 4 PDF。

#### Scenario: Section 2 危化品分类与阶梯排版保真
- **WHEN** 生成 Section 2 危险性概述
- **THEN** 系统 SHALL 保留“对水环境有慢性危害 类别 3 (H412)”与信号词“警告”，无象形图，正文阶梯缩进首字严格垂线对齐。

#### Scenario: 单制表符与多列顶格对齐
- **WHEN** 装配章节标签与多列表格值
- **THEN** 序号与标签间必须使用单个 `<w:tab/>`，未编号标签基线齐平，多列填写值紧贴 108 dxa 顶格对齐。

#### Scenario: 专业化学英译与中文零残留
- **WHEN** 生成英文版交付物
- **THEN** 英文文本必须行文地道、符合 OECD/GHS 规范，且中文字符数严格为 0。

### Requirement: 8 格式交付物释放与两阶双轨全景深度审计 (REQ-04)
系统 SHALL 在目标目录自动创建文件夹并释放 8 份标准交付物，通过两阶双轨法医级深度审计。

#### Scenario: 目标目录自动创建与 8 格式标准交付物落盘
- **WHEN** 批量导出与无损矢量转换完成
- **THEN** 系统 SHALL 确保目录 `算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/` 自动创建并释放 4 份 DOCX 与 4 份 PDF，每个文件物理存在且大小 > 20KB。

#### Scenario: 两阶双轨全景深度审计全绿
- **WHEN** 运行中央主审计与双极双层法医审计
- **THEN** 173 项机械主审计与 165 项双极双层审计必须 100% 通过（AUDIT_PASSED，退出码 0）。
