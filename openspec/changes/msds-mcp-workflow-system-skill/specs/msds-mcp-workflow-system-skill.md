# Specification: MSDS MCP 工作流体系技能资产规范
(`specs/msds-mcp-workflow-system-skill.md`)

## 1. 词汇与规范性引用 (Normative Terminology)
本文档中的关键字 "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "MAY" 均依据 RFC 2119 进行解释。

---

## 2. 规范条款

### 2.1 MCP 工作流全景体系 (REQ-01)

- **MCP-01 (10 大标准原子工具语义契约)**:  
  技能定义 SHALL 完整收录并精确定义全套 10 项官方原子 MCP 工具的业务语义、标准参数范式与返回值结构：
  1. `msds_recognize_source`: 多模态物理源事实零损耗感知与 16 章节结构化提取；
  2. `msds_extract_section_facts`: 单一章节物理事实穿透下钻提取；
  3. `msds_compare_source_with_output`: 源文件物理事实与当前交付物深度对比；
  4. `msds_register_template`: 官方母版注册与内存拓扑解析；
  5. `msds_get_template_schema`: 母版几何网格、段落插槽与占位模式探查；
  6. `msds_peek_cell_or_row`: 单元格与行几何高精度视觉与属性透视；
  7. `msds_plan_audit_targets`: 审计目标与事实断言矩阵动态规划；
  8. `msds_execute_editor_ops`: 通用几何万能手术原语批量执行；
  9. `msds_batch_export_eight`: 冠志/国彩 × 中/英 4 份 DOCX + 4 份高保真 PDF 原子批处理导出；
  10. `msds_audit_deliverables`: 集中式交付物 150 项全量多维主审计套件。

- **MCP-02 (标准 5 阶作业闭环流水线)**:  
  技能文档 SHALL 规范化阐述 5 阶段完整作业流：
  - **阶段 1：零损耗源事实感知与母版透视**（`msds_recognize_source` + `msds_get_template_schema`）；
  - **阶段 2：语义决策与增减行/删列几何预演**（分类识别、外观保真判定、双实体预设准备）；
  - **阶段 3：万能手术原语受控执行与双实体预设派生**（`msds_execute_editor_ops` 配方 A~H 批量写入）；
  - **阶段 4：标准 8 格式原子批处理导出**（`msds_batch_export_eight` 一键生成 4 DOCX + 4 PDF）；
  - **阶段 5：1:1 事实物理对账与集中式主审计**（`msds_audit_deliverables` 150 项全绿门禁）。

- **MCP-03 (三大最高法定不变量全面收敛)**:  
  技能定义 SHALL 强制宣告三大系统级法定不变量：
  1. `INV-SYSTEM-READONLY`: 生产 Agent 未经明确授权，对 `web/src/`、`web/templates/`、`web/scripts/` 拥有绝对只读约束；
  2. `INV-MCP-EXCLUSIVE-GATEWAY`: 废除散落的 ad-hoc 脚本，强制经由标准 MCP 网关驱动（`msds_mcp_gateway.mjs`）受控执行；
  3. `INV-SAFE-HALT-AND-ESCALATION`: 遇到未知品类/英译缺失/底座缺陷时，强制挂起停机并出具结构化申报单，严禁就地打硬编码补丁。

- **MCP-04 (版式与排版几何公理)**:  
  技能定义 SHALL 包含 Section 2 阶梯排版层次（CN 480/840 twips, EN 317/677 twips）、Section 8/9/11/12 事实保留与空格清洗、标点自愈等既定工程标准。

---

### 2.2 工业级标准技能资产封装与交付 (REQ-02)

- **SKL-01 (标准 Frontmatter 与元数据)**:  
  技能主文件 SHALL 包含标准的 YAML Frontmatter，标明 `name: msds-studio`，版本号 `v6.0-ENTERPRISE`，并在描述中清晰列出核心关键词、触发条件与能力边界。

- **SKL-02 (正向行动化与角色契约)**:  
  技能内容 SHALL 采用正向行动化表述，明确定义生产 Agent（Producer）、审计 Agent（Auditor）与治理 Agent 的权责边界，杜绝“粉色大象”式模糊表述。

- **SKL-03 (防御性故障自愈与申报模板)**:  
  技能 SHALL 包含实用的 CLI/网关调用代码片段、参数载荷模式，以及标准的《系统底座通用缺陷申报单》Markdown 模板。

---

### 2.3 多环境同步与可感知性 (REQ-03)

- **ENV-01 (多环境物理落盘)**:  
  该技能文件 SHALL 同时落盘于：
  1. 全局配置路径：`C:\Users\Administrator\.gemini\config\skills\msds-studio\SKILL.md`；
  2. 项目本地路径：`F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\.agents\skills\msds-studio\SKILL.md`。

- **ENV-02 (环境一致性核销)**:  
  两处技能文件内容 SHALL 保持 100% 物理哈希一致，确保在任何会话中均能被准确解析与调用。
