# Proposal: MSDS-Engine 底层通用性根治工程规格提案

> **Change ID**: `2026-11-19-universal-engine-root-cause-refactor`  
> **Status**: PROPOSED (Gate 2 In Progress)  
> **Author**: Antigravity (Sole Engine Maintainer)  
> **Target Modules**: `web/src/docx-engine.js`, `web/src/recognition-engine.js`, `web/src/context-governor.js`, `web/src/smart-matching.js`, `web/src/pipeline-engine.js`

---

## 1. 业务动机与最高工程宗旨

在近期对 `PA-3654`、`PA-4914`、`EP-1501` 等产品的覆写产出与全景审计中，发现产出物普遍存在：
- Section 1 中文版化学品分类单元格 100% 留空；
- Section 8.2 易燃液体工程控制措施 100% 留空；
- Section 8 职业接触限值嵌套表格整表丢失导致数据行 0 行断头；
- Section 2 GHS 分类识别全空（`categories: []`）及吸入急性毒性被单方面删改；
- Section 14 英文正式运输名称（UN proper shipping name）空白及非危品运输标题误塞 UN 字段；
- Section 15 法规被静态模板硬编码洗脑覆盖源文件法令等 19 大系统性缺陷。

根据用户作为系统唯一管理者的最高授权指令：**必须基于通用性准则（Universal Principles），从根本上解决底层解析致盲、识别漏项与流水线过度剪枝的问题，严禁任何针对特定型号的局部硬编码特判创可贴**。

---

## 2. 1:1 Spec-Kit RTM 需求注入守恒矩阵

本提案 1:1 注入并守恒 Step 0 获批的 8 大需求包（REQ-01 至 REQ-08）：

| 需求包 | 需求名称 | 关联缺陷 | 架构落点 | 核心目标 |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | 底座解析全拓扑感知 | PROB-10 | `web/src/docx-engine.js` | 递归遍历 `w:tc -> w:tbl` 嵌套表格，文本合并至 `cell.text`，数据挂载至 `cell.nestedTables` |
| **REQ-02** | 标识信息通用无损抽取 | PROB-01~04 | `web/src/recognition-engine.js`<br>`web/src/context-governor.js`<br>`web/src/pipeline-engine.js` | 通用捕获 `chemicalClassification`，中英文双向透传绑定，严禁中文分类单元格空白 |
| **REQ-03** | GHS 跨行容差状态机 | PROB-05~07 | `web/src/recognition-engine.js`<br>`web/src/smart-matching.js` | 跨行扫描状态机捕获全部危险类别；支持“警示词”同义词；坚守不可否定公理保留吸入毒性 |
| **REQ-04** | 防范说明容差与路由 | PROB-08~09 | `web/src/recognition-engine.js`<br>`web/src/pipeline-engine.js` | 复合 P 码空格容差；分组无中括号路由；非危单行段落强制断行 |
| **REQ-05** | 接触限值与 PPE 聚合 | PROB-11~13 | `web/src/recognition-engine.js`<br>`web/src/pipeline-engine.js` | 动态提取嵌套限值并渲染数据行；手部防护多行规格聚合；工程控制非空守恒与纠偏 |
| **REQ-06** | 毒理学多端点承接 | PROB-14 | `web/src/recognition-engine.js`<br>`web/src/smart-matching.js` | 独立支持皮肤刺激与粘膜刺激，杜绝相互覆盖与抹除 |
| **REQ-07** | 运输信息通用语义解耦 | PROB-15~18 | `web/src/recognition-engine.js`<br>`web/src/pipeline-engine.js` | 区分非危运输方式与 UN 字段；英文正式运输名槽位绑定；从句完整保留；温控去重 |
| **REQ-08** | 法规条目结构化与反覆盖 | PROB-19 | `web/src/recognition-engine.js`<br>`web/src/pipeline-engine.js` | 法规切分为条目数组输出；源文件明确载明的历史法令（如 344 号令）绝对保护，禁模板覆盖 |

---

## 3. 影响范围与爆炸半径评估

- **可变文件（封闭因果集）**：
  1. `web/src/docx-engine.js`：嵌套表格递归抽取；
  2. `web/src/recognition-engine.js`：状态机升级、槽位扩充与容差解析；
  3. `web/src/context-governor.js`：分类与运输事实双语对齐；
  4. `web/src/smart-matching.js`：反删改保护与多端点映射；
  5. `web/src/pipeline-engine.js`：非空质量门禁、限值渲染与文本去重。
- **绝对保持现状资产（只读承重墙）**：
  - `web/public/templates/` 官方标准模板（SHA-256 绝对锁定）；
  - `web/src/universal-editor-primitives.js` 几何拓扑与单元格底层写入原子通道；
  - `web/scripts/lint_code_invariants.mjs` 架构不变量 10 大硬门禁（严禁针对单一型号特判）。
