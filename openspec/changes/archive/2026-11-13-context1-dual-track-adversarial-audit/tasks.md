# Tasks: Context 1 Dual-Track Adversarial Audit (context1-dual-track-adversarial-audit)

- [x] 1. 实现独立的 Context 1 反向证伪机械审计器 (`web/scripts/audit_context1_mechanical.mjs`) <!-- id: 1 -->
  - 部署探针 P1（伪标签猎杀）、P2（伪说明行猎杀）、P3（伪数据值猎杀）与 P4（DOCX 物理网格对账）；
  - 编写变异攻击测试桩验证探针杀伤力（故意注入假标签必须报红退出码 1）；
  - 验证命令: `node web/scripts/audit_context1_mechanical.mjs --target="output/PA-3612/PA-3612_context1_recognition.md"`

- [x] 2. 实现 Context 1 属性遮蔽与双盲碰撞辅助审计器 (`web/scripts/audit_context1_cognitive.mjs`) <!-- id: 2 -->
  - 实现属性遮蔽预处理，剥离现有属性列，生成纯文本盲审输入；
  - 实现 1:1 双向碰撞比对器，自动生成对比核销矩阵与分歧报警表；
  - 验证命令: `node web/scripts/audit_context1_cognitive.mjs --target="output/PA-3612/PA-3612_context1_recognition.md"`

- [x] 3. 工作流集成并在标杆样本 PA-3612 上全景执行双轨实测并生成质检报告 <!-- id: 3 -->
  - 运行机械反向证伪审计（确保退出码 0）；
  - 运行双盲碰撞辅助认知审计，生成 `output/PA-3612/PA-3612_context1_audit_report.md`；
  - 验证命令: `node web/scripts/audit_context1_mechanical.mjs --target="output/PA-3612/PA-3612_context1_recognition.md" && node web/scripts/audit_context1_cognitive.mjs --target="output/PA-3612/PA-3612_context1_recognition.md" --report`
