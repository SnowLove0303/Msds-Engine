# Agent 使用文档：MSDS 模板标准化覆写模块

## 1. 模块定位与核心设计思想

本模块位于 `F:\App Location\Guanzhi Tong\Skill\MSDS Skill\模板覆写功能`，是 MSDS 文档生成的**唯一受信覆写引擎与约束中枢**。

以往 Agent 在直接使用 `python-docx` 覆写模板时，极易产生以下致命缺陷：
1. **格式签名被毁**：直接给段落赋值 `p.text = ...` 或随意 `p.add_run()` 导致字体、字号、间距、行高、边框等 XML `w:rPr` / `w:pPr` 被清空或篡改。
2. **字体加粗混乱**：把标签变成了常规体，或把数值写入了加粗体。
3. **序号断号错位**：删除未测项目后遗留断号（如 9.22 跳到 9.24），或重编号脚本误将 Section 1 标题 `1.物料及供应商标识` 篡改为 `1.1.`，或误将 Section 8 容许浓度 `0.03 mg/m3` 误识为 `0.3` 序号。
4. **Section 9 冒号不对齐**：修改了 Section 9 标签后，丢失了 `9.1` ~ `9.9` 的 2 空格等宽补偿（`prefix_width=5`），导致中英文冒号上下参差不齐。
5. **模板源文件受损**：直接原地覆盖模板，破坏了基准模板文件。

**本模块彻底终结上述问题，并将所有写入时约束（Write-Time Constraints）完全归于本模块内聚管理。**

---

## 2. 核心架构与内置模板资源

- **主入口脚本**：`msds_template_editor.py`
- **模板标准化脚本**：`standardize_from_template.py`
- **单元回归测试套件**：`test_editor.py`
- **Windows 一键启动批处理**：`启动编辑器.bat`
- **内嵌官方基准模板库**：
  - `CN 冠志`：`内嵌模板/正式模板_MSDS_CN_冠志(1).docx`
  - `EN 冠志`：`内嵌模板/正式模板_MSDS_EN_冠志(1).docx`
- **源基准模板库（只读镜像）**：
  - `F:\App Location\Guanzhi Tong\Skill\MSDS Skill\模板\正式模板_MSDS_CN_冠志(1).docx`
  - `F:\App Location\Guanzhi Tong\Skill\MSDS Skill\模板\正式模板_MSDS_EN_冠志(1).docx`

> [!IMPORTANT]
> **基准模板文件（无论是内嵌还是源目录）受哈希校验硬性保护，严禁原地覆写或篡改其 SHA-256。所有编辑必须基于 `create_work_copy()` 副本执行。**

### 从已有 MSDS 源文件生成模板标准化副本

当用户提供的 DOCX 不是正式模板版式，而是已有产品内容源文件时，必须以正式模板作为格式母版运行：

```powershell
py -3.12 "F:\App Location\Guanzhi Tong\Skill\MSDS Skill\模板覆写功能\standardize_from_template.py" `
  "D:\input\source.docx" `
  "F:\App Location\Guanzhi Tong\Skill\MSDS Skill\模板\正式模板_MSDS_CN_冠志(1).docx" `
  "D:\output\standardized.docx"
```

该流程按章节和标签映射源文件值，清空模板中未匹配的示例值，保留正式模板的表格结构与格式；源文件只读，禁止把输出路径指向源文件。

---

## 3. 三大核心优化与写入时约束规范

### 优化 1：标签文本可改开关 (`allow_label_edit`)
- **默认锁定保护**：MSDS 所有 16 个章节的标准字段标签默认全部锁定。如果误调用标签修改，系统将硬性抛出 `MutationViolation` 异常，阻断破坏行为。
- **按需精准开放**：针对 **Section 9（理化特性）** 常需补充测定条件或限定词的业务场景（例如：将 `9.3 pH值：` 修改为 `9.3  pH值（1%水溶液）：` 或 `9.3  pH值（原液）：`；修改粘度测试温度 `9.19 粘度（40℃）：` 等），将开关设为 `allow_label_edit=True`。
- **等宽对齐与全套样式保留**：
  - Section 9 标签修改函数自动锁定前缀：`9.1` ~ `9.9` 自动补充 2 个空格（保持宽度为 5），`9.10` ~ `9.24` 补充 1 个空格（保持宽度为 5），确保所有冒号绝对垂直对齐。
  - 严格保持原有 XML 加粗（`bold`）、字体、字号与段落属性，仅在底层文本 run 内部做文本安全替换。

### 优化 2：结构安全删除与智能连续重排 (`safe_delete_row` & `renumber_table`)
- **受保护行防删拦截**：
  - 禁止删除章节标题行（即每个表格的 `Row 0`，如 `1.物料及供应商标识`、`9.理化特性` 等）。
  - 禁止删除单行核心结构（如 Section 2 象形图行）。试图删除时抛出 `MutationViolation`。
- **完全收敛历史规则的重排算法**：
  - **章节作用域隔离**：每个 Table 严格对应所属 Section（1 ~ 16），杜绝交叉干扰。
  - **Section 0 / 测量单位防误判**：严格忽略 Section 8 中的工作场所有害因素限值（如 `0.03 mg/m3`、`7.0-9.0`），绝不误匹配为序号。
  - **Section 1 标题与非连续行穿透**：跳过无序号中间行，精准定位下一级子项（`1.1` -> `1.2` -> `1.3`），杜绝因中间行断开导致计数器重置。
  - **Section 11 / Section 12 重复子项合法保留**：Section 11 急性毒性（`11.1` 经口/经皮/吸入）等同一项多次出现时，合法保留同一主编号，不盲目递增。
  - **删行联动重排**：调用 `delete_row(..., auto_renumber=True)` 或 `safe_delete_row(..., auto_renumber=True)` 时，自动执行受影响表格的连贯重排。

### 优化 3：全生命周期写入约束与审计收敛
- **输入清洗标准化 (`normalize_value_text`)**：自动剥离非法控制字符、统一将 `\r\n` 归一化为空格或换行、剔除两端无效空白。
- **非加粗保护 (`write_cell_value`)**：数值必须且仅能写入单元格中的非加粗（regular/non-bold）运行区；若为空白单元格，自动在段落中创建纯文本 run，绝不注入 `<w:b w:val="0"/>` 等污染格式签名的多余 XML 标签。
- **文档终检审计 (`audit_document`)**：在文档保存或导出前，一键遍历 16 个表格，全面排查断号、漏号、序号倒序、违规加粗等隐患。

---

## 4. Agent 自动化编程调用范式 (推荐)

在流水线脚本或自动化任务中，Agent 请直接引用本模块提供的 API，无需启动 GUI：

```python
from pathlib import Path
from msds_template_editor import (
    DEFAULT_TEMPLATE,
    TEMPLATE_LIBRARY,
    create_work_copy,
    write_cell_value,
    write_section9_property,
    set_label_value,
    safe_delete_row,
    safe_add_row_after,
    renumber_document,
    audit_document,
    Document,
)

# 1. 创建安全工作副本（杜绝污染原模板）
work_dir = Path("D:/my_msds_task/temp")
docx_path = create_work_copy(TEMPLATE_LIBRARY["CN 冠志"], work_dir)
doc = Document(str(docx_path))

# 2. 常规字段数值写入（自动规范空白、强制非加粗、杜绝破坏格式）
# 示例：写入 Section 1 产品名称（Table 0, Row 1, Cell 1）
table_1 = doc.tables[0]
write_cell_value(table_1.rows[1].cells[1], "水性聚氨酯树脂 GZ-801")

# 3. Section 9 特殊理化特性标签与数值写入（支持测试条件限定词扩展）
table_9 = doc.tables[8]
# 方式 A：使用专属高阶 API，根据属性名模糊匹配或行号写入
write_section9_property(
    table_9, 
    "pH", 
    "7.5 - 8.5", 
    new_label="pH值（1%水溶液）：", 
    allow_label_edit=True
)
write_section9_property(
    table_9, 
    "粘度", 
    "1500 mPa.s (25℃)", 
    new_label="粘度（25℃，4号转子）：", 
    allow_label_edit=True
)

# 4. 删除未测项目行（自动连续重排）
# 示例：某产品未测初沸点（行 5），安全删除并自动保持后续 9.6~9.23 序号连贯
safe_delete_row(table_9, row_index=5, auto_renumber=True)

# 5. 安全新增行（如需添加特定理化指标）
# safe_add_row_after(table_9, row_index=6, auto_renumber=True)

# 6. 文档级重编号与合规审计
renumber_document(doc)
audit_errors = audit_document(doc)
if audit_errors:
    raise RuntimeError(f"MSDS 模板重排审计未通过: {audit_errors}")

# 7. 导出最终成品
output_docx = Path("D:/my_msds_task/output/MSDS_GZ-801_CN.docx")
doc.save(str(output_docx))
print(f"MSDS 生成成功，格式 100% 保持原生品质: {output_docx}")
```

---

## 5. 交互式 GUI 界面使用指南

若需进行人工交互、可视化复核或临时人工微调，可在终端运行：

```powershell
python "F:\App Location\Guanzhi Tong\Skill\MSDS Skill\模板覆写功能\msds_template_editor.py"
```

- **三列结构树**：直观展示 `标签 | 子标签 | 值`。
- **允许修改标签文本复选框**：位于窗口右上角，默认未勾选（标签受保护）。当勾选后，可直接在表格中双击修改标签内容。
- **右键上下文菜单**：
  - “复制此行（安全插行）”：自动克隆该行的格式与单元格定义，并触发连续重排。
  - “删除此行（安全删行）”：具备 Row 0 保护警示，删除后自动刷新并重排序号。
- **实时刷新与重排**：编辑完成后点击“重新编号”，或在保存时自动触发连续编号保障机制。

---

## 6. 开发者维护与回归验证

任何对本模块核心逻辑的后续修改，必须运行根目录下的测试套件进行严格自检：

```powershell
python "F:\App Location\Guanzhi Tong\Skill\MSDS Skill\模板覆写功能\test_editor.py"
```

**测试必须全绿输出 `SELF_CHECK_PASS`，且必须确保：**
1. `format_signature(reopened) == baseline_format`（XML 标签签名完全一致）。
2. `baseline_bold_runs` 加粗运行块计数完全一致。
3. `file_sha256(DEFAULT_TEMPLATE)` 原始哈希分毫不差。
4. 严格遵守 VS Code Review 工作流（通过 `review_diff_in_vscode` 交付审核）。
