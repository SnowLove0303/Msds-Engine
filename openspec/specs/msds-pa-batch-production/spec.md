# msds-pa-batch-production Specification

## Purpose
TBD - created by archiving change 2026-11-16-pa-batch-02-2-hydroxy-acrylic-emulsion-production. Update Purpose after archive.

## Requirements

### Requirement: 13 型号源文档发现与排他性提取 (REQ-01)
系统 SHALL 自动遍历 `算法训练材料/源文件材料/2-2 水性羟基丙烯酸乳液 PA RA` 目录下 13 个型号子目录，排他性锁定 MSDS 源文件（排除 TDS）。

#### Scenario: 13 型号源文件排他性锁定与格式识别
- **WHEN** 启动批量生产调度
- **THEN** 系统 SHALL 检出 PA-4000、PA-4006、PA-4771、PA-4778、PA-4800、PA-4804T、PA-4807、PA-4808、PA-4812、PA-4816、PA-4817、PA-4819、PA-4835 共 13 份 MSDS 源文档，排他过滤 TDS 文件，若检测到 `.doc` 格式则自动调用 LibreOffice 无损转换为 `.docx` 实体。

### Requirement: 通用流水线批量覆写与排版几何硬锁 (REQ-02)
系统 SHALL 对 13 个型号分别调用通用流水线 `run_universal_msds_pipeline.mjs`，落实六大排版几何硬指标（INV-ZERO-EXOGENOUS、INV-S2-TYPOGRAPHY-HIERARCHY、INV-SEQ-TAB-ALIGN 等），生成 4 DOCX + 4 PDF。

#### Scenario: Section 2 非危化品零外生虚增
- **WHEN** 生成非危险化学品型号的 Section 2 危险性概述
- **THEN** 系统 SHALL 绝对禁止凭空添加“GHS象形图：无”或“信号词：无”，分类标题保持普通字重，正文首字严格垂直对齐。

#### Scenario: 单制表符、多列顶格与单位西文规范化
- **WHEN** 装配章节标签与多列表格值
- **THEN** 序号与标签间必须使用单个 `<w:tab/>`，未编号标签基线齐平，多列填写值紧贴 108 dxa 顶格对齐，度数统一标准化为 `°C`。

#### Scenario: 专业化学英译与中文零残留
- **WHEN** 生成英文版交付物
- **THEN** 英文文本行文地道、符合 OECD/GHS 规范，且中文字符数严格为 0。

### Requirement: 104 份标准交付物精确释放与法医级主审计 (REQ-03)
系统 SHALL 将 13 个型号的 8 格式交付物释放至对应目标目录，并级联通过法医深度审计。

#### Scenario: 104 份交付物持久化落盘
- **WHEN** 各型号覆写与矢量转换完成
- **THEN** 系统 SHALL 在 `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/<ModelCode>/` 目录下精确释放 4 DOCX + 4 PDF，单文件体积 > 20KB，批次修改时间戳差 < 5 分钟。

#### Scenario: 级联全景法医级深度审计全绿
- **WHEN** 运行各型号中央主审计与双极双层审计
- **THEN** 13 个型号的主审计退出码必须恒为 0（AUDIT_PASSED，Failures: 0）。
