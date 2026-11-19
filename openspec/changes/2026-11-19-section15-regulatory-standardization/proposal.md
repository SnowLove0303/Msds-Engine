# Proposal: Section 15 法规信息全面规范化与双语排版净化

> **所属需求协议**：OrbitStack (Ps-openspec) 轨道工程体系 Step 2 规格立法  
> **关联前置立案**：`2026-11-19_Section15法规信息全面规范化改进_需求零损耗立案对账备忘录.md` (Gate 1 Approved)  
> **核心原则**：数量 1:1 绝对守恒，零外生捏造，事实指纹不可篡改核销

---

## 1. 需求背景与痛点溯源

在 MSDS 全套 8 交付物（中英双语 × 冠志国彩双预设 × DOCX/PDF 双格式）生成流程中，第 15 部分（Section 15 法规信息）暴露出两项系统性排版与内容缺陷：
1. **中文版 Row 1 标题行被源文档散文污染**：
   在 `smart-matching.js` 中，源文档中 `遵循法规：- 《危险化学品安全管理条例》...` 被提取为 `safety_regulations` 并直接写入了表格第 1 行（Row 1），导致官方模板原有的结构性子标题 `"物质或混合物的相关安全、健康和环保法律法规"` 被彻底覆盖。而在第 3 行 `"符合下列法规要求："` 之后，第 4~7 行又重复罗列了相同的 4 部法规，造成同一表格内法规信息发生严重且丑陋的 2 次重复。
2. **英文版标点排版瑕疵 (`: .` 冒号句号重叠)**：
   英文版 Row 2 与 Row 3 分别渲染为 `Other provisions: .` 与 `Complies with the following regulations: .`。经代码级法医溯源，根因系 `universal-editor-primitives.js` 的 `applyGlobalTypographyProjection` 在处理单列标签时，末尾附加了西文空格，导致后续西文句子末尾补句号的正则 `!/[.!?:]$/.test(tc)` 发生误判（因为末尾字符为空格而非冒号），从而在冒号后强行插入了半角句号 `.`。

---

## 2. 1:1 需求物理对账矩阵 (RTM - 100% 守恒映射)

| 需求编号 | 需求名称与核心契约 (RFC 2119) | 影响模块 | 验收标准 [Measured] |
| :---: | :--- | :--- | :--- |
| **RTM-S15-01** | 中文版 Row 1 **SHALL** 严格保持为官方底模法定二级标题 `"物质或混合物的相关安全、健康和环保法律法规"`，严禁被源文档散文覆写 | `smart-matching.js`<br>`pipeline-engine.js` | `s15Cn.rows[1].cells[0].text === '物质或混合物的相关安全、健康和环保法律法规'`，散文重复率为 0 |
| **RTM-S15-02** | 法规条目 **SHALL** 仅在第 3 行 `"符合下列法规要求："` 后逐行独立分布（第 4~7 行），承载 591 号令、GB/T 16483、GB 13690、GB 30000.2-29，严禁跨行重复 | `pipeline-engine.js`<br>`smart-matching.js` | 4 部法规在第 4~7 行独立分布，全文法规名称频次恰好为 1 |
| **RTM-S15-03** | 英文版 Row 2 与 Row 3 **SHALL** 净化为标准西文标签 `Other provisions:` 与 `Complies with the following regulations:`，彻底剔除 `: .` 瑕疵 | `universal-editor-primitives.js`<br>`pipeline-engine.js` | 正则 `/:[ \t]*\./.test(s15EnText)` 严格为 `false` |
| **RTM-S15-04** | 双语表格结构 **SHALL** 保持 1:1 同构，非危产品裁剪 GB 15258 统一保持 8 行标准拓扑 | `pipeline-engine.js` | `s15Cn.rows.length === s15En.rows.length === 8` (PA-3654 实测)，双语对账 100% PASS |

---

## 3. 法定双清单 (Dual-List Protocol)

### 3.1 拟变范围清单 (Proposed Changes Scope)
- `web/src/smart-matching.js`:
  - `[Root Source]` 在 Section 15 注入逻辑中，锁定 Row 1 为法定子标题，阻断 `safetyItem.value` 对 Row 1 的覆写。
- `web/src/universal-editor-primitives.js`:
  - `[Root Source]` 修复 `applyGlobalTypographyProjection`：当标签行无后续值时消除多余尾部空格；强化西文标点终结符判定，防止冒号结尾标签被误补句号。
- `web/src/pipeline-engine.js`:
  - `[State Transition]` 强化 `buildBaseChineseEngine` 与 `buildBaseEnglishEngine` 对 Section 15 的拓扑保护；在后置排版净化中增加防 `: .` 兜底守卫。

### 3.2 保持现状承诺清单 (Leave-as-is Invariants)
- **Sections 1~14 与 Section 16**：现有拓扑、智能匹配与中英翻译逻辑完全保持现状，绝对不触碰；
- **官方模板物理文件**：`web/public/templates/` 下的 DOCX 模板文件绝对只读，禁止篡改；
- **企业预设与法人元数据**：`msds-db.js` 与预设数据库完全保持现状；
- **双极双层审计标准**：审计门禁只增不减，已有全部门禁规则保持零警告零错误运行。
