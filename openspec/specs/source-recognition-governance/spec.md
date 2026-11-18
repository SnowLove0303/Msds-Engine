# source-recognition-governance Specification

## Purpose
TBD - created by archiving change optimize-msds-source-recognition. Update Purpose after archive.

## Requirements

### Requirement: REQ-1 识别流程固化与单一入口契约
系统 SHALL 提供且仅提供唯一的原生识别入口，并在单一进程生命周期内完成解析、语义分类与 Context 1 Markdown 序列化。

#### Scenario: 单一确定性执行通道
- **WHEN**: 当操作员或外部 Agent 触发源文件识别任务时
- **THEN**: 系统 SHALL 在 3 秒内输出完整的结构化事实对象与 Context 1 Markdown 资产，且绝对禁止在工作区或 scratch 目录创建任何单次性临时脚本。

---

### Requirement: REQ-2 Context 1 语义属性列规范契约
Context 1 Markdown 产出物中的表格 SHALL 包含 `属性` 列，标明识别内容的语义属性。

#### Scenario: 属性列枚举定义
- **WHEN**: 渲染 Context 1 的 16 章节全量事实表格时
- **THEN**: 系统 SHALL 为每一行中的每一段核心文本赋予唯一的属性关键词，取值严格限定于以下闭集：`章节标题`、`序号标签`、`标签`、`数据值`、`说明行`、`表头`、`组分数据`。

---

### Requirement: REQ-3 多维特征遍历与反误分类判定契约
识别引擎 SHALL 依据加粗、冒号、序号、列数与句式多维特征综合判定内容属性，严禁仅凭单格位置盲目归类为标签。

#### Scenario: 标签与说明行与数据值精准判别
- **WHEN**: 解析源 DOCX 文档中任意章节表格行时
- **THEN**: 引擎 SHALL 正确应用多维判别优先级，确保 Section 2、Section 8、Section 11、Section 13、Section 15 无一例将说明行或值误标为标签。

---

### Requirement: REQ-4 结构层次与高可读性排版契约
Context 1 Markdown 资产 SHALL 采用一致、整洁的排版结构，让用户一眼看清层级关系。

#### Scenario: 排版规范度与低认知负荷
- **WHEN**: 用户或审核员阅读 Context 1 报告时
- **THEN**: 报告 SHALL 采用包含 `行号`、`属性`、`标签/题头`、`数据值/内容` 的 4 列标准表格，剔除技术调试废话，结构一目了然。
