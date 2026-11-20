# Spec: 双轨审计与 Agent 介入审计速查包契约（全面增强版）

## REQ-01: 两种审计职责分离与触发编排
- `run_standard_production.mjs` SHALL 支持 `--stopAfter=produce`（Phase 1~6 产出 8 份交付物后汇报确认）与 `--phase=audit`（确认已产出后触发机械审计，并同步生成 `<MODEL>_agent_audit_brief.md` 供 Agent 执行介入审计）。

## REQ-02: 机械审计全面强化（六类角色 + 拓扑/PDF样式 + 脏数据猎杀 + 源内容对照）
- `web/scripts/audit_topology_roles.mjs` SHALL 对 4 份 DOCX 与 4 份 PDF 执行全面机械校验：
  1. **标题 (`SECTION_HEADER`)**：1~16 节编号连续、字号字体符合规范（CN 10.5pt 宋体 / EN 9.5pt Arial）；
  2. **序号与标签 (`SEQ_LABEL`)**：序号后单 `<w:tab/>`（无多余空格）、标签加粗、420/560dxa 悬挂缩进、零 `<w:numPr>` 污染；
  3. **值 (`VALUE`)**：多列值格常规体（非加粗）、清除多余首行缩进、`jc="left"` 左对齐；
  4. **说明行 (`EXPLANATION`)**：通栏或纯叙述说明行保持常规体，不误加粗、不误带序号；
  5. **页眉页脚 (`HEADER_FOOTER`)**：校验 `header/footer` XML 存在、保留 `PAGE`/`NUMPAGES` 域、双主体（冠志 vs 国彩）零串扰；
  6. **表格与脏数据猎杀**：外实内虚边框检查、无空行残留、无旧型号/示范脏数据残留（如 `PA-3655`/`二乙二醇单丁醚`/`{{...}}`）、PDF 无乱码方块 `\ufffd`。
- 联动 `audit_bipolar_bilayer.mjs` 与 `run_master_msds_audit.mjs` 完成 PDF 9.50pt/80.28pt 渲染与源文件 vs 产出 1:1 内容继承对账。

## REQ-03: Agent 介入审计速查包（免读 330KB Pipeline 源码）
- `web/scripts/generate_agent_audit_brief.mjs` SHALL 自动生成 `<MODEL>_agent_audit_brief.md`，包含：
  1. **一页纸《Pipeline + 全局/局部规范终审速查表》**（S1~S16 逐节红线与历史踩坑要点）；
  2. **《源文件 vs CN 产出 vs EN 产出 16 章节三方对照快照》**（自动提取，无需 Agent 写脚本）；
  3. **《双主体（冠志 vs 国彩）页眉页脚与 S1.3 差异核对表》**；
  4. **《Agent 介入审计签字核销栏》**。
