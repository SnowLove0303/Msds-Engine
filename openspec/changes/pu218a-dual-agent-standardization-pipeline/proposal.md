# Proposal: PU-218A TDS 与 MSDS 双智能体协同标准化覆写

## 1. 业务意图与背景
根据用户法定指令，对 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\1-1 单组份水性聚氨酯树脂 PU\PU-218A` 下的 `PU-218A msds_CN 冠志.docx` 与 `PU-218A tds_CN 冠志.docx` 进行独立覆写标准化生产。由 TDS 专职 Subagent 负责 TDS 8 格式标准化，MSDS 专职 Subagent 负责 MSDS 8 格式标准化。产出物严格限定为各自的 8 格式正式文件，物理落盘于 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-218A`。

## 2. 需求物理对账矩阵 (Spec-Kit RTM) 1:1 守恒注入

| 需求条目 | 原始意图 | 场景故事 | 详细功能契约 | 独立验收指标 |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | 源文件物理定位 | 作为标准化系统，准确读取输入底稿 | 解析 `PU-218A msds_CN 冠志.docx` 与 `PU-218A tds_CN 冠志.docx` | 源文件存在且提取数据完整 |
| **REQ-02** | TDS 专职覆写 | 作为文档工程师，TDS Subagent 装配 TDS 8 格式 | 运行 `tds-four-variant-eight-deliverable-standardizer` 规范与流水线 | 产出 TDS 4 DOCX + 4 PDF，中英双语、双主体 |
| **REQ-03** | MSDS 专职覆写 | 作为文档工程师，MSDS Subagent 装配 MSDS 8 格式 | 运行 MSDS Studio 官方流水线，执行 9 大排版与几何不可变量铁律 | 产出 MSDS 4 DOCX + 4 PDF，Sec 2/9/11/13/页脚 100% 合规 |
| **REQ-04** | 交付物格式纯度 | 交付管理者要求目录仅保留正式 8 格式文件 | 每个体系各 8 份文件（共 16 份），严禁中间 dump、临时脚本或废件留存 | TDS 8 份，MSDS 8 份，零多余垃圾 |
| **REQ-05** | 专有归档路径 | 归档系统要求物理存储至指定目标专有目录 | 严格输出到 `算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-218A` | 16 份交付物全部安全落盘目标目录 |
| **REQ-06** | 零信任双重审计 | 质量负责人要求实测复测与 Git 零污染 | 主 Agent 全程监督、执行机械全景审计与激光对齐核验，真实退出码 0 | 测试退出码 0，Git 状态干净 |
