# canonical-pa-benchmark-template Specification

## Purpose
TBD - created by archiving change canonical-pa-benchmark-template. Update Purpose after archive.

## Requirements

### Requirement: REQ-01 基于成分构建典型 Section 2 象形图与 H/P 规范
系统 SHALL 根据 PA-4780 的成分（2-丁氧基乙醇 8-15%）在 Section 2 中构建标准 GHS 分类、GHS 象形图图片、危害性说明（H412、H315、H319）与防范说明（P273、P280、P501 等）。

#### Scenario: 验证 Section 2 GHS 要素完备性
- **WHEN** 解析 PA-4780 交付物的 Section 2 时
- **THEN** 必须存在 GHS 象形图嵌入图片
- **AND** 必须包含 H412 水生环境慢性危害说明
- **AND** 必须包含 P273 与 P501 防范说明语句

### Requirement: REQ-02 基于成分构建典型 Section 11 毒理学实测参数
系统 SHALL 根据 2-丁氧基乙醇与丙烯酸聚合物的毒理学特征，在 Section 11 填充大鼠经口 LD50、经皮 LD50、吸入 LC50 及皮肤/眼睛刺激性、AMES 致突变性事实。

#### Scenario: 验证 Section 11 毒理学数据保全
- **WHEN** 审计 PA-4780 交付物的 Section 11 时
- **THEN** 经口 LD50 必须包含大鼠实测数据
- **AND** 必须包含皮肤与眼睛刺激性定性说明
- **AND** 严禁出现空洞无数据或防御性篡改

### Requirement: REQ-03 PA 典型官方模板注册与多实体受控派生
系统 SHALL 在 `web/public/templates/custom/` 注册典型 PA 官方母版，并通过 MSDS-Engine 原生流水线受控派生冠志与国彩、中文与英文标准 8 格式交付物。

#### Scenario: 验证标准 8 交付物受控产出
- **WHEN** 执行受控生成流水线时
- **THEN** 目标目录内物理文件总数严格等于 8
- **AND** 4 份 DOCX 与 4 份 PDF 法定命名必须完整存在且通过双极双层强审计 (Exit Code 0)
