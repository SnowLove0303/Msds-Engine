# Specification: 全流程分阶段机械审计与 Agent 内容审计双轨重构

## 1. 机械审计纯化契约 (RTM-01)
- **REQ-MA-01**: 机械审计引擎 SHALL 只校验形式、结构、物理渲染、数学校验和（CAS 模 10）、数字守恒与实体隔离，**严禁硬编码特定产品型号、固定章节行数或强制/禁止某法规关键词**。

## 2. Phase 1 ~ Phase 4 前置机械审计契约 (RTM-02)
- **REQ-MA-P1**: Phase 1 机械审计 SHALL 验证源文档 DOCX 可解析性、16 章节存在性及基线数字/CAS 指纹可提取。
- **REQ-MA-P2**: Phase 2~3 机械审计 SHALL 验证 `Context 2` `isValid === true`、CN/EN 数字与 CAS 100% 守恒、英文零中文残留、英文半角标点、标准比较符（`≥`/`≤`）及数值单位空格隔离。
- **REQ-MA-P4**: Phase 4 机械审计 SHALL 验证 `operations[0].op === 'clearTemplate'`、受 Preset 保护的槽位未被源文档写入操作覆盖，且父级分类题头未被误剪枝。

## 3. Phase 5 ~ Phase 6 交付物 XML 与 PDF 物理审计契约 (RTM-03)
- **REQ-MA-P5**: Phase 5 机械审计 SHALL 验证 4 份 DOCX 的 OPC 结构完整、双主体页眉页脚（`PAGE`/`NUMPAGES` 域与零串扰）、全局字体字阶（依据模板 `typographyProfile`）、加粗与非加粗角色分离、单 `<w:tab/>` 与 Tier A/B 悬挂缩进（零 `<w:tabs>`、零 `<w:numPr>`）、外实内虚边框、S3 居中与 CAS 模 10、S13 左对齐，以及 16 章节双语表格行数 1:1 严格对称。
- **REQ-MA-P6**: Phase 6 机械审计 SHALL 验证 8 份正式交付物（4 DOCX + 4 PDF）存在性、命名、时间戳同步（差值 $\le 5$ 分钟），并通过 PyMuPDF 实测 PDF 黄金标尺坐标（`80.28pt`/`87.28pt`）、Section 9 垂线、英文说明行 `9.50pt` 字号及末页非纯空白页。

## 4. Agent 内容审计增强与数据库直出入库契约 (RTM-04, RTM-05)
- **REQ-AA-01**: `generate_agent_audit_brief.mjs` SHALL 在速查包中追加“Preset 覆盖槽位声明清单”与“S2/S3/S14 跨章节危化逻辑摘要”。
- **REQ-DB-DIRECT**: `run_standard_production.mjs` SHALL 在各阶段（含 `--stopAfter` 分段模式）随动触发对应阶段机械审计，并将结构化 `findings` 直接写入 `user_exec_logs.db`。
