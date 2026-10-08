# 规范契约：模板结构与加粗标签不可变性防护 (Bold Label and Structure Protection Specification)

## 1. 加粗结构只读契约 (Bold Structure Immutability)
- **SHALL**: 模板中所有加粗文本运行区（bold runs），无论位于表头、独立行标签格还是混合单元格，均被定义为受保护的模板结构元素。
- **SHALL NOT**: 智能匹配注入引擎严禁修改、抹除、清空或覆盖任何现有的加粗文本运行区，除非该行为明确属于受控白名单规范（仅限 Section 9）。
- **SHALL NOT**: 属于表头行（包含 `化学品名称`、`CAS编号`、`含量` 等表头语义，或 OOXML `tblHeader`）的单元格，其 `editable` 属性必须恒为 `false`，严禁作为值单元格被写入任何数据。

## 2. 匹配值写入范围约束契约 (Value Target Confinement)
- **SHALL**: 匹配结果中的数据值仅能写入明确的值目标：
  1. 纯数据值单元格（`kind === 'value-only'` 且 `editable === true`）；
  2. 混合单元格（`kind === 'label-value'`）中冒号后对应的非加粗文本运行区（non-bold runs）。
- **SHALL NOT**: 严禁将匹配值写入 `kind === 'label-only'` 的纯标签单元格或加粗文本区域。
- **SHALL NOT**: 当混合单元格中原先缺少非加粗文本运行区时，写入逻辑必须在保留原有加粗标签的前提下追加非加粗运行区，严禁复用或覆写现有加粗运行区。
- **SHALL NOT**: 在匹配循环中，严禁在值单元格缺失时使用首列标签单元格（`cells[0]`）作为回退目标。

## 3. 标签修改权限白名单契约 (Label Mutation Whitelist)
- **SHALL NOT**: 任何针对 Section 1-8 和 Section 10-16 的标签文本修改请求，`writeCellLabel` 必须直接拒绝并抛出安全异常。
- **SHALL**: 仅在 Section 9（理化特性）中，当源文档明确提供测试条件（如 `1%水溶液`）时，允许在对应标签后追加受控限定词。若源文档未提供该条件，严禁擅自添加。

## 4. 关键章节专项防护契约 (Section-Specific Protections)
- **Section 3 (组成/成分信息)**:
  - 表头行（`化学品名称 | CAS编号 | 含量%（w/w）`）严禁被篡改；
  - `components_summary` 字段严禁注入到表格中；
  - 组分数据只能从表头下一行开始，依次填入 3 列数据格。
- **Section 8 (接触控制/个体防护)**:
  - 左侧加粗标签（如 `手部防护：`）全域只读，值严格写入右侧对应值格；
  - 严禁将防护值倒灌进标签列。
- **Section 11 (毒理学信息)**:
  - Section 11.7 同级加粗子标签（`生育力`、`致畸形`、`体外遗传毒性`）及 Section 11.1 子标签必须完整保留；
  - 毒理值必须按端点独立映射，严禁将大段文本覆盖破坏子标签结构。
