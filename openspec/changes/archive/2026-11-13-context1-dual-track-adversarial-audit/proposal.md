# Proposal: Context 1 Dual-Track Adversarial Audit (context1-dual-track-adversarial-audit)

## Why

用户提出深刻且关键的质量风控警示：“核心是审计是否对标签/值/说明行的分类与归纳判断准确，注意，机械审计的设计一定一定要注意，机械审计很容易出现将本就错误的问题审计为正确的情况，不能先射箭再画靶”。
在文档自动化解析中，若机械审计使用与生成引擎同源同构的逻辑（例如仅凭“有冒号”、“字数短”断言标签），会导致生成器的系统性误判（如将前言引言行当标签、把长句警告当标签）被机械审计确认为“正确”，产生极其危险的“虚假 100% 全绿”。

为彻底斩断“先射箭再画靶”的恶性循环，必须建立一套**与生成代码物理隔离、基于独立语言学反向证伪与智能体双盲碰撞的 Context 1 双轨质检体系**：
1. **机械审计端**：摒弃顺向规则验证，全面部署反向否定性猎杀探针（P1~P4），专挑分类错误的逻辑破绽；
2. **辅助审计端**：采用物理遮蔽属性列的双盲独立判卷机制，与现有结果进行 1:1 交叉碰撞，分歧即报警；
3. **工作流集成**：固化为官方原生质检入口，并在标杆样本 PA-3612 上进行全景实测与报告输出。

## What Changes

本变更严格 1:1 承接 Step 0 Spec-Kit RTM 矩阵中的 3 项需求：
- **REQ-AUD-MECH-1**：开发独立的 Context 1 反向证伪机械审计器（`web/scripts/audit_context1_mechanical.mjs`），部署伪标签猎杀探针 (P1)、伪说明行猎杀探针 (P2)、伪数据值猎杀探针 (P3) 与源文档物理坐标投影探针 (P4)，具备最高硬阻断权（违规立即退出码 1）；
- **REQ-AUD-COG-2**：开发 Context 1 双盲碰撞辅助认知审计器（`web/scripts/audit_context1_cognitive.mjs`），实现属性遮蔽预处理、智能体独立语义审卷以及 1:1 自动化双向碰撞比对矩阵；
- **REQ-AUD-INTEG-3**：将机械与认知审计器集成进工作流官方命令通道，对基准样本 `PA-3612` 全景运行质检并沉淀一份完整的独立质检报告 `output/PA-3612/PA-3612_context1_audit_report.md`。

## Capabilities

### New Capabilities
- `context1-mechanical-audit`: 独立反向证伪探针体系（P1~P4），毫秒级执行，硬阻断伪标签与分类错位。
- `context1-cognitive-blind-audit`: 属性物理遮蔽与智能体双盲碰撞比对机制。
- `context1-audit-report-generation`: 自动化产出结构化 Context 1 质检核销报告。

### Modified Capabilities
- `run_source_recognition`: 增加 `--audit` 选项，支持在识别完成时自动触发机械硬门禁。

## Impact
- `web/scripts/audit_context1_mechanical.mjs`: 新建独立反向证伪机械审计器；
- `web/scripts/audit_context1_cognitive.mjs`: 新建双盲碰撞辅助审计器；
- `output/PA-3612/PA-3612_context1_audit_report.md`: PA-3612 质检报告产出。
