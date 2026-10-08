# Proposal: 智能匹配模板残留清零、零臆造规约与导入前审计门禁 (Template Residual Clearing & Zero-Hallucination Matching)

## Why

在对智能匹配全流程进行深度代码审计与问题研究（详见《智能匹配模板内容残留根因分析报告》）后，确认了当前系统在“非标 DOCX 识别 → 智能匹配 → 模板编辑导入”链路中存在的严重合规与质量漏洞：

1. **模板示例幽灵数据残留（Ghost Sample Residue）**：
   - 正式模板（如 `正式模板_MSDS_CN_冠志(1).docx`）为了提供版式与排版参考，内嵌了历史样品的示范数据（例如 Section 3 的“成分1 / 商业机密 / > n”、“成分2 / 7732-18-5”；Section 11/12 的“二乙二醇单丁醚 CAS: 112-34-5 / LD50 3306 mg/kg”；Section 14 的“远离食物、酸和碱”等）。
   - 当前 `applyMatchResultToEditor` 仅对 `MATCHED` / `NOT_APPLICABLE` 的项目执行单向覆盖写入。对于源文档未提供（`EMPTY`）、未匹配（`UNMATCHED`）或待复核（`REVIEW_AMBIGUOUS`）的插槽，**目标单元格完全没有清空动作**！导致模板自带的他人物料毒理/生态/组分数据被原封不动保留在最终交付物中，构成了极其严重的化学品合规法律风险。
2. **违反“零臆造”原则的无来源强行补值**：
   - Section 15 在 `safety_regulations` 为空时，无条件在后台硬编码强塞 5 项国家法规条例；
   - Section 14 在缺乏源事实支撑时，自动级联派发特定温度与储存要求；
   - 违反了项目全局约束（G-01、G-14~G-17）：**模板只提供格式，源文件提供产品事实，严禁将模板示例与源事实混同，未提供字段严禁静默编造**。
3. **导入编辑模块缺乏审计阻断门禁**：
   - 用户在智能匹配结果页可不经任何冲突校验，直接点击“导入编辑模块”；未匹配项与多值冲突项被无声忽略，错误与幽灵残留数据直接流入下游编辑器与导出件。
   - 界面缺乏直观的“溯源证据链”呈现（无法明确看到每一格数据的原文依据、所在源行与清空状态）。

必须彻底重构模板注入生命周期：**推行“注入前安全清零（Pre-Injection Clean Slate）”机制、全面清理无来源自动捏造逻辑、构建带有阻断能力的导入前审计门禁**。

## What Changes

- **1. 模板工作副本注入前全量清零协议（Pre-Injection Clean Slate Protocol）**：
  - 在克隆标准模板引擎后、执行匹配注入前，对模板所有表格（Section 1~16）的值单元格（`valCell`）实施安全清零；
  - Section 3：清空所有预设成分示例行（如“成分1/商业机密”），仅按源文档提取的实际组分动态重构行数；若源文档无组分，仅保留一行标准空值占位行；
  - Section 11 & 12：彻底清空模板中预留的“二乙二醇单丁醚”及其毒理/生态试验数据，确保未提供项绝对干净；
  - Section 10 & 14：清空模板示例说明（如“避免温度高于+35℃”），只有匹配到源事实才写入。
- **2. 零臆造引擎与严格来源溯源机制（Zero-Hallucination Engine & Evidence Tracing）**：
  - 移除 Section 15 无来源时自动生成 5 项法规的硬编码逻辑，仅在有源法规证据时归集；若源文档未提供则标记为未提供，杜绝静默编造；
  - 移除 Section 14 无源情况下的强行特殊注意事项级联；
  - 为每一个匹配插槽绑定结构化溯源元数据：`sourceLocation`（源章节/行索引）、`rawSnippet`（源原文）、`matchReason`（匹配逻辑），并在界面上提供清晰透明的溯源展示。
- **3. 智能匹配结果页审计看板与导入阻断门禁（Audit Gatekeeper & Workbench UI）**：
  - 统计并突出显示：已注入数（`MATCHED`）、已清空未提供数（`CLEARED_EMPTY`）、未匹配非标项数（`UNMATCHED`）、待复核冲突数（`REVIEW_AMBIGUOUS`）；
  - 当存在未解决的 `REVIEW_AMBIGUOUS` 或 `UNMATCHED` 时，点击“导入编辑模块”弹出审阅对话框，提示未决项并要求确认处理策略，杜绝带病流入编辑；
  - 在匹配结果表格中，高亮显示由源事实注入的单元格，并支持查看其来源证据气泡。
- **4. 全量真实样本端到端反向清零验证测试（End-to-End Verification Suite）**：
  - 编写专用自动化测试，断言载入 `PU-1007`、`PU-1036`、`PA-3617` 等真实文件后，输出副本中**绝对不存在任何“二乙二醇单丁醚”、“CAS: 112-34-5”、“成分1/商业机密”**等模板残留关键词。

## Capabilities

### New Capabilities
- `template-pre-injection-clean-slate`: 模板工作副本值格安全清零与组分重构协议。
- `matching-evidence-auditor`: 匹配溯源证据链绑定与导入前安全阻断门禁。

### Modified Capabilities
- `smart-matching-engine`: 废除非法无来源法规与事项捏造，升级 `applyMatchResultToEditor` 实现彻底清零与安全写入。

## Impact
- `web/src/smart-matching.js`: 改造 `applyMatchResultToEditor`，重构 Section 3/11/12/14/15 的派发生命周期，注入清零逻辑。
- `web/src/main.js`: 增加导入编辑模块的未决项审计阻断逻辑与状态提示。
- `web/tests/test_template_residual_clearing.mjs`: 新增端到端清零与反残留自动化断言套件。
