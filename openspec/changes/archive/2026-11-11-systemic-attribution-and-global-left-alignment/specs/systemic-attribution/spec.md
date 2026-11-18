# Spec: 底层语义槽位归属与续行物理守恒 (Systemic Slot Attribution)

## REQ-S5-CLASSIF-01: Section 5 槽位归属与双语装配契约

### 1.1 词法分类定位 (Lexical Classification)
- **SHALL**: 匹配器在扫描 Section 5 文本时，凡包含“不要吸进烟尘”、“不要吸入烟尘”、“避免吸入烟尘”、“In case of fire or explosion, do not breathe fumes/smoke”或类似火灾烟尘吸入防护陈述，SHALL 严格将其归入 `special_hazards`（5.3 物质或混合物的特殊危害）槽位。
- **SHALL NOT**: 匹配器 SHALL NOT 将火灾烟尘吸入危害归入 `protective_actions`（5.4 消防预防措施和保护设备）槽位。
- **SHALL NOT**: 匹配器在处理 `special_hazards` 注入值时，SHALL NOT 正则抹除或剔除“在着火或爆炸情况下，不要吸进烟尘”语句。

### 1.2 无标签续行从属归并准则 (Continuation Row Invariant)
- **SHALL**: 当解析源文件表格时，若某一行标签列为空字符串或缺失，该行内容 SHALL 自动作为其紧邻前序具名槽位的续行事实链合并（保持换行或句号自然衔接），严禁将其孤立切片或跨槽位错误漂移。

### 1.3 双语流水线装配 (Bilingual Pipeline Assembly)
- **SHALL**: 中文版 5.3 单元格内容 SHALL 完整包含源文件提取的特殊危害事实与“在着火或爆炸情况下，不要吸进烟尘。”。
- **SHALL**: 英文版 5.3（`sec5.specific_hazards`）单元格内容 SHALL 完整包含燃烧释放一氧化碳/二氧化碳/氮氧化物等生成物陈述，以及“In case of fire or explosion, do not breathe fumes/smoke.”声明。
- **SHALL**: 中文版及英文版 5.4（`sec5.protective_equipment`）单元格内容 SHALL 专职包含自供气式呼吸器（SCBA）与禁止污染灭火用水流入土壤/水体的防范要求，不含有 5.3 的烟尘警示内容。
