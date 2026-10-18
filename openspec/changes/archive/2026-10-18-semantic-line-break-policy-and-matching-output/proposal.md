# Proposal

## Why

当前匹配结果的文本内容有时已经识别正确，但 Word 输出中的换行边界与历史标准答案不一致：独立句子被合并、H/P 代码分组出现空白行或粘连、Section 11/12/15 中本应使用独立模板行的内容被塞进同一个值格。系统目前没有统一的语义换行契约，导致换行依赖局部字符串拼接和模板残留，用户无法判断哪些换行属于事实结构，哪些只是页面自动折行。

## What Changes

- 建立统一的 semantic line-break policy，区分源文件显式换行、语义逻辑换行、模板独立行和浏览器/Word 自动折行。
- 在事实和匹配模型中保留值的 line-break policy，不再在最终写入前统一 join 或按字数机械换行。
- 固定字段和值的同一逻辑行规则，禁止把字段标签和值拆成两条无依据的 Word 行。
- 为 Section 2 的分类、H/EUH/P 代码和四类防范说明制定逐逻辑行规则，禁止空白行污染和跨槽位粘连。
- 为 Section 4、5、6、13、14 等连续说明制定句子/指令边界规则。
- 为 Section 11、12、15 明确“独立模板行优先于单元格换行”的结构规则。
- 保持 Section 3、9 等已经稳定的独立行结构，不用换行替代成分/属性行。
- 增加导出 DOCX 后重载的换行审计，验证 Word XML 中的逻辑行边界，而不是只检查内存字符串。

## Capabilities

### New Capabilities

- semantic-line-break-policy-and-matching-output: 定义源事实、匹配模型、模板值格和最终 DOCX 之间的可审计语义换行契约。

### Modified Capabilities

## Impact

- 影响 web/src/smart-matching.js 的值规范化、Section 2 分组和各章节值投影。
- 影响 web/src/docx-engine.js 的值写入和换行保留逻辑。
- 影响 web/src/render-utils.js 与匹配结果显示，自动折行必须与 Word 逻辑换行分离。
- 影响智能匹配结果的导出重载审计和新增回归测试。
- 不改变模板标签、加粗边界、表格几何、匹配事实来源和 Section 9 已有的连续编号策略。
