# Specification: Producer Workflow Isolation & Fact-Grounded Pipeline Architecture
(`workflow-and-pipeline-invariants.md`)

## 1. 生产 Agent 行为与权限隔离规范 (Producer Workflow Isolation)

### 1.1 绝对只读与无权篡改底座公理
- **SEC-01 (SHALL NOT mutate engine core)**:
  - 负责产出 MSDS/TDS 交付物的任何 Producer Agent **SHALL NOT** 直接编辑或修改 `web/src/` 目录下的任何底座引擎代码（包括但不限于 `docx-engine.js`、`pipeline-engine.js`、`smart-matching.js`、`universal-editor-primitives.js`）。
  - 若遇引擎功能缺失或翻译缺陷，Producer Agent **SHALL** 通过规范的上下文事实入参（`facts` 对象契约）或提请系统底座平台层进行通用立法升级，**SHALL NOT** 私自针对特定单一型号进行局部特判。

### 1.2 标准事实入参契约公理
- **SEC-02 (SHALL pass structured facts)**:
  - Producer Agent **SHALL** 仅通过 `executeEightDeliverablesPipeline` 或通用 MCP 接口向流水线传递结构化事实：
    ```typescript
    interface PipelineFactsContract {
      modelCode: string;
      isHazardous: boolean;
      productNameCn?: string;
      productNameEn?: string;
      categoryCn?: string;
      categoryEn?: string;
      useCn?: string;
      useEn?: string;
      appearanceCn?: string;
      appearanceEn?: string;
      viscosityOverride?: string;
      solidContentOverride?: string;
      components?: Array<{ nameCn: string; nameEn?: string; cas: string; range: string }>;
      section9Overrides?: Record<string, string>;
    }
    ```
  - 流水线引擎 **SHALL** 优先尊重 `facts` 中显式提供的标准化事实；若未提供，**SHALL** 自动通过通用的语义解析器与行业词典进行保真推导，**SHALL NOT** 使用武断的宽泛关键词进行硬编码替换。

---

## 2. 系统底座通用数据驱动与化工英译规范 (General Translation & Normalization)

### 2.1 标签语义解析空白消除容错规范
- **ENG-01 (SHALL normalize label whitespace)**:
  - 在 `smart-matching.js` 和 `pipeline-engine.js` 的所有标签匹配分支中，引擎 **SHALL** 在执行正则比对前，对标签文本执行空白字符剥离：
    ```javascript
    const cleanLabel = (rawLabel || '').replace(/\s+/g, '');
    ```
  - 当输入为 `'外 观：'`、`'外  观'`、`'外观：'` 时，引擎 **SHALL** 均能 100% 正确匹配并提取对应值。

### 2.2 环氧与化工品类英译多模态分类规范
- **ENG-02 (SHALL distinguish anhydrous vs waterborne epoxy)**:
  - 当产品中文名称或化学品分类中包含 `无水环氧`、`非水环氧` 或 `无水` 时，品名英文 **SHALL** 解析为 `Anhydrous epoxy resin ${modelCode}`，化学品分类英文 **SHALL** 解析为 `Anhydrous epoxy resin`，**SHALL NOT** 包含 `Waterborne` 或 `emulsion` 或 `dispersion`；
  - 当且仅当产品名称或分类明确包含 `水性`、`乳液`、`分散体` 时，方可使用 `Waterborne epoxy emulsion` 或 `Waterborne epoxy dispersion`；
  - 当产品名称包含 `固化剂` 时，**SHALL** 保持 `Waterborne epoxy curing agent`。

### 2.3 英文排版微观标点规范
- **ENG-03 (SHALL insert space after punctuation in joined sentences)**:
  - 在生成英文版多句陈述（如 Section 5.4 消防措施、Section 6.1 应急措施）时，引擎 **SHALL** 确保句子终止符（`.`、`!`、`?`、`)` 等）与后续句子的首字母之间存在至少一个标准半角空格（`\x20`），**SHALL NOT** 产生 `(SCBA)Do` 类似黏连；
  - 在生成英文版叙述性段落值格时，整句末尾 **SHALL** 闭合西文半角句点 `.`。

---

## 3. 中央主审计套件物理事实对账门禁 (Fact-Grounded Master Audit Gate)

### 3.1 核心理化与物料事实锚定断言
- **AUD-01 (SHALL assert physical facts against source)**:
  - `run_master_msds_audit.mjs` **SHALL** 增加事实物理锚定门禁断言：
    - 断言 1: `Section 9.1 外观中英文物理真实性`：从交付物 DOCX/PDF 提取的外观值 **SHALL** 与源文件物理事实 100% 吻合（例如源文件为“微黄透明状液体”，产出物为“乳白液体”时直接 Hard Blocker 拦截退出）；
    - 断言 2: `Section 1.1 品名与分类无水环氧形态保真`：当源文件载明为“无水环氧”时，英文产出物 **SHALL NOT** 包含 `Waterborne` 或 `emulsion`。
  - 只有在排版几何合规 **AND** 核心事实 100% 保真时，主审计套件方可给出 `AUDIT_PASSED`（退出码 0）。
