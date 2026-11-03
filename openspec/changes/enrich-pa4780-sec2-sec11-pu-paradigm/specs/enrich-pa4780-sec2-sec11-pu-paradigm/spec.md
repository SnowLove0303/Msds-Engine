# Spec: PA-4780 Section 2 与 Section 11 深度扩充规范

## ADDED Requirements

### Requirement: Section 2 危害性概述全维扩充
系统 SHALL 根据 2-丁氧基乙醇成分事实，在 Section 2 扩充 6 大 GHS 危险性分类与四维防范说明。

#### Scenario: 生产包含完整危害与防范声明的 Section 2
- **WHEN** 流水线处理 PA-4780 时
- **THEN** 2.1 章节 SHALL 包含急性毒性4类（经口/经皮/吸入）、皮肤刺激2类、眼睛刺激2A类及水环境慢性危害3类
- **AND** 2.2 章节 SHALL 包含 GHS07 象形图、警告词、H302/H312/H332/H315/H319/H412 危害语句与预防/响应/储存/处置四维防范说明

### Requirement: Section 11 升级为 PU 标杆结构化表格 (Paradigm 2)
系统 SHALL 将 PA-4780 Section 11 升级为与 PU-608 / PU-202A 同构的标准插槽表格。

#### Scenario: 渲染 11.1~11.10 全端点结构化表格
- **WHEN** 渲染 PA-4780 Section 11 时
- **THEN** 表格总行数 SHALL $\ge 12$
- **AND** 包含经口 LD50（1,746 mg/kg）、吸入 LC50（2.2 mg/l）、经皮 LD50（>2,000 mg/kg）
- **AND** 包含兔子皮肤刺激、眼睛严重刺激、豚鼠无致敏性、Ames 试验阴性、IARC 3类致癌及经皮吸收附加信息
- **AND** 英文版双语表格行数与结构 SHALL 与中文版 1:1 绝对同构
