# Design

## Context

当前值写入入口将值字符串中的换行转换为 Word break，但上游值规范化同时存在多种 join、split 和分组策略。标准答案显示：Section 2、5、6、13、14 的多句值通常在一个值格内使用逻辑换行；Section 11、12、15 则优先使用独立模板行。当前 UI 的自动折行还可能被误认为 Word 逻辑换行。

## Goals / Non-Goals

**Goals:**

- 在匹配模型中保存可审计的 lineBreakPolicy 和 logicalLines。
- 按章节和槽位决定“同值格换行”还是“独立模板行”。
- 保留源文件有意义的段落边界和 H/P 分组边界。
- 导出后重载验证逻辑行，而不是只比较内存字符串。
- 让识别页、匹配页和编辑器使用同一套值行模型。

**Non-Goals:**

- 不通过换行解决标签列过窄或序号槽布局问题。
- 不修改模板标签、表格几何、合并、加粗和字体锁定规则。
- 不按固定字符数或当前 viewport 宽度生成 Word break。
- 不用单元格内换行替代 Section 3 组分行、Section 11 端点行或 Section 15 法规行。

## Decisions

### 1. Use logical lines as the writer input

匹配结果的值不再只保存一个字符串，而是同时保存：

- normalizedValue；
- logicalLines；
- lineBreakPolicy；
- sourceLineIds；
- structuralDisposition。

writer 只消费 logicalLines 和 policy，不能再次按标点猜测。

### 2. Define policy by semantic slot

默认策略：

- field_value：标签和值保持同一字段行，值内部不主动断行；
- source_paragraphs：保留源段落边界；
- sentence_lines：完整句子或独立指令一行；
- code_lines：每条 H/EUH/P 代码一行；
- grouped_code_lines：组标题一行，随后每条代码一行，组间无空白占位行；
- one_row_per_endpoint：使用模板独立行；
- one_row_per_regulation：使用模板独立行；
- compact_single_line：保持单段文本，允许自然自动折行。

### 3. Separate structural rows from in-cell breaks

当内容具有独立标签、独立端点、独立法规或独立实体时，projection 层必须选择模板行；只有同一目标槽内的连续句子、代码或指令才使用值格内逻辑换行。

### 4. Normalize blank breaks conservatively

连续两个及以上的空逻辑行默认压缩为一个边界，最终 writer 不生成空白占位行。标准答案没有空白语义时，组间使用单个逻辑换行。

### 5. Keep visual wrapping separate

render-utils 只负责序号槽、标签槽和值槽的布局；CSS 自动换行不回写事实模型，也不生成 Word break。浏览器 Range 的换行只用于视觉验收。

### 6. Verify after DOCX reload

测试流程必须保存匹配结果、重新 loadDocx，并比较：

- logicalLines 数量；
- 每行文本；
- 逻辑行顺序；
- 目标值格；
- 空行数量；
- 结构行和独立行数量。

## Risks / Trade-offs

- [Risk] 旧源文件的换行可能只是扫描或版式噪声。Mitigation：事实层记录 breakKind，只有段落边界、字段边界、代码边界和已审核语义句边界进入输出。
- [Risk] 某些标准答案使用单元格内 break，而另一些内容使用独立行。Mitigation：由 slot policy 决定，不建立全局单一换行动作。
- [Risk] 值格宽度变更会改变自动视觉折行。Mitigation：Word break 与 CSS 自动折行分离，宽度只影响视觉，不改变逻辑行数量。
- [Risk] 旧测试只检查字符串。Mitigation：新增导出重载 XML/DOM 级逻辑行断言。

## Migration Plan

1. 先新增 line-break policy 和逻辑行模型，不改变现有输出。
2. 对 Section 2、5、6、13、14 建立 golden cases，确认同值格 break 结果。
3. 对 Section 11、12、15 建立独立行 presence cases。
4. 切换 writer 到 policy 驱动模式。
5. 对 PU-1001 至 PU-1004 重新生成结果并与标准答案对照。
6. 如果回归失败，保留现有输出并回退 writer 入口，不修改模板基线。
