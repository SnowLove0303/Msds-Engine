# Spec Delta

## Purpose

为 MSDS Studio 建立可验证的语义换行契约，使匹配结果既保留源文件有意义的边界，又遵从模板独立行结构，避免把自动视觉折行、人工逻辑换行和结构性新行混为一谈。

## ADDED Requirements

### Requirement: Distinguish logical line kinds

系统 SHALL 将换行分为源文件显式语义换行、字段逻辑换行、模板独立行和自动视觉折行四类。自动视觉折行不得写入 DOCX 的逻辑换行；源文件显式换行只有在不是纯排版噪声时才可保留。

#### Scenario: Automatic width wrapping does not create a Word break
- **WHEN** 标签或值因单元格宽度不足在浏览器或 Word 中自动折行
- **THEN** 系统不向值文本插入额外换行标记，续行仅由版面宽度产生

#### Scenario: Meaningful source break is preserved
- **WHEN** 源文件在同一个值单元格中以段落或显式换行分隔两个独立句子
- **THEN** 系统在事实模型中记录该边界，并在目标值格中保留对应逻辑行

### Requirement: Keep label and value on one logical field line

对于标签和值属于同一模板行的普通字段，系统 SHALL 保持标签和值的字段关系，不得因为文本长度、标点或字符串拼接将标签拆成独立值行，也不得把值前缀复制到下一逻辑行。

#### Scenario: Label and value remain a single field pair
- **WHEN** 普通模板行包含一个锁定标签和一个值格
- **THEN** 标签仍留在标签单元格，值写入对应值格；值内部只允许按值策略换行

### Requirement: Sentence and instruction line policy

Section 4、5、6、13、14 的连续说明 SHALL 按完整句子、独立指令或运输字段边界换行。系统不得仅按字数、逗号或单元格宽度强制换行。

#### Scenario: Independent fire-safety sentences use separate logical lines
- **WHEN** Section 5.3 或 5.4 的值包含两个独立完整句子
- **THEN** 每个句子占一个逻辑行，句内不得被拆断

#### Scenario: Disposal instructions keep semantic boundaries
- **WHEN** Section 13 的值包含多条独立处置指令
- **THEN** 每条指令按源事实或已审核语义边界占一行，不通过空段落、Tab 或重复空格对齐

### Requirement: H/EUH/P code line policy

Section 2 的 H/EUH/P 语句 SHALL 每条完整代码及其完整说明占一个逻辑行；预防措施、事故响应、安全储存和废弃处置标题 SHALL 单独占行。组间不得产生无语义的空白逻辑行。

#### Scenario: P statements preserve source order and grouping
- **WHEN** Section 2 包含多个 P 代码和四类分组标题
- **THEN** 系统按源顺序输出分组标题和逐条 P 语句，代码与说明不分离，分组之间不插入空白占位行

### Requirement: Independent template row takes precedence

当两个事实属于不同端点、法规、毒理实体、生态实体或组分时，系统 SHALL 使用模板独立行或完整样式行承载它们，不得用同一值格内的换行替代独立结构。

#### Scenario: Unsupported toxicology endpoints are hidden as rows
- **WHEN** Section 11 某端点在源文件中不存在
- **THEN** 该端点的完整模板行和所属锁定子标签被隐藏或删除；不得留下空标签或模板示例值

#### Scenario: Regulations remain independent items
- **WHEN** Section 15 包含多条法规
- **THEN** 每条法规使用对应独立法规行；容量不足时插入完整样式行，不把法规列表拼成单个值格长段落

### Requirement: Preserve structured value line breaks after export

系统 SHALL 在 DOCX 导出后重新加载并验证逻辑行边界。内存中的换行字符串、导出 XML 中的换行标记和重新解析后的逻辑行数量必须一致。

#### Scenario: Export reload preserves line policy
- **WHEN** 匹配结果包含多逻辑行值并导出 DOCX
- **THEN** 重新加载 DOCX 后的逻辑行数量、顺序和内容与写入计划一致，且不存在额外空行
