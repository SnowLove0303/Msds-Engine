# MAINTENANCE_GUIDE.md — MSDS-Engine 系统维护与防复发工程指南

> **定位**：本文件为 `MSDS-Engine` 依据 **Ps-openspec 体系**构建的工程维护与排障总指南。任何开发者或 AI Agent 在排查异常、修改源码或沉淀规则前，必须先依据本指南完成**模块权责定位 → 通用性审查 → 底层/同源修复 → 机械审计下沉 → 修改标识登记**。

---

## 一、 30 秒排障速查卡（现象 → 唯一责任模块）

遇到任何产出或流程异常时，**禁止盲目在末端打补丁**，先按现象精准路由到唯一主责模块：

| 异常现象（Symptom） | 唯一主责模块 | 典型根因示例 | 禁止动作 |
| :--- | :--- | :--- | :--- |
| 源文某行漏抽、表格格数识别错误 | `web/src/recognition-engine.js` | 解析源 DOCX 合并格或段落遗漏 | 禁止在下游凭空补写源文 |
| 英文残留中文、数字丢失、S9 双项打包未拆、S5 续行变说明行、S8 OEL 单格未解析、`控制参数`未配对 | `web/src/context-governor.js` | `Context 2` 语义分类、拆行或翻译字典缺失 | 禁止在 `topology-matcher.js` 里硬拆文本 |
| 标签与值张冠李戴（如 `9.3 离子性` 写进 `pH值`）、新增行无左侧标签、先剪枝导致克隆少列 | `web/src/topology-matcher.js` | 序号匹配覆盖语义锚点、漏写 `cell 0`、剪枝/克隆时序颠倒 | 禁止删改 `@ANTIGRAVITY_INVARIANT_LOCK` 封印外延逻辑而无标识 |
| 标签/值/序号/说明行字体字号粗细不一、未编号标签首字缩进锯齿、`vAlign` 居上、单行继承超高 `trHeight` | `web/src/docx-engine.js` & `web/src/template-editor.js` | 同角色未走统一排版真源、`writeCellValue` 未清行高/未设 `vAlign="center"` | 禁止只针对某一个章节或型号写特判补丁 |
| 页眉/页脚公司信息或修订日期不对 | `web/src/universal-editor-primitives.js` (`bindEntityPresetToDocument`) | 未注入当天日期或 Preset 槽位映射缺失 | 禁止只在某一上层脚本单独改日期 |
| 某类缺陷修复后又复发、或机械检查未拦住 | `web/src/staged-mechanical-audit.js` & `web/scripts/lint_code_invariants.mjs` | 缺少对应的 `PHASE_5/6` 或静态 Lint 硬门禁 | 禁止只靠口头提示词提醒“下次注意” |

---

## 二、 通用性维护三大铁律

1. **禁止单型号/特定词特判（Anti-Overfitting）**：
   - 严禁出现 `if (modelCode === 'OS-8000')` 或仅针对某一句固定文案的硬编码修复；所有修复必须抽象为**通用数据形态或角色规则**（如“所有 `!c0 && c1` 紧跟 `SEQ_LABEL` 的续行”、“所有双列 KV 未编号标签统一 `w:left=targetTabDxa`”）。
2. **角色驱动单一排版真源（Role-Driven Single Source）**：
   - 同属一类角色（`SECTION_HEADER`、`SEQ_LABEL`、`SUB_LABEL`、`EXPLANATION`、`VALUE`、`HEADER/FOOTER`）的字段，其字体、字号、粗细、垂直对齐与缩进层级必须在底层（`docx-engine.js`、`topology-matcher.js` 角色透传、`template-editor.js` `applyTopologyTypographyLock`）保持 **100% 统一**，绝不允许出现“同属标签却字体/缩进不同”。
3. **缺陷修在第一现场（Origin Producer Fix）**：
   - 属于语义分类/拆行的问题修在 `context-governor.js`；属于写格对齐/行高/日期的问题下沉修在 `docx-engine.js` / `universal-editor-primitives.js`，禁止在末端做表面遮盖。

---

## 三、 防复发与防覆盖锁定闭环（Ps-openspec Self-Iterating）

```text
发现缺陷 ─▶ 定位唯一主责模块 ─▶ 通用性正向修复 ─▶ 标注 @FIX_TAG
                                                          │
   ┌──────────────────────────────────────────────────────┘
   ▼
下沉固化：在 staged-mechanical-audit.js 或 lint_code_invariants.mjs 新增机械门禁
   │
   ▼
封印保护：核心不变量区块使用 @ANTIGRAVITY_INVARIANT_LOCK_START / END 保护（Lint 自动校验成对完整性）
   │
   ▼
验证与台账：npm run lint 退出码 0 + 标准 7 阶段产出全绿 + 登记 CHANGELOG.md + 重新打包 Workflow Kit
```

1. **机械下沉法则（纠错即立项为机械门禁）**：凡属通用结构或排版类缺陷，修复同时必须在 `staged-mechanical-audit.js` 或 `lint_code_invariants.mjs` 中增加确定性断言（如已固化的 `P5_KV_LABEL_NON_EMPTY`、`P5_LABEL_INDENT_ALIGN`、`P5_KV_VALIGN_CENTER`）。
2. **源码级防覆盖封印**：
   - 关键底层逻辑块必须使用成对注解保护：
     - `// @ANTIGRAVITY_INVARIANT_LOCK_START: <保护原因与不可变契约>`
     - `// @ANTIGRAVITY_INVARIANT_LOCK_END`
   - `lint_code_invariants.mjs`（`LINT-LOCK-01`）会在每次 `npm run lint` 时自动校验所有封印起止标记是否完整成对，防止误删或截断破坏。

---

## 四、 每次修改显式标识规范（`@FIX_TAG`）

每次对源码或规范进行逻辑修改，**必须**在修改处紧邻位置添加标准修改标识注释，并在 `CHANGELOG.md` 中同步留存：

```javascript
// @FIX_TAG(YYYY-MM-DD/<module>/<FIX-ID>): <一句讲清根因与通用性修复边界>
// 示例:
// @FIX_TAG(2026-11-23/docx-engine/FIX-VALIGN-HEIGHT): 2列及以上KV写入时统一注入vAlign=center并清除单行过高固定trHeight
```

- **必填字段**：日期（`YYYY-MM-DD`）、所属模块短名、唯一 `FIX-ID`、通用性根因说明。
- **台账联动**：`CHANGELOG.md` 中按 `[FIX-ID]` 记录“症状 → 根因模块 → 通用修复 → 新增机械审计/Lint 门禁”。

---

## 五、 单次缺陷修复 OpenSpec 最小归档模板（提案 B）

遇到非平凡缺陷需要走 OpenSpec 立项修复时，直接在 `openspec/changes/<fix-slug>/` 按以下最小结构立案归档：

1. `proposal.md`：原话/现象指纹 + `1:1 RTM`（问题点 → 预期行为）+ 拟变/保持现状双清单。
2. `specs/<domain>/spec.md`：至少 1 条 RFC 2119 契约（`SHALL` / `SHALL NOT`）及对应机械审计/Lint 落点。
3. `tasks.md`：单焦点原子任务（`[-] 定位与修复` → `[-] 补充机械审计/Lint` → `[-] 实测验证` → `[-] @FIX_TAG 与 CHANGELOG 闭环`）。
