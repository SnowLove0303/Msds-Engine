# Change Proposal: 2026-11-17 Footer Y-axis Alignment, Page Number Font, and Guocai Entity Unification

## Why
在对 2026-11-16 产出的全量 88 份 MSDS 交付物进行法医级排查后，用户明确提出了三大核心治理要求：
1. **英德国彩企业主体全称统一**：统一定义为 `英德市国彩精细化工有限公司`，消除此前预设配置中残留的“新材料”分歧；
2. **页脚修订日期 Y 轴位置校准**：当前页脚表格首行左右单元格垂直对齐不统一（左列主体居中，右列修订日期顶对齐），导致修订日期在垂直维度（Y 轴）偏高悬浮，需校准为与主体基线水平齐平；
3. **页脚动态页码字号纠偏**：当前管线强制将页码设置为 12pt（`fontSize: 24`），导致页码异常放大，需恢复为母版标准字阶小五号 9pt（`fontSize: 18`），保持视觉比例和谐。

## 1:1 需求物理对账矩阵 (RTM)

| 需求编号 | 原始输入事实映射 | 核心主题 | 对应 Specs 契约 | 对应 Task 任务 |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | “统一用这个英德市国彩精细化工有限公司” | 国彩企业主体全称与中英预设收敛 | `specs/footer-layout-and-preset/spec.md#req-01` | `tasks.md#task-1` |
| **REQ-02** | “页脚的核心问题：1.修订日期所在的Y轴位置不对” | 页脚“修订日期” Y 轴位置与垂直居中几何校准 | `specs/footer-layout-and-preset/spec.md#req-02` | `tasks.md#task-2` |
| **REQ-03** | “页脚的核心问题：2.页码字号不对” | 页脚“动态页码”字号还原为 9pt 与拓扑继承 | `specs/footer-layout-and-preset/spec.md#req-03` | `tasks.md#task-3` |

## Impact Assessment
- **受控范围**：
  1. `web/src/msds-db.js`：国彩预设数据源（`preset_guocai_cn` 与 `preset_guocai_en`）；
  2. `web/src/docx-engine.js`：页脚表格第 0 行单元格垂直对齐与段落间距注入、页码段落及 Run 字号由 24 纠偏为 18。
- **不可变保持现状承诺**：
  1. 16 章节表头、数据行与嵌套表格拓扑绝对保持现状；
  2. `MSDS_UNIVERSAL_DESIGN_TOKENS_IMMUTABLE` 核心字阶与几何标尺不可篡改；
  3. 冠志企业预设及既有化学事实保持现状；
  4. 既有通过的 165 项双轨审计规则绝对不降级。
