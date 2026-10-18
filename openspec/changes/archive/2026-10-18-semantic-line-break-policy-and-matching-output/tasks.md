# Tasks

## 1. 事实与换行策略模型

- [x] 1.1 定义 logicalLines、lineBreakPolicy、sourceLineIds 和 structuralDisposition 数据结构，并用现有 PU-1001 至 PU-1004 结果验证字段完整
- [x] 1.2 区分源段落边界、显式 Word break、结构性新行和自动视觉折行，验证识别结果不会把 CSS 自动折行写回值文本
- [x] 1.3 为 field_value、source_paragraphs、sentence_lines、code_lines、grouped_code_lines、one_row_per_endpoint、one_row_per_regulation 建立可测试策略表

## 2. Section-specific policy

- [x] 2.1 重构 Section 2 分类、H/EUH/P 和四类防范说明逻辑，验证每条代码一行、标题独立一行且组间没有空白占位行
- [x] 2.2 为 Section 4、5、6、13、14 增加句子/指令边界规则，验证 5.3、5.4、6.1、13、14 与标准答案的逻辑行数量一致
- [x] 2.3 为 Section 11、12、15 增加独立行优先策略，验证 unsupported endpoint、源级说明和法规项目不会用值格换行互相替代
- [x] 2.4 保持 Section 3、9 的一组分/一属性一行规则，验证新换行策略不会把三列组分或理化属性合并

## 3. Writer and projection

- [x] 3.1 改造匹配值写入入口，使 writer 只消费 logicalLines 和 lineBreakPolicy，并验证 Word XML 中没有额外空白逻辑行
- [x] 3.2 修正值写入后的段落/换行刷新逻辑，验证导出后重新 loadDocx 的 logicalLines 与内存写入计划一致
- [x] 3.3 将识别页、匹配页和编辑器使用的值显示模型统一，验证自动视觉折行不改变逻辑行数量

## 4. Regression and acceptance

- [x] 4.1 添加 PU-1001 至 PU-1004 Section 2/5/6/11/12/13/14/15 的 golden newline fixtures，并验证标准答案对照差异可解释
- [x] 4.2 添加导出 DOCX 重载测试，断言逻辑行内容、顺序、行数、空行数和目标值格全部一致
- [x] 4.3 运行 test_ui_alignment_and_table_headers.mjs、test_full_problem_inventory.mjs、smoke.mjs、npm run build，并确认无标签/值/加粗/模板结构回归
- [x] 4.4 生成一份四方换行差异审计结果，确认标准答案与当前匹配结果在允许的规范化范围内收敛

