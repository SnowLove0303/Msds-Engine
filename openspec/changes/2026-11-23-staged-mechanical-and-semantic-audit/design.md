# Design: 分阶段机械审计与 Agent 内容审计双轨重构

## 1. 全链路分层审计架构

```text
staged-mechanical-audit.js (核心纯确定性审计引擎)
  ├── auditPhase1Context1(sourcePath, context1)
  │     └── 源 DOCX 完好性、16 节覆盖、数值/CAS 基线指纹
  ├── auditPhase2Context2(context1, context2)
  │     └── isValid、数字/CAS 守恒、零中文、半角标点、符号/单位空格
  ├── auditPhase4TopologyOps(operationsList, presetKey)
  │     └── clearTemplate 首位、Preset 槽位防覆盖、父级题头防误删
  ├── auditPhase5DocxFiles({ targetDir, modelCode, typographyProfiles })
  │     └── 4 DOCX OPC/页眉页脚/双主体隔离/字阶/加粗/Tab/边框/S3/S13/双语对称
  ├── auditPhase6PdfFiles({ targetDir, modelCode })
  │     └── 8 格式完整性、时间戳同步、PyMuPDF 坐标/字号/末页防空
  └── 返回标准 JSON: { ok, stage, summary: { passed, critical, fail, warning }, findings: [...] }
```

## 2. 结构化直出入库与随动前置拦截
- `run_standard_production.mjs` 在每个 Phase 结束时调用对应 `auditPhase*` 函数：
  - 若产生 `CRITICAL` / `FAIL`，立即通过 `recordAuditFindings(runId, findings)` 写入 `user_exec_logs.db`，并更新批次为 `AUDIT_BLOCKED` 阻断后续浪费；
  - 若使用 `--stopAfter=context1|context2|produce`，仅执行至对应阶段的机械审计，实现极速前置校验。

## 3. Agent 审计速查包增强 (`generate_agent_audit_brief.mjs`)
- 保留 16 节逐行对照快照；
- 新增 **Preset 覆盖声明区**：展示 S1.3 冠志/国彩企业信息及页眉页脚对照，明示“由 Preset 接管覆盖”；
- 新增 **跨章节危化逻辑摘要区**：并列抽取 S2（分类/H语）、S3（有害成分及浓度）、S14（运输定性）原文与双语译文，供 Agent 秒级核验业务语义自洽性。
