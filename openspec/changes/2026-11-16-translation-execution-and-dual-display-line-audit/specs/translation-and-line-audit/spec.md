# Spec: 翻译底层执行写入与机械审计逐行双重对照显示契约

## ADDED Requirements

### Requirement: 底层翻译执行写入与语义映射行为契约 (REQ-01)
系统 SHALL 保持中英文翻译的条件无损转译、标准化学品命名与确定性语气守恒。

#### Scenario: Section 9 pH 稀释与测试条件无损转译
- **WHEN** 源文件 Section 9 包含带有测试条件或稀释条件的 pH 描述（如 `按 1:10 的比例用水稀释`、`1%水溶液`）
- **THEN** 系统 SHALL 生成完整的英文条件（如 `diluted with water at a ratio of 1:10` 或 `1% aqueous solution`），不得使用正则强行丢弃括号内描述。

#### Scenario: 标准化学命名与法规编号规范
- **WHEN** 出现 `N,N-二甲基乙醇胺` 或 `二甲基乙醇胺`
- **THEN** 系统 SHALL 标准化翻译为 `N,N-Dimethylethanolamine`（CAS 108-01-0），废除非标准的 `2-Dimethylaminoethanol`。

### Requirement: 机械审计逐行双重对照显示契约 (REQ-02)
机械审计套件 SHALL 对 Section 2 至 Section 16 逐节遍历，对每个结构化行输出双重显示块，并检测限定条件丢失与中文残留。

#### Scenario: 逐行双重对照显示输出
- **WHEN** 运行机械审计逐行对照工具
- **THEN** 系统 SHALL 并列呈现 `[CN Source]` 与 `[EN Deliverable]`，并标注对齐状态。

#### Scenario: 关键条件缺失告警与熔断
- **WHEN** 中文源句包含稀释关键词（`稀释`、`1:10`）而英文对应句缺少 `dilut` 或 `1:10`
- **THEN** 系统 SHALL 触发 `[CONDITION_MISSING_ALARM]` 并返回非零退出码。

### Requirement: 智能体逐行逐句法医级审计任务硬约束 (REQ-03)
审计智能体 SHALL 严格依据判定基准对全量条目逐行给出明确结论，未出具点对点物理证据时严禁解锁审计任务。

#### Scenario: 逐项法医核销
- **WHEN** 审计智能体执行审计
- **THEN** 必须输出包含行号、源文本、译文、实测状态的点对点清算结果，禁止概括性放行。

### Requirement: 双向防回退自动化测试套件契约 (REQ-04)
系统 SHALL 提供防回退单元测试与反例变异测试。

#### Scenario: 变异反欺诈通过
- **WHEN** 注入故意截断稀释条件的变异样本
- **THEN** 机械审计套件必须精准报红并返回非零退出码。

