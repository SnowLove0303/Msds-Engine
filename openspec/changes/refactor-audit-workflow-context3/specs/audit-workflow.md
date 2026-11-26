# Spec: 最终工作流 Agent 审计任务 1（内容审计与合并版 Context 3）

## Requirement: RTM-01 最终工作流审计阶段任务序列重构
- The final workflow audit stage (`msds-studio/SKILL.md` Phase 10 / 阶段 6) **SHALL** define an explicit, ordered **Agent 审计任务序列 (Agent Audit Task Sequence)** starting with **Agent 审计任务 1（内容审计）**, and **SHALL** reserve extensible task slots (`Agent 审计任务 2` / `任务 3` 等) for subsequent audit dimensions (e.g., topology/geometry, PDF rendering).

## Requirement: RTM-02 主预设双语无损识别与次预设隔离核验
- **WHEN** executing **Agent 审计任务 1（内容审计）** for a model, the Agent **SHALL** invoke the official recognition engine (`recognition-engine.js` via `msds_recognize_source` /受控生成脚本) on the primary preset's Chinese `.docx` and English `.docx` deliverables (e.g., `冠志 CN` and `Guanzhi EN`) to produce **Context 3**.
- Both CN and EN recognitions **SHALL** achieve lossless verification (`missingParagraphCount === 0`, `coveredSectionsCount === 16`).
- For secondary presets (e.g., `国彩 CN/EN`), the workflow **SHALL** perform entity-isolation verification without requiring duplicate full Context 3 `.md` files.

## Requirement: RTM-03 中英文 Context 3 同文档合并与三方对照表
- For each audited model, the CN Context 3 and EN Context 3 outputs **SHALL** be merged into **a single Markdown file** (`<MODEL>_context3.md`), containing:
  1. **三方对照总览表**：`Context 1（源文件） vs Context 3（CN） vs Context 3（EN）` 1–16 章节逐章对账摘要与判定列；
  2. **中文产出物 Context 3 全量识别视图**（1–16 章节原始网格、段落与无损指纹）；
  3. **英文产出物 Context 3 全量识别视图**（1–16 章节原始网格、段落与无损指纹）。

## Requirement: RTM-04 内容继承原则与底层硬性规定兼顾判定
- **WHEN** comparing Context 1 against merged Context 3 (CN & EN), the audit **SHALL** enforce the principle of **“内容来源于源文件、源文件内容继承”**, flagging unexpected content loss, untranslated Chinese residuals in EN, or paragraph structure degradation as `FAIL`.
- **HOWEVER**, intentional transformations mandated by **底层硬性规定 (Underlying Hard Specifications)** **SHALL NOT** be flagged as failures and **SHALL** be classified as `PASS (硬规合规调整)`:
  1. **Section 8 规范子节顺序**：`8.1 暴露控制 / Exposure controls` 严格先于 `8.2 控制参数 / Control parameters`；
  2. **企业主体预设绑定**：Section 1 企业名称、注册地址（如 `黄埔区`）、电话/传真及页眉页脚随预设动态更新；
  3. **非危险品防虚增去重**：`!isHazardous` 时剔除冗余 `GHS-象形图` / `信号词` / 重复非危声明；
  4. **标点/单位/表格拆行规范化**：Section 3 多行合并拆分、Section 14 合并行拆分、`°C` / `≥` 等标准符号规范化。
