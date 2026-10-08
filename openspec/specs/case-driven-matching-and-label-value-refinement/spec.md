# case-driven-matching-and-label-value-refinement Specification

## Purpose
通过建立基于字数与上下文的加粗标签/值安全判别机制，并结合 `TDS MSDS (2)` 实际案例样本与 `SnowLove0303/AI-Agent` 规约体系，全面强化各章节局部规则与语义路由，消除长值被误判为空、树脂专有理化指标脱靶、结构化毒理及法规孤行遗漏问题。

## Requirements

### Requirement: 基于字数门槛与上下文感知的标签与值智能判别
系统在解析 DOCX 单元格角色时 SHALL 实施基于字数与上下文的智能分类算法：
1. 若加粗文本长度超过 10 个字符，且末尾无冒号（`：` 或 `:`），且不是明确的章节题头，SHALL 判定为**普通值（Value）**而非标签；
2. 若单元格处于非首列（`col > 0`）或同一行内已有前置标签，即使其文本包含加粗格式，SHALL 将其内容完整保留在 `valueText` 中，严禁将其实质文本误切为 `labelText` 而使 `valueText` 为空；
3. 纯标点符号（如 `。`、`：`、`-`）SHALL 被过滤，严禁产生独立伪标签。

#### Scenario: 超过10个字符的加粗说明文本归纳为值
- **WHEN** 解析到单格中包含加粗文本“根据EC指令2006/121/EG,无可用的接触限值信息”（字数大于10且无冒号）
- **THEN** 系统将其归类为值（`valueText`），单元格角色标记为 `note` 或 `value-only`，保留全部文本参与下游匹配。

#### Scenario: 单元格非首列加粗文本保留为值
- **WHEN** 某行第 0 列已有“6.2 环境保护措施”，第 1 列内容全加粗且包含句号
- **THEN** 第 1 列内容作为该行对应的值（`valueText`），不被误认为新标签，不生成空的 `valueText`。

### Requirement: Section 9 专有树脂理化指标（MFFT、Tg、羟值）智能槽位映射
系统在匹配 Section 9 理化特性时 SHALL 支持水性丙烯酸与聚氨酯特有的理化指标：
1. 识别“最低成膜温度 / MFFT”、“玻璃化温度 / Tg”、“羟值 / Hydroxyl value”；
2. 提取其测量数值与单位，标准对齐注入 `9.24 其他安全信息` 或专用理化槽位，严禁沦为 `UNMATCHED`。

#### Scenario: 丙烯酸乳液 MFFT 与 Tg 自动匹配
- **WHEN** 源文档 Section 9 包含“9.18 最低成膜温度MFFT/: 30”与“9.19 玻璃化温度Tg/℃: -10”
- **THEN** 系统自动捕获并对齐，将参数名与数值规范格式化后注入理化特性槽位，匹配状态为 `MATCHED`。

### Requirement: Section 11 结构化毒理学研究试验块聚类与节级说明捕获
系统在匹配 Section 11 毒理学信息时 SHALL 支持结构化试验研究分块（OW-161）与节级说明（OW-055）：
1. 识别“该产品无可用的毒理学研究”等宏观表述，作为节级说明保留；
2. 识别“物种”、“分类”、“结果”等结构化研究字段，根据上下文将其聚类至对应的毒理端点（如皮肤致敏、急性毒性），整合成规范结论语句。

#### Scenario: 皮肤过敏试验结构化研究块聚合
- **WHEN** 源文档包含“物种：人类”、“分类：不是皮肤过敏物质”、“结果：对志愿者做的皮肤接触试验证明没有过敏特性”
- **THEN** 系统将其识别为皮肤致敏性研究，聚合并注入 `sensitization`（皮肤致敏），状态为 `MATCHED`。

### Requirement: Section 3/4 混排急救措施跨表自动流转
系统在匹配 Section 3 成分信息时 SHALL 支持检测表格尾部误排的急救措施：
1. 检测 Section 3 表格内出现的“4.急救措施”题头及“误服”、“接触眼睛”、“接触皮肤”、“吸入”行；
2. 自动将其提取并跨章节派发至 Section 4 急救措施对应的标准槽位中。

#### Scenario: Section 3 尾部急救行流转至 Section 4
- **WHEN** 源文档将急救措施放在 Section 3 的表格末尾
- **THEN** 系统将该部分数据自动流转至 Section 4 的各急救插槽，Section 3 仅保留纯粹成分数据，避免脱靶。

### Requirement: Section 5/8/13/15 散文特征与法规标准聚合扩展
系统 SHALL 增强关键章节散文语义识别与标准号聚合：
1. Section 5：“着火或爆炸情况下，不要吸进烟尘”自动路由至 `special_hazards` 或 `protective_actions`；
2. Section 8：“无可用的接触限值信息”精准对齐至职业接触限值；
3. Section 13：欧洲废弃物分类（EWC）法规并入 `waste_treatment_methods`；
4. Section 15：国家安全标准号（GB 20576、GB 30000、GB 15258 等）自动汇总并入 `safety_regulations`。

#### Scenario: 消防烟尘散文精准路由
- **WHEN** 源文档 Section 5 出现无标签的消防散文“在着火或爆炸情况下，不要吸进烟尘。”
- **THEN** 系统通过特征词“爆炸/吸进烟尘”自动路由至防护措施，标记为 `MATCHED`。
