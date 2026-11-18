# Specification: PA-3612 Swarm 双智能体生产与全景法医审计契约

## 1. 概念模型与状态机契约
- 状态集合: `INIT`, `SRC_EXTRACTED`, `PRODUCING`, `DELIVERED`, `AUDITING`, `VERIFIED`
- 裁执隔离律: `Producer` 仅推进 `PRODUCING -> DELIVERED`；`Auditor` 仅推进 `AUDITING -> VERIFIED`；两者严禁越界代行。

## 2. 行为契约 (RFC 2119 SHALL/WHEN/THEN)

### REQ-SWARM-01: Swarm 双智能体配置与协同契约
- **SHALL**: 系统通过 `swarm` 机制创建并绑定 `msds-producer` 与 `msds-auditor` 两个专门角色；
- **WHEN**: Coordinator 发起任务委托时；
- **THEN**: `msds-producer` 认领生产职责，并在产出 8 份文件后在看板发出 `@msds-auditor` 审计通知；`msds-auditor` 认领审计职责，挂载三大审计套件全量审查。

### REQ-SRC-02: PA-3612 源事实真实性保真契约
- **SHALL**: 必须且仅以 `PA-3612 msds_CN 冠志.doc`（及其无损转出的 `.docx`）为事实指纹依据；
- **WHEN**: 提取 Section 1~16 参数时；
- **THEN**: 产品型号必为 `PA-3612`，外观必为 `微黄半透明液体`，固含量必为 `44±1%`，成分必为丙烯酸树脂 (43-45%) 与去离子水 (55-57%)，严禁引入外生臆造值。

### REQ-DELIV-03: 8 格式全矩阵标准交付契约
- **SHALL**: 必须在交付目录下产出严格 8 份标准交付物：
  - `PA-3612 msds_CN 冠志.docx` / `.pdf`
  - `PA-3612 msds_CN 国彩.docx` / `.pdf`
  - `PA-3612 msds_EN Guanzhi.docx` / `.pdf`
  - `PA-3612 msds_EN Guocai.docx` / `.pdf`
- **WHEN**: 文件生成完毕时；
- **THEN**: 单文件大小 > 20KB，时间戳同步差 $\le 5$ 分钟，目录内无多余杂质文件。

### REQ-AUDIT-04: 法医级三阶深度审计契约
- **SHALL**: 产出物必须顺序通过三大自动化审计工具：
  1. `test_editor_indent_and_alignment_invariants.mjs` (排版几何不变量)；
  2. `audit_bipolar_bilayer.mjs` (165 项双极双层审查)；
  3. `run_master_msds_audit.mjs` (168 项集中式主审计)。
- **WHEN**: 审计套件执行时；
- **THEN**: 每一个套件进程真实退出码必须为 `0`，缺陷与违规数严格为 `0`。

### REQ-GOVERN-05: 闭环追溯与交付核销契约
- **SHALL**: 交付前必须附带 1:1 双向物理核销表，并通过 VS Code 提供检阅通道，在 `CHANGELOG.md` 沉淀记录。
