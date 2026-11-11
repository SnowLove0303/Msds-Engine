# OpenSpec Proposal: EP-1404 8 格式标准交付物受控生产与全景主审计核销

## 1. 提案概述 (Executive Summary)
依据 **OrbitStack (Ps-openspec)** 轨道工程体系与 **AI-Harness** 工业级规范，本提案承接已通过 Gate 1 审批的《需求全量对账备忘录》，对 `EP-1404` 水性环氧树脂源文件实施无损事实解析与受控八格式交付物（4 DOCX + 4 PDF）编译生产。深度贯彻刚刚完成系统下沉的 Section 5 语义槽位物理归属（烟尘警示归入 5.3）以及全篇表格标签/值纯左对齐（`w:jc w:val="left"`）立法，最终通过双极双层 165 项主审计断言（退出码 0）并全量物理同步至外部协同目录。

## 2. 1:1 需求物理对账矩阵注入 (Spec-Kit RTM Ingestion)

| 需求条目编号 | 需求名称与核心契约 | 对应 OpenSpec 局部契约落点 | 独立验收指标 (Acceptance Criteria) |
| :---: | :--- | :--- | :--- |
| **REQ-EP1404-01** | **源文件事实无损摄入与双实体派生** | `specs/ep1404-production/spec.md#REQ-EP1404-01` | 冠志与国彩版本 Section 2~16 技术数据一致性差值为 0；英文事实翻译规范，零虚假捏造。 |
| **REQ-EP1404-02** | **八格式标准交付物矩阵完整产出** | `specs/ep1404-production/spec.md#REQ-EP1404-02` | 交付目录下正式交付物总数严格等于 8（4 DOCX + 4 PDF），命名符合法定命名规范。 |
| **REQ-EP1404-03** | **最新排版立法与槽位归属标准贯彻** | `specs/ep1404-production/spec.md#REQ-EP1404-03` | Section 5.3 包含 smoke/fumes 警示，5.4 不含烟尘文本；全篇 4 份 DOCX 所有表格第 1 列非左对齐标签数为 0。 |
| **REQ-EP1404-04** | **双极双层 165 项主审计满分核销与外部同步** | `specs/ep1404-production/spec.md#REQ-EP1404-04` | 集中式主审计 165 项全景断言 100% 满分通过（退出码 0）；`E:\` 盘目录同步 8 份文件且时间戳一致。 |

## 3. 拟变范围与影响面 (Scope & Impact)
- **输入源文件**：`F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\4-1 水性环氧树脂 EP\EP-1404\EP-1404 msds_CN 冠志.docx`
- **主工程产出目录**：`F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1404\`
- **外部协同同步目录**：`E:\冠志\TDS MSDS (2)\待处理文件\EP-1404\`
- **核心执行脚本**：`web/scripts/generate_ep1404_deliverables.mjs`
