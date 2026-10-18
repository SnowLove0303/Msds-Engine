# 规范契约：全量问题清单逐项优化行为契约 (Full Problem Inventory & Optimization Specification)

## 1. 身份戳记与页眉页脚规范 (Identity & Header/Footer)

### Requirement: Document Identity Stamping
系统在执行 DOCX 生成与导出前，必须用当前源产品的实际型号与构建日期替换所有模板示例文本。
- **Scenario**: 导出包含模板示例的产品（如 `PU-2341E` 替换 `PEA-4139`）
  - **Given** 模板页眉、页脚及第 1 页标题中含有 `PEA-4139` 或 `PEA-4139-MSDS`
  - **When** 触发数据注入或导出
  - **Then** 所有页眉、页脚和标题中的型号必须全部更新为 `PU-2341E` / `PU-2341E-MSDS`
  - **And** 修订日期必须更新为系统构建日期（格式 `YYYY年M月D日`）
  - **And** 页脚悬空字符 `P` 残影必须被彻底清除。

---

## 2. 表头职责与多列表格规范 (Table Headers & Merged Rows)

### Requirement: Immutable Table Headers
Section 3 的表头行（`化学品名称 | CAS编号 | 含量%（w/w）`）属于受保护结构，禁止任何业务值注入。
- **Scenario**: Section 3 组分汇总写入
  - **Given** 源文件抽取到了 `components_summary` 组分汇总文本
  - **When** 执行智能匹配注入
  - **Then** `components_summary` 严禁写入表格表头行（特别是第 1 列的 `CAS编号`）
  - **And** 表头三列单元格的 `role` 必须为 `table-header`，`editable` 为 `false`
  - **And** 组分数据只能按行逐一注入数据行的三列（`name`、`cas`、`concentration`）。

### Requirement: Section 3.1 Product Type Grounding
Section 3.1 产品类型必须忠实反映源事实。
- **Scenario**: 源文件存在 3.1 产品类型
  - **Given** 源文件识别到 `3.1 产品类型：混合物`
  - **When** 执行智能匹配
  - **Then** 目标模板 3.1 产品类型值格必须填入 `混合物`，禁止留空。

### Requirement: Merge-Cell Aware Hand Protection Writer
Section 8 的多列合并行必须按合并单元格定位值，禁止污染标签列。
- **Scenario**: Section 8 手部防护值注入
  - **Given** 模板左侧合并格（colspan=2）包含加粗 `手部防护：`，右侧合并格（colspan=3）为值格
  - **When** 注入手部防护值及手套材料
  - **Then** 加粗标签 `手部防护：` 必须 100% 留存且加粗
  - **And** 模板自带的笔误文本 `\t喷涂过程中要求有呼吸防护设备。` 必须被提纯清除
  - **And** 所有的手套建议与材料文本只能写入右侧合并值格。

---

## 3. 同级子项结构完整性规范 (Sub-items & Hierarchical Preservation)

### Requirement: Section 11.7 Sub-label Protection and Mapping
Section 11.7 的三个同级加粗子标签必须完整保留，并与各自的值格准确绑定。
- **Scenario**: Section 11.7 生殖毒性子项注入
  - **Given** 模板具备加粗子标签：`生育力`、`致畸形`、`体外遗传毒性`
  - **When** 执行智能匹配
  - **Then** 三个加粗子标签必须保持存在且保持加粗
  - **And** 源文件中的生育力、致畸形、体外遗传毒性事实分别写入各自对应的右侧值格
  - **And** 严禁将三项合并覆盖或清空后两行。

---

## 4. 换行保真度与紧凑渲染规范 (Line Breaks & Compact Layout)

### Requirement: Single-Paragraph Multi-Break Encoding
多逻辑行文本必须在同一个 Word 段落中通过 `<w:br/>` 实现紧凑换行。
- **Scenario**: Section 5.4, 6.1, 7.1, 13 处理方法的多行值写入
  - **Given** 源事实包含多行逻辑换行（如消防呼吸器/灭火用水两行，处置方法四行）
  - **When** 写入 DOCX 单元格
  - **Then** 必须生成单段落 `<w:p>`，并在逻辑换行处插入 `<w:br/>`
  - **And** 禁止拆分为多个独立的 `<w:p>` 段落
  - **And** 段前段后间距必须为 0，行距紧凑，杜绝虚假大空行。

### Requirement: Word-for-Word Integrity Gate
写入后必须执行源值逐字比对，杜绝丢字吞字。
- **Scenario**: Section 7.1 长操作规程写入
  - **Given** 源文本包含较长操作规程（如包含首句 `操作时遵守…避免与皮肤和眼睛接触。`）
  - **When** 执行单 run 替换
  - **Then** 写入后的值与源提取值逐字比对必须 100% 一致，字符丢失时立即报错拦截。

---

## 5. 单列值角色与法规/免责声明规范 (Value-only Rows & Regulation Grounds)

### Requirement: Value-Only Row Semantics
无标签独立说明行必须赋予 `value-only` 角色，禁止渲染为左侧标签。
- **Scenario**: Section 13 无标签废弃说明与 Section 16 免责声明
  - **Given** 源文件存在独立段落（如遵守国标/欧盟EWC法规，或 Section 16 免责声明）
  - **When** 在前端渲染或导出
  - **Then** 该行必须作为单列值文本呈现
  - **And** 禁止将其提取为加粗或不加粗的左侧标签
  - **And** Section 16 免责声明必须完整可见，禁止丢失。

### Requirement: Fact-Grounded Regulations
Section 15 法规必须依据源实证抽取，严禁无来源自动臆造。
- **Scenario**: Section 15 法规写入
  - **Given** 源文件包含具体法规清单（国务院令344号、GB/T 16483等）
  - **When** 执行匹配
  - **Then** 仅将源文件中明确存在的法规条目注入目标值格
  - **And** 严禁无源自动插入固定五条法规清单。

---

## 6. 物理删行、剪枝等式与全表审计规范 (Pruning, Layout & Typography)

### Requirement: Strict Pruning and Renumbering
源文件无实质事实的非必要行必须执行物理整行删除，并重新连贯编排序号。
- **Scenario**: Section 2, 8.2, 10.4, 10.5 物理删行
  - **Given** 源文件无 2.1 紧急情况概述、无 2.5~2.9 环境/健康危害、无 8.2 工程控制、无 10.4/10.5 条件
  - **When** 执行智能匹配
  - **Then** 上述无数据行必须从表格中物理整行删除
  - **And** Section 2 剩余行按原序连贯重排
  - **And** Section 9 剪枝后编号必须连贯至末尾项（如 9.1~9.13，消除 9.23 断号）。

### Requirement: Pruning Field Equal Physically Deleted Rows Invariant
- **Invariant**: `prunedFieldsCount === physicallyDeletedRowsCount`
  - 标记为剪枝的字段数必须严格等于物理从文档表格中删除/隐藏的行数，存在差异时立即阻断导出。

### Requirement: Full Table Typography Audit
- **Invariant**: 所有普通值文本在中文模板下必须为“宋体”，英文模板下必须为“Times New Roman”，字号 12pt，加粗属性为 false。
