# Spec: Agent MSDS-Studio 7 阶标准受控生产工作流契约 (MSDS Studio 7-Stage Workflow Invariants)

## ADDED Requirements

### Requirement: REQ-STAGE-01 阶段 1: 物理源文件发现与锁定 (Source Discovery)
系统 SHALL 提供源文件定位与存在性校验协议，在动工前锁定输入 DOCX 文件路径，校验文件可读性与完整性，并提取目标型号代码 (modelCode)。

#### Scenario: 成功定位合法源文件
- **WHEN** 传入产品源文件路径（如 `OS-8970 msds_CN 冠志.docx`）
- **THEN** 系统 SHALL 验证该文件物理存在且字节数大于 0，并解析出型号代码 `OS-8970`

---

### Requirement: REQ-STAGE-02 阶段 2: 源事实零损耗识别与 Context1 生成 (Source Recognition to Context1)
系统 SHALL 调用 MSDS-Studio 识别模块（`msds_recognize_source`），穿透解析源 DOCX，零损耗提取 16 章节所有原始文本、表格拓扑、化学组分与测试数值，生成客观未修改的数据对象 `Context1`。

#### Scenario: 生成高保真 Context1 数据资产
- **WHEN** 识别模块处理合法的输入源文件
- **THEN** 系统 SHALL 输出包含 16 章节完整纯文本事实与原始行列拓扑的结构化对象 `Context1`
- **AND** 严禁在此阶段夹带任何底模预设或人为篡改

---

### Requirement: REQ-STAGE-03 阶段 3: 事实标准化治理与 Context2 资产化 (Content Governance to Context2)
系统 SHALL 依据全系统最高全局规范、16 章节局部规范与主审计契约，对 `Context1` 进行严格的深度清洗与标准化治理，生成交付物唯一法定数据源 `Context2`。

#### Scenario: 事实保真与防外生虚增契约
- **WHEN** 源文件载明为非危险化学品或未提及象形图/信号词
- **THEN** `Context2` SHALL 严格标注 `isHazardous = false`，且严禁生成“象形图：无”或“信号词：无”虚增项

#### Scenario: 双语专业语义深度英译
- **WHEN** 处理中文测试方法、指标数值与危害说明
- **THEN** `Context2` SHALL 包含符合 GHS 与 OECD 国际标准的专业西文翻译（如 `Primary mucosal irritation`、标准西文度数符号 `°C`）
- **AND** 内容必须 100% 来源于源文件事实，零虚构

---

### Requirement: REQ-STAGE-04 阶段 4: 强制调用编辑器万能原语受控写入 (Universal Editor Primitives Execution)
系统在生成产出物时，SHALL 强制调用编辑器模块（`universal-editor-primitives.js`、`template-editor.js`、`docx-engine.js`），严禁任何 Agent 私自编写解包/正则改写/压包的 ad-hoc 脚本；必须先执行前置值格清零，再通过增行、删行、删列、合并格、剪枝与写值等万能原语能力将 `Context2` 写入，并自动继承 `MSDS_DESIGN_TOKENS` 与动态自适应序号标尺。

#### Scenario: 前置清空与能力调用
- **WHEN** 编辑器加载官方母版准备写入
- **THEN** 系统 SHALL 先清空待编辑章节的值单元格，消除历史底模残留
- **AND** 系统 SHALL 根据 `Context2` 实际行列结构，通过调用编辑器的增删行/列与合并等能力动态重构表格网格，使得“格式服从于原文”

#### Scenario: 底层排版拓扑自动投影
- **WHEN** 数据写入完毕
- **THEN** 编辑器 SHALL 自动执行 `applyGlobalTypographyProjection`，强制投影标准 Design Tokens（中文小四12pt/五号10.5pt，英文五号9.5pt/小四11pt，自适应 420/560 dxa 悬挂缩进）

---

### Requirement: REQ-STAGE-05 阶段 5: 严格法定生产工序 (Strict Order of Production)
系统构建正式交付物时，SHALL 严格依序执行：先做中文 Word（冠志版 + 国彩版），再做英文 Word（Guanzhi 版 + Guocai 版），最后由原生 Word/WPS 并行导出 4 份高清 PDF，严禁颠倒或跨步执行。

#### Scenario: 顺序生成 8 格式交付物
- **WHEN** 触发生产流水线
- **THEN** 系统 SHALL 依次产出 `CN 冠志.docx`、`CN 国彩.docx`、`EN Guanzhi.docx`、`EN Guocai.docx`
- **AND** 随后调用原生转换引擎导出对应的 4 份 PDF，总耗时控制在 60 秒以内

---

### Requirement: REQ-STAGE-06 阶段 6: 两阶双轨全景深度审计 (Two-Step Dual-Scope Deep Audit)
系统对产出物执行验收时，SHALL 强制通过两阶双轨审计：
1. 机械确定性审计（第一步）：159 项集中式主审计与双极双层深度审计全绿，退出码严格为 0；
2. Agent 智能体语义规范审计（第二步）：Agent 依照全局与局部规范逐章节深入核验，逐行逐句对照中英文翻译。

#### Scenario: 机械审计一票否决
- **WHEN** 产出物存在任何字阶偏离、边框线型错误、象形图虚增或时间戳不同步
- **THEN** 机械主审计 SHALL 立即以非 0 退出码熔断拦截，严禁进入交付阶段

#### Scenario: Agent 语义逐行证伪
- **WHEN** 机械审计全绿
- **THEN** Agent SHALL 对照源文件逐行审核中英文 16 章节的数值与翻译保真度，确认 OECD 导则号与化学指标零遗漏

---

### Requirement: REQ-STAGE-07 阶段 7: 自动镜像分发与正式交付 (Delivery & Synchronization)
系统通过全部审计后，SHALL 自动将 8 份标准命名交付物镜像同步至用户工作目录 `E:\冠志\TDS MSDS (2)\待处理文件\<modelCode>\`，并出具包含 1:1 双向物理核销矩阵与 Git 存证的交付总结。

#### Scenario: 用户目录无缝同步交付
- **WHEN** 审计全绿通过
- **THEN** 系统 SHALL 将 4 份 DOCX 与 4 份 PDF 拷贝至用户目标目录，且文件修改时间保持在当前批次时间戳之内
