# Specification: MSDS 引擎底层通用性根治规范 (RFC 2119)

## ADDED Requirements

### Requirement: 底座 DOCX 嵌套表格递归解析
在 `parseCell` 中，解析器 SHALL 检查 `tc` 单元格内部是否存在直接或间接的 `w:tbl` 子节点。当检测到 `tc` 内部包含嵌套表格节点时，解析器 SHALL 递归调用 `buildTableRecord` 将每个嵌套表格解析为标准的表格记录模型，并挂载于 `cell.nestedTables` 数组中。单元格聚合文本 `cell.text` SHALL 包含所有直接段落文本以及嵌套表格内部全部单元格的提取文本。

#### Scenario: 单元格包含嵌套表格时成功递归解析
- **WHEN** 解析一个包含 `<w:tbl>` 子节点的 `<w:tc>`
- **THEN** 解析器生成完整的嵌套表格记录模型挂载至 `cell.nestedTables`，且 `cell.text` 汇集全部文本

### Requirement: 全景识别引擎跨行状态机与容差识别
识别器 SHALL 增加对化学品分类特征的捕获并存入 `facts.chemicalClassification`。识别器 SHALL 采用跨行状态机扫描危险性类别。警示词抽取 SHALL 兼容国标等效表达。复合 P 语句代码抽取 SHALL 允许加号前后存在任意空白。防范说明分组 SHALL 分流至 `prevention`、`response`、`storage`、`disposal`。

#### Scenario: 跨行排版与复合 P 码识别
- **WHEN** 源文件中危险性分类分行排布且包含 `P370 + P378`
- **THEN** 状态机提取全量分类，复合 P 码正确提取并精准路由至四大组

### Requirement: 职业接触限值嵌套抽取与手部防护规格聚合
当单元格挂载有 `nestedTables` 时，识别器 SHALL 自动遍历嵌套表格行转换为 `{ substance, basis, type, value }` 格式注入 `facts.exposureControls.limits`。手部防护抽取 SHALL 连续向下读取相邻的多行手套材质、厚度、穿透时间并聚合成完整规格事实。

#### Scenario: 嵌套限值表与多行手套说明提取
- **WHEN** 源文件中 Section 8 采用嵌套表格表示 OEL 且手部防护拆为多行
- **THEN** 成功捕获全部限值记录与多行手套规格

### Requirement: 毒理学信息多端点解耦与临床评估保全
识别器 SHALL 独立支持“皮肤刺激性”与“粘膜刺激性”，分别存放于 `facts.toxicology.skinIrritation` 与 `facts.toxicology.mucousMembraneIrritation`。识别器 SHALL 保留临床评估与前言说明。

#### Scenario: 皮肤与粘膜刺激性独立存在
- **WHEN** 源文件中分别列出主要皮肤刺激性与主要粘膜刺激性
- **THEN** 识别器独立保留两项事实，互不覆盖

### Requirement: 运输信息语义解耦与 ADG 从句保全
在匹配 Section 14 标签时，识别器 SHALL 先判定标签语义是否包含非危品运输方式描述并存入 `facts.transport.transportModes`，SHALL NOT 将其误填入 UN 字段。识别器 SHALL 完整保留非危险品陆运声明的从句文本。

#### Scenario: 非危险品陆运声明匹配
- **WHEN** 源文件包含“符合ADG准则”的非危品陆运声明
- **THEN** 运输模式与 UN 编号完全解耦，从句完整保留

### Requirement: 法规信息条目化切分与历史法令保全
识别器 SHALL 将 Section 15 文本按行或列表切分为条目数组。源文件中明确声明的历史法规令号 SHALL 获得最高保护，SHALL NOT 被硬编码的现代模板静默覆盖。

#### Scenario: 历史法规条目化解析
- **WHEN** 源文件包含国务院令第 344 号等法规
- **THEN** 法规以结构化数组存储且令号完整保全

### Requirement: 流水线组装引擎零空白格门禁与动态限值行渲染
流水线 SHALL 检查 Section 1.1 与 Section 8.2 右侧单元格，若为空字符则阻断交付。当包含接触限值时，流水线 SHALL 动态插入对应数量的数据行。特殊防范说明拼接 SHALL 执行句子级去重。

#### Scenario: 零空白门禁与动态表格行插入
- **WHEN** 生成交付物时
- **THEN** Section 1.1 与 8.2 单元格非空，限值表格动态生成对应数据行，温控语句无重复
