# 技术设计：全量问题清单逐项优化架构方案 (Design Specification)

## 1. 架构总览：四层解耦模型 (Four-Layer Decoupled Architecture)

为杜绝直接依靠几何坐标（如 `cells[1]`、`cells[length-1]`）导致的结构错乱，系统在逻辑上划分为四个独立层次：

```text
1. 源事实抽取层 (Source Fact Extractor)
   └── RunEvidence / CellEvidence / ParagraphEvidence
   └── 抽取事实文本、Word 自动编号 (numbering.xml)、保留原始分段与无标签说明

2. 标准语义槽位层 (Semantic Slots Registry)
   └── 唯一的 slotId 标识 (如 s3:product_type, s8:hand_protection, s11:reproductive_fertility)
   └── 仅包含业务语义与标准化别名，完全不含任何物理行号或列号

3. 模板 Profile 与证据定位层 (Template Profile & Evidence Locator)
   └── 模板版本登记 (cn-guanzhi-v1, sha256)
   └── 单元格证据：xmlCellId, gridStart, colspan, rowspan, mergeGroupId
   └── 明确角色定义：table-header, label-bold, value-writable, value-only (单列值)

4. 写入引擎与六类安全审计器 (Safe Writer & Automated Audits)
   └── 单段落多 <w:br/> 紧凑换行引擎
   └── 合并格感知写入器 (Merge-Cell Aware Writer)
   └── 物理删行与编号连贯状态机
   └── 导出前六类硬指标门禁审计 (6 Automated Audits)
```

---

## 2. 关键组件与模块设计

### 2.1 身份戳记与页眉页脚引擎 (Identity Stamp Engine)
- **定位**：在 `docx-engine.js` 或写入引擎初始化阶段执行。
- **机制**：
  - 扫描文档 Header XML、Footer XML 以及文档第 1 页标题区域。
  - 将模板示例型号（如 `PEA-4139`、`PEA-4139-MSDS`）无条件替换为当前产品的真实型号（如 `PU-2341E`、`PU-2341E-MSDS`）。
  - 修订日期动态打戳为当前构建日期（中文格式：`YYYY年M月D日`，英文格式：`Month DD, YYYY`）。
  - 清理页脚右上角悬空字符 `P` 残影。

### 2.2 单元格角色模型与表头/单列值定义 (`docx-engine.js`)
- **`role = 'table-header'`**：
  - Section 3 表头三列（`化学品名称`、`CAS编号`、`含量%（w/w）`）显式标记为 `table-header`，`fontRole = 'label-header'`，`bold = true`，`editable = false`。
  - 严禁任何通用循环将其误判为 `valueNodes`。
- **`role = 'value-only'` / `'source-note'`**：
  - Section 13 无标签废弃说明（遵守国标/欧盟EWC法规）、Section 15 法规清单、Section 16 免责声明，当位于无标签冒号的独立单列行时，赋予 `value-only` 角色。
  - 在前端渲染时作为普通值文本块展示，右侧不留空白，左侧不伪造为加粗标签。

### 2.3 合并格感知写入器 (`Merge-Cell Aware Writer`)
- **针对 Section 8 等多物理列合并行**：
  - 计算每行的合并单元格组 (`cell_views` / `mergeGroupId`)。
  - `左侧标签格`：由 `gridStart: 0, colspan: 2` 构成，受加粗保护且只读。
  - `模板笔误受控提纯`：清洗模板自带的 `\t喷涂过程中要求有呼吸防护设备。`，仅保留纯净加粗标签 `手部防护：`。
  - `右侧值合并格`：定位 `gridStart: 2, colspan: 3` 的最右侧真实 XML 单元格。
  - 仅清空该单元格的非加粗运行区，单 run 写入值，坚决杜绝向左格非加粗残尾灌字。

### 2.4 单段落紧凑换行机制 (`Single-Paragraph Compact Line Breaks`)
- **针对 Section 5.4, 6.1, 7.1, 13 多行值**：
  - 在 DOCX 底层，严禁对同一个值拆分为多个 `<w:p>` 段落（会带来默认段前段后间距叠加，导致视觉行距过大崩版）。
  - 必须构建单个 `<w:p>`，并在逻辑换行处插入 `<w:br/>`。
  - 段落间距强制设置为 `w:before="0" w:after="0" w:line="240" w:lineRule="auto"`，确保版面严密紧凑。
  - 消除 Section 5.3 跨句注入时的多余双换行。

### 2.5 事实拆解与同级子项精准映射 (Section 11)
- **11.1 急性毒性**：
  - 区分 `经口`、`吸入`、`经皮` 三大端点，若源文件包含明确子项前缀，通过正则精确拆解并分别写入对应的三格子项值格；若无显式子项，采用规范化说明，不全堆在经口。
- **11.7 生殖毒性**：
  - 注册三个独立语义槽位：
    - `s11:reproductive_fertility` -> 对应加粗子标签 `生育力` 右侧值格；
    - `s11:reproductive_teratogenicity` -> 对应加粗子标签 `致畸形` 右侧值格；
    - `s11:in_vitro_genotoxicity` -> 对应加粗子标签 `体外遗传毒性` 右侧值格。
  - 严禁将三项合并覆盖，确保加粗子标签 100% 存留，值各自对号入座。

### 2.6 物理删行、等式审计与网格稳定性 (Section 2, 8, 10, 12)
- **Section 2 物理删行**：
  - 源无 2.1 紧急情况概述时物理整行删除；
  - 2.5~2.9 纯无数据行物理整行删除；
  - 删除后执行前缀序号重新连贯重排。
- **Section 8 & 10 物理删行**：
  - 8.2 工程控制无值整行删除；
  - 10.4 应避免条件、10.5 禁配物无值整行删除；
- **硬核等式审计器**：
  - 校验 `prunedFieldsCount === physicallyDeletedRowsCount`。若有字段标记剪枝但未物理删行，立即阻断。
- **Section 12 网格保护**：
  - 删行仅采用 `safe_delete_row`，删后校验列宽与网格属性与纯净模板严格一致，杜绝单字竖向折行。

### 2.7 六类自动化安全审计器 (6 Automated Audits)
在智能匹配完成并生成导出前，执行全局拦截门禁：
1. **错位审计 (MisplacementAudit)**：确保值不出现在标签列/表头列，标签不出现在值列；
2. **覆盖率审计 (SourceCoverageAudit)**：确保源文件实质事实（S3.1、S5.1、S8.1、S9相对密度、S15法规、S16免责声明）100% 有目标承载；
3. **换行审计 (LineBreakAudit)**：确保多逻辑行在单段内以 `<w:br/>` 存在，无异常空段；
4. **改写审计 (WordingDiffAudit)**：确保 pH 无源不带限定词，“无数据”未被改成“不适用”，免责声明未进燃烧值；
5. **空槽审计 (EmptySlotAudit)**：确保无值标签已被物理删除，不存在“有标签无值”的悬空行；
6. **加粗审计 (BoldRoleAudit)**：校验除 Section 9 外所有加粗运行区，前后文本与格式 100% 一致。
