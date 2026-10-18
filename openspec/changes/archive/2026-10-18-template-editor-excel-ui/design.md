# Design: 模板编辑器 Excel 风格高保真与在线编辑架构

## 1. 界面布局统一（3-Column Layout Alignment）

彻底对齐“DOCX 识别”模块的整体页面结构：
- **Header Band**：保留“审计”与“导出 DOCX”核心操作，遵循 SP-DS 设计规范；
- **Ribbon**：展示当前模板名称、支持模板下拉切换、保留“特殊情况：允许修改标签文本”复选框，展示 16/16 覆盖率；
- **三栏式布局 (`.inspector-layout`)**：
  - **左侧面板 (`.side-panel.editor-side`)**：展示 Section 01 ~ 16 列表、实时过滤搜索框、脏状态指示；
  - **中间主控面板 (`.content-panel.structured-panel`)**：展示与识别模块完全一致的高保真结构化表格，支持 Excel 式原地在线编辑；
  - **右侧面板 (`.right-stack`)**：
    - 上半部分：内嵌模板原始排版只读预览（`docx-preview`）；
    - 下半部分：紧凑型审计状态与待处理项清单（`evidence-panel`）。

## 2. 纯净 Excel 风格表格体系设计

### 2.1 剔除几何变形列
- 移除旧版强加的 `<th class="row-gutter">`（行序号列）与 `<td class="row-actions">`（操作按钮列）；
- 表格完全复用 `sourceColumnMarkup(record)`，保证 `<col style="width:...%">` 比例 100% 与 DOCX 源文件保持一致；
- 边框采用标准的黑曜石网格微边框（`border: 1px solid #6f6f6f` 与单元格分割线），还原清晰干净的 Excel / Word 表格外观。

### 2.2 单元格文字排版保真
- 继承 `sourceCellStyle` 与 `renderParagraph` 的排版能力：小四（12pt / 24 halfPoints）字号、规范行高、忠实加粗与对齐层次；
- 彻底剔除大面积灰框 `<textarea>`、底部“可编辑/锁定”文本与“⌗”查看按钮，去除一切视觉噪点。

## 3. 在线原地直接编辑交互（In-Place Inline Editing）

### 3.1 单元格状态模型
- **可编辑值单元格（Value Cells）**：
  - 具备 `contenteditable="plaintext-only"`（或具有透明背景、自动撑满单元格高度的内联编辑容器）；
  - 常态下无外框、无边距偏离，与纯文本完美融为一体；
  - 悬浮时呈现微光底色反馈（`background: rgba(91, 214, 210, 0.05)`）；
  - 聚焦（Focus）时呈现 Excel 风格翡翠聚焦环（`box-shadow: inset 0 0 0 2px var(--cyan)`），不产生任何重排或布局抖动。
- **标签单元格（Label Cells）**：
  - 常态为只读受保护状态，光标为默认；
  - 当用户在顶部 Ribbon 勾选“特殊情况：允许修改标签文本”时，标签单元格激活内联编辑能力；
- **标题行单元格（Row 0）**：
  - 恒定只读，严禁篡改表头标题与格式。

### 3.2 键盘与数据同步交互
- **即时输入监听（`input`）**：用户键入时，直接调用 `writeCellValue(cell, text)` 或 `writeCellLabel(cell, text, allowLabelEdit)` 更新 DOCX 内存数据模型，并标记 `state.editor.dirty = true`；
- **键盘导航**：
  - `Tab`：失焦当前单元格并快速聚焦到下一个可编辑单元格；
  - `Shift + Tab`：聚焦上一个可编辑单元格；
  - `Enter`（多行值）：支持换行输入；
  - `Escape`：取消聚焦并恢复光标。

## 4. 非侵入式行增删悬浮工具条（Floating Row Actions）

为了在移除破坏性表格列的同时，完整保留“新增行”、“删除行”能力：
- 每行 `<tr>` 设置为相对定位容器；
- 鼠标悬停（Hover）在数据行上时，在表格右侧边缘浮现小巧的悬浮操作胶囊（`.row-floating-actions`）：
  - `[＋]`：在此行后新增行并继承结构；
  - `[×]`：删除当前行（第 0 行标题行禁用删除）；
- 鼠标移开自动隐藏，彻底保持表格日常阅读与编辑时的纯净度。
