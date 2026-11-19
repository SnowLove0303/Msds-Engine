# Specification: 识别与审计模块底层通用性优化与源文件强制对账审计规范 (RFC 2119)

## ADDED Requirements

### Requirement: GHS 危险性属性精准二分与否定语义过滤
在解析 Section 2 GHS 危险性分类时，解析器 SHALL 对“无”、“不属于危险物”、“不适用”、“Not classified”、“None”等否定词进行标准化过滤。当过滤后的有效分类数量为 0 且无象形图时，解析器 SHALL 判定 `isHazardous = false`，且 `categories` SHALL 包含清空或非危标识，SHALL NOT 将否定词判定为危险性类别。

#### Scenario: 非危险品源文件解析
- **WHEN** 解析包含“GHS危险性类别: 无”且“危险象形标记：无”的源文件
- **THEN** 解析器输出 `isHazardous = false`，且不产生虚假危险性分类

### Requirement: 警示词与信号词全量同义词覆盖
解析器 SHALL 支持“信号词”、“警示词”、“警告词”与“Signal word”等效引导词，匹配并提取“警告”、“危险”、“Warning”与“Danger”标准信号词。

#### Scenario: 包含“警告词：警告”的源文件识别
- **WHEN** 源文件中出现“警告词：警告”
- **THEN** 解析器正确提取 `signalWord = "警告"`

### Requirement: 散文防范说明纯文本后备解析机制
当防范说明文本中未检测到任何 `P\d{3}` 编码时，解析器 SHALL 激活散文后备解析模式。解析器 SHALL 按照预防措施、事故响应、安全存储、废弃处置引导词切分段落，并将中文句子分流至 `prevention`、`response`、`storage`、`disposal` 四大组，SHALL NOT 返回全部为空的数组。

#### Scenario: 无 P 编码的纯文本防范说明识别
- **WHEN** 源文件包含预防、响应、存储、处置中文段落而无 P 码
- **THEN** 四大防范组数组均包含对应句子文本，无信息损耗

### Requirement: 全章节顶层结构化业务事实完整性增强
解析器 SHALL 在顶层事实对象中补全字段：Section 4 包含 `skin`、`eyes`、`general`；Section 5 包含灭火剂与自供气呼吸器说明（消除 `{}` 空对象）；Section 7 包含 `handling`；Section 10 包含 `decomposition` 与 `hazardousReactions`。

#### Scenario: 提取全章节业务事实
- **WHEN** 源文件在第 4、5、7、10 章节包含标准子章节内容
- **THEN** 顶层事实对象包含对应非空属性，无信息遗漏

### Requirement: Section 3 特殊注意中和成盐说明结构化抽取
解析器 SHALL 在解析成分表后，检查下方说明行是否包含“请注意以下物质”、“中和剂”、“已键合为盐”等附注，并将其结构化挂载至 `componentsNotes`。

#### Scenario: 提取成盐中和剂附注
- **WHEN** 成分表下方存在 N,N-二甲基乙醇胺成盐说明
- **THEN** 结构化挂载至成分附注字段

### Requirement: 审计模块强制源文件 1:1 物理对账审计
中央主审计套件与 Grounding Lint SHALL 强制加载物理源文档，并对产出物的 GHS 分类、OEL 限值、运输非危与温度区间、理化参数 19 项数值及 CAS 组分实施 1:1 物理对账。当产出物违背源文件事实或无中生有硬塞数据时，审计套件 SHALL 触发硬阻断并以非 0 退出码退出。

#### Scenario: 产出物与物理源文档对账
- **WHEN** 运行主审计套件检测交付物
- **THEN** 审计套件自动读取源文档实施双向比对，违背源事实时阻断通过
