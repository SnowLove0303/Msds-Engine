# Architecture Design: Producer Workflow Isolation & Fact-Grounded Pipeline Architecture
(`design.md`)

## 一、 系统架构设计与责任边界 (Architecture & Separation of Concerns)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           1. 原始事实层 (Ground Truth)                            │
│  源文件 (PDF / DOCX): EP-1404msds_CN 冠志_.pdf / 事实指纹 100% 物理留存          │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ 结构化事实感知
┌───────────────────────────────────────▼─────────────────────────────────────────┐
│                    2. 生产 Agent 执行层 (Producer Agent)                         │
│  • 角色定义: 纯粹的【数据调度者与事实提取者】，绝对剥离修改引擎代码权限          │
│  • 输入: 提取规范化的 facts 结构体 (品名、分类、外观、组分、粘度、固含)           │
│  • 禁止动作: 严禁编写 ad-hoc 脚本直接修改底层 XML/DOCX，严禁在引擎写特判       │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ 纯粹数据入参 (PipelineFactsContract)
┌───────────────────────────────────────▼─────────────────────────────────────────┐
│                    3. MSDS-Engine 底座平台层 (Pipeline & Editor)                 │
│  • pipeline-engine.js:                                                          │
│    - 增加无水环氧 (Anhydrous epoxy resin) 通用分支，废除环氧一律水性乳液的硬编码 │
│    - 消除标签空格陷阱 (normalize label whitespace)                              │
│    - 英文拼接自动补空格与句末闭合句点                                           │
│  • smart-matching.js:                                                           │
│    - 统一消除标签内部全角/半角空格，确保 '外 观' 与 '外观' 100% 成功映射       │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ 受控编译派生 (8 格式交付物)
┌───────────────────────────────────────▼─────────────────────────────────────────┐
│                    4. 审计与质量门禁层 (Adversarial & Master Audit)              │
│  • 集中式主审计 (run_master_msds_audit.mjs):                                    │
│    - 增设核心事实锚定断言: Section 9.1 外观物理对账、Section 1.1 形态物理对账   │
│    - 阻断虚假满分 144 项漏洞，事实篡改直接 Exit Code 1                          │
│  • 敌手认知审计 (Subagent Auditor):                                             │
│    - 16 章节深入 OOXML 与 PDF 物理流深度对账，把控准出                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、 核心技术实现方案 (Technical Specifications)

### 1. `pipeline-engine.js` 通用英译与硬编码消除
- **品名英译重构**：
  在 `buildBaseEnglishEngine` 中，判断中文名称与分类时增加优先匹配：
  ```javascript
  if (/无水|非水|无溶剂/i.test(cnName + ' ' + cnCategory) && /环氧/i.test(cnName + ' ' + cnCategory)) {
    prodName = `Anhydrous epoxy resin ${modelCode}`;
  } else if (/环氧/i.test(cnName + ' ' + cnCategory) && /固化剂/i.test(cnName + ' ' + cnCategory)) {
    prodName = `Waterborne epoxy curing agent ${modelCode}`;
  } else if (/水性.*环氧|环氧.*乳液|环氧.*分散体/i.test(cnName + ' ' + cnCategory)) {
    prodName = `Waterborne epoxy emulsion ${modelCode}`;
  } else if (/环氧/i.test(cnName + ' ' + cnCategory)) {
    prodName = `Epoxy resin ${modelCode}`;
  }
  ```
- **分类英译重构** (`translateChemicalCategoryToEnglish`)：
  ```javascript
  if (/无水|非水/i.test(combined) && /环氧/i.test(combined)) {
    return 'Anhydrous epoxy resin';
  }
  if (/环氧/i.test(combined)) {
    if (/乳液/i.test(combined)) return 'Waterborne epoxy emulsion';
    return 'Epoxy water dispersion';
  }
  ```
- **英文多句拼接空格修复 (OBS-01)**：
  在英文多句组装逻辑中，确保标点后加入半角空格：
  ```javascript
  .replace(/([.!?\)])([A-Za-z])/g, '$1 $2')
  ```
- **英文句末句号闭合 (OBS-02)**：
  在英文长句段落末尾检测若无闭合标点，自动补上 `.`。

### 2. `smart-matching.js` 标签空格清洗
在 `resolveSlotBySemantics` 与 Section 9 匹配逻辑中：
```javascript
const normLabel = (rawLabel || '').replace(/\s+/g, '').replace(/[：:]$/, '');
```
使 `'外 观'`、`'外  观'`、`'外观'` 统一归一化为 `'外观'`，彻底消除由于模板空格导致的替换失效。

### 3. `run_master_msds_audit.mjs` 增设物理事实硬断言
在层 2 审计中增加：
- `Section 9.1 外观源文件保真门禁`：提取交付物 Section 9.1 值，若源文件包含“微黄”或“透明”，产出物绝不可为“乳白”；
- `Section 1.1 品名与分类保真门禁`：若源文件包含“无水环氧”，英文绝不可为 `Waterborne epoxy emulsion`。

---

## 三、 法定双清单自证 (The Mandatory Dual-Scope Lists)

### 1. 拟变范围清单 (Proposed Changes - 最小因果集)

| 序号 | 变更资产路径 | 因果角色分类 | 变更要点与目的 |
| :---: | :--- | :--- | :--- |
| 1 | `web/src/pipeline-engine.js` | `[Root Source]` | 根除品名/分类硬编码，增加无水环氧支持；增加英文拼接自动补空格与标点闭合 |
| 2 | `web/src/smart-matching.js` | `[Root Source]` | 增加标签内部空格消除归一化，解决 `'外 观'` 匹配失效根因 |
| 3 | `web/scripts/run_master_msds_audit.mjs` | `[State Transition]` | 增设核心理化事实（外观、无水环氧品名分类）物理对账硬门禁断言 |
| 4 | `web/scripts/build_ep1404_source.mjs` | `[Remediation]` | 修复 Agent 的 regex，使用通用归一化标签，生成包含“微黄透明状液体”的正确源 docx |
| 5 | `web/scripts/generate_ep1404_deliverables.mjs` | `[Remediation]` | 重新驱动流水线生成 EP-1404 8 份标准交付物并保持最新 Section 2 阶梯排版 |

### 2. 保持现状承诺清单 (Leave-as-is Commitments - 绝对不触碰既有承重墙)

| 序号 | 承诺保持现状模块与代码区 | 保护原因与承重墙背景说明 |
| :---: | :--- | :--- |
| 1 | `web/src/docx-engine.js` (Section 2 缩进状态机) | 刚刚在上一轮获得用户确认并通过验证的 480/840 twips CN、317/677 twips EN 阶梯几何排版，**绝对保持现状**，严禁篡改； |
| 2 | `web/src/universal-editor-primitives.js` (Section 2/15 标签加粗) | 刚刚固化的 `INV-BOLD-S2-S15` 结构性题头与标签加粗硬防线，**绝对保持现状**； |
| 3 | Section 8 `手部防护：` 白名单与 12pt/9.5pt 字号均一性 | `INV-PRUNE-01` 与 `INV-FONT-UNIFORMITY` 承重墙，**绝对保持现状**； |
| 4 | Section 9 `x0 = 80.28pt` 绝对垂直对齐线 | 官方底模几何规范，**绝对保持现状**； |
| 5 | EP 系列既有已验收 5 大型号交付物 (`EP-1736` ~ `EP-1737`) | 已满分验收归档文件，**绝对保持现状，不重写、不覆写、不污染**。 |
