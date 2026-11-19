# Specification: MSDS Content Fidelity & Dynamic Formatting Standards

## 1. 范围与术语
本规范确立 MSDS 生产与编辑引擎在处理非危化学品安全警示、复杂成分附注、动态高维毒理学数据及拓扑新增内容时的强制性行为准则。关键字 SHALL, SHALL NOT, SHOULD, MAY 遵循 RFC 2119 规范。

## 2. 规范条款

### SPEC-01: Section 2 GHS 与防范事实守恒
- **2.1** 当源文件中包含明确的信号词（如“警告”）、危害性说明（如“没有明显的已知作用或严重危险。”）、散文防范说明（预防、响应、储存、处置）或环境/物理危险警示时，治理引擎 (`context-governor.js`) 与生产调度器 (`production-orchestrator.js`) **SHALL NOT** 仅因 `isHazardous === false` 而清空或抹杀上述字段。
- **2.2** 编辑器写入器 (`editor-writer.js`) **SHALL** 优先将源文件中提取到的实际信号词、危害性说明、四分类防范说明及其他危害写入目标单元格，仅在源文件确实未提供相应字段时方可使用通用兜底。
- **2.3** 在英文产出物中，信号词“警告” **SHALL** 规范映射为 `Warning`，危害性说明 **SHALL** 规范翻译为 `No known significant effects or critical hazards.`，防范说明四大类 **SHALL** 输出为结构化的英文散文段落。

### SPEC-02: Section 3 成分表附注动态挂载与拓扑继承
- **2.1** 当识别模块提取到 `componentsNotes`（成分表附注）时，治理层 **SHALL** 将其完整传递至 `context2`。
- **2.2** 编辑器写入器 (`editor-writer.js`) 在填充成分表行时，**SHALL NOT** 粗暴删除成分数据行之后的附注说明行。若源文件存在附注，写入器 **SHALL** 保持或动态新增通栏附注行 (`gridSpan=3` 或相应列数)，将附注文本完整写入。
- **2.3** 动态新增的附注单元格 **SHALL** 继承全局表格标准边框 (`enforceTableStandardBorders`)、单元格垂直居中 (`vAlign="center"`)、内边距与正文字阶（中文宋体 9.5pt，英文 Times New Roman 9.5pt，行距 1.15 倍）。

### SPEC-03: 拓扑新增内容格式防丢失不变量 (Dynamic Formatting Preservation)
- **3.1** 万能编辑器原语在向文档新增任何行 (`insertRowIntoSession`) 或新增段落时，**SHALL** 自动执行格式深克隆 (`cloneFormatting`)，完整复制基准行的行高、单元格内边距、边框、字体名称、字阶（fontSizePt）、粗体状态及对齐属性。
- **3.2** 新增文本如果包含多段落，每个段落 **SHALL** 显式设置段落属性 (`w:pPr`)，严禁生成裸 `<w:p><w:r><w:t>...</w:t></w:r></w:p>` 标签。
- **3.3** 全局排版拓扑投影 (`applyGlobalTypographyProjection` 与 `enforceStructuralTypographyInvariants`) **SHALL** 在所有内容写入完成后执行，对新增节点施加 Design Tokens 硬约束，确保整表及整篇文档格式的一致性与无损性。

### SPEC-04: Section 9 理化特性稀释比与双语参数
- **4.1** 对于 pH 值等包含稀释比例的理化字段（如“7-9 （按1:10的比例用水稀释）”或“7-9 （按1:1的比例用水稀释）”），中文版 **SHALL** 100% 保持源文件稀释比例文本。
- **4.2** 英文版 **SHALL** 通过化学双语转换引擎精准翻译为 `7 - 9 (diluted with water at 1:10)` 或相应比例，**SHALL NOT** 在英文产出物中残留中文字符。
- **4.3** 其余 18 项理化参数数值与单位（°C, mPa.s, g/cm³）**SHALL** 与源文件保持绝对一致。

### SPEC-05: Section 11 毒理学高维数据保真
- **5.1** 对于多组分高维复杂毒理学测试端点（如 PA-4840 的 20 项 OECD 指南端点），系统 **SHALL** 采用动态拓扑结构完整渲染各端点名称、动物物种、实验方法、结果与数值，**SHALL NOT** 合并或省略。
- **5.2** 对于动物实验数据（如 PA-4902 的大鼠 LD50 数据），系统 **SHALL** 完整保留数值与单位。

### SPEC-06: 三方介入审计与机器硬门禁
- **6.1** 每次生产必须通过三方介入审计脚本 (`agent_intervention_audit.mjs`)，对“源文件”、“识别结果”、“最终交付物”进行全要素比对，差异率 **SHALL** 为 0。
- **6.2** Master Audit Ring 1-6 与双语对账审计 **SHALL** 以真实 Exit Code 0 退出，**SHALL NOT** 存在任何未捕获的报错或警告。
