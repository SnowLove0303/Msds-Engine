# Design: 双轨审计编排与速查包架构

```text
[Phase 4~6 覆写产出] (--stopAfter=produce)
   │  产出 4 DOCX + 4 PDF，汇报清单等待/由 Agent 确认已产出
   ▼
[Phase 7 双轨同步审计] (--phase=audit)
   ├──▶ 轨道 A: 机械审计 (Exit Code 0 门禁)
   │      1. audit_topology_roles.mjs (标题/序号/标签/值/说明行/页眉页脚 + 字体字号)
   │      2. audit_bipolar_bilayer.mjs (165 项双极双层拓扑/PDF 样式)
   │      3. run_master_msds_audit.mjs (171 项中央主审计 + 源文件 1:1 内容继承对账)
   └──▶ 轨道 B: Agent 同步介入审计 (非机械语义审计)
          • generate_agent_audit_brief.mjs 生成 <MODEL>_agent_audit_brief.md
          • 内含精炼版 Pipeline/全局/局部规范要点 + 16 章节源/中/英对照快照
          • Agent 无需通读 330KB pipeline-engine.js，直接对照快照完成语义终审
```
